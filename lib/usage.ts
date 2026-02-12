import { prisma } from '@/lib/db';

// Configuration
const MONTHLY_BUDGET = parseFloat(process.env.LLM_MONTHLY_BUDGET_USD || '200');
const SOFT_CAP_PERCENT = 0.80;
const HARD_CAP_PERCENT = 0.95;

// GPT-4o pricing per 1M tokens
const INPUT_PRICE_PER_M = 2.5;
const OUTPUT_PRICE_PER_M = 10.0;

export function calculateCost(promptTokens: number, completionTokens: number): number {
  return (promptTokens * INPUT_PRICE_PER_M + completionTokens * OUTPUT_PRICE_PER_M) / 1_000_000;
}

export interface BudgetCheckResult {
  allowed: boolean;
  budgetWarning: boolean;
  monthlyUsed: number;
  monthlyBudget: number;
  dailyUsed: number;
  message?: string;
}

export async function checkBudget(): Promise<BudgetCheckResult> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = MONTHLY_BUDGET / daysInMonth;

  const [monthlyAgg, dailyAgg] = await Promise.all([
    prisma.apiUsageLog.aggregate({
      _sum: { estimatedCostUsd: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.apiUsageLog.aggregate({
      _sum: { estimatedCostUsd: true },
      where: { createdAt: { gte: startOfDay } },
    }),
  ]);

  const monthlyUsed = monthlyAgg._sum.estimatedCostUsd || 0;
  const dailyUsed = dailyAgg._sum.estimatedCostUsd || 0;

  const monthlyHardCap = MONTHLY_BUDGET * HARD_CAP_PERCENT;
  const monthlySoftCap = MONTHLY_BUDGET * SOFT_CAP_PERCENT;
  const dailyHardCap = dailyBudget * HARD_CAP_PERCENT;

  if (monthlyUsed >= monthlyHardCap) {
    return {
      allowed: false,
      budgetWarning: true,
      monthlyUsed,
      monthlyBudget: MONTHLY_BUDGET,
      dailyUsed,
      message: 'Hệ thống tạm ngưng phân tích do đã đạt giới hạn chi phí tháng. Vui lòng liên hệ quản trị viên.',
    };
  }

  if (dailyUsed >= dailyHardCap) {
    return {
      allowed: false,
      budgetWarning: true,
      monthlyUsed,
      monthlyBudget: MONTHLY_BUDGET,
      dailyUsed,
      message: 'Hệ thống tạm ngưng phân tích do đã đạt giới hạn chi phí ngày. Vui lòng thử lại vào ngày mai.',
    };
  }

  const budgetWarning = monthlyUsed >= monthlySoftCap;

  return {
    allowed: true,
    budgetWarning,
    monthlyUsed,
    monthlyBudget: MONTHLY_BUDGET,
    dailyUsed,
    message: budgetWarning
      ? 'Cảnh báo: Chi phí AI đã đạt 80% ngân sách tháng.'
      : undefined,
  };
}

export interface LogUsageParams {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  specialty: string;
  sessionId: string;
  durationMs: number;
  model?: string;
}

export async function logUsage(params: LogUsageParams): Promise<void> {
  const estimatedCostUsd = calculateCost(params.promptTokens, params.completionTokens);

  await prisma.apiUsageLog.create({
    data: {
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens: params.totalTokens,
      estimatedCostUsd,
      model: params.model || 'gpt-4o',
      specialty: params.specialty,
      sessionId: params.sessionId,
      durationMs: params.durationMs,
    },
  });
}

// Estimated max cost of a single GPT-4o request (~2000 input + 3500 output tokens)
const RESERVED_COST_USD = calculateCost(2000, 3500);

/**
 * Reserve a budget slot before calling OpenAI.
 * Creates a placeholder usage log entry so concurrent requests see the reserved cost.
 * Returns the reservation ID to finalize or cancel later.
 */
export async function reserveBudgetSlot(
  specialty: string,
  sessionId: string
): Promise<{ id: string } | null> {
  const budget = await checkBudget();
  if (!budget.allowed) return null;

  const entry = await prisma.apiUsageLog.create({
    data: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: RESERVED_COST_USD,
      model: 'gpt-4o',
      specialty,
      sessionId,
      durationMs: 0,
    },
  });

  return { id: entry.id };
}

/**
 * Finalize a budget reservation with actual usage data.
 */
export async function finalizeBudgetSlot(
  reservationId: string,
  params: LogUsageParams
): Promise<void> {
  const estimatedCostUsd = calculateCost(params.promptTokens, params.completionTokens);

  await prisma.apiUsageLog.update({
    where: { id: reservationId },
    data: {
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens: params.totalTokens,
      estimatedCostUsd,
      durationMs: params.durationMs,
    },
  });
}

/**
 * Cancel a budget reservation (e.g., if the OpenAI call fails).
 */
export async function cancelBudgetSlot(reservationId: string): Promise<void> {
  await prisma.apiUsageLog.delete({
    where: { id: reservationId },
  }).catch(() => {
    // Non-critical: if delete fails, the reserved cost remains (conservative)
  });
}
