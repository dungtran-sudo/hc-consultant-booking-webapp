import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
import { calculateCost, checkBudget, logUsage } from '@/lib/usage';

const mockPrisma = prisma as unknown as MockPrisma;

describe('calculateCost', () => {
  it('calculates cost for typical token counts', () => {
    // (1000 * 2.5 + 500 * 10) / 1_000_000 = (2500 + 5000) / 1_000_000 = 0.0075
    const cost = calculateCost(1000, 500);
    expect(cost).toBeCloseTo(0.0075);
  });

  it('returns 0 for zero tokens', () => {
    const cost = calculateCost(0, 0);
    expect(cost).toBe(0);
  });

  it('handles large token counts', () => {
    // (100000 * 2.5 + 50000 * 10) / 1_000_000 = (250000 + 500000) / 1_000_000 = 0.75
    const cost = calculateCost(100_000, 50_000);
    expect(cost).toBeCloseTo(0.75);
  });
});

describe('checkBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows when under soft cap', async () => {
    // Monthly used $50, daily used $2 — well under 80% of $200
    mockPrisma.apiUsageLog.aggregate
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: 50 } })   // monthly
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: 2 } });   // daily

    const result = await checkBudget();

    expect(result.allowed).toBe(true);
    expect(result.budgetWarning).toBe(false);
    expect(result.monthlyUsed).toBe(50);
    expect(result.monthlyBudget).toBe(200);
    expect(result.dailyUsed).toBe(2);
    expect(result.message).toBeUndefined();
  });

  it('warns at 80% monthly soft cap', async () => {
    // Monthly used $160 = 80% of $200
    mockPrisma.apiUsageLog.aggregate
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: 160 } })  // monthly
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: 2 } });   // daily

    const result = await checkBudget();

    expect(result.allowed).toBe(true);
    expect(result.budgetWarning).toBe(true);
    expect(result.monthlyUsed).toBe(160);
    expect(result.message).toContain('80%');
  });

  it('blocks at 95% monthly hard cap', async () => {
    // Monthly used $190 = 95% of $200
    mockPrisma.apiUsageLog.aggregate
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: 190 } })  // monthly
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: 2 } });   // daily

    const result = await checkBudget();

    expect(result.allowed).toBe(false);
    expect(result.budgetWarning).toBe(true);
    expect(result.monthlyUsed).toBe(190);
    expect(result.message).toBeDefined();
  });

  it('blocks at 95% daily hard cap', async () => {
    // Monthly is fine at $50, but daily exceeds 95% of daily budget
    // Daily budget = 200 / daysInMonth; daily hard cap = dailyBudget * 0.95
    // We set daily usage high enough to trigger the daily hard cap
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyBudget = 200 / daysInMonth;
    const dailyHardCap = dailyBudget * 0.95;

    mockPrisma.apiUsageLog.aggregate
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: 50 } })             // monthly (under cap)
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: dailyHardCap } });   // daily (at cap)

    const result = await checkBudget();

    expect(result.allowed).toBe(false);
    expect(result.budgetWarning).toBe(true);
    expect(result.dailyUsed).toBeCloseTo(dailyHardCap);
    expect(result.message).toBeDefined();
  });

  it('handles null aggregate sums (no usage records)', async () => {
    mockPrisma.apiUsageLog.aggregate
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: null } })
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: null } });

    const result = await checkBudget();

    expect(result.allowed).toBe(true);
    expect(result.budgetWarning).toBe(false);
    expect(result.monthlyUsed).toBe(0);
    expect(result.dailyUsed).toBe(0);
  });
});

describe('logUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates ApiUsageLog record with correct estimatedCostUsd', async () => {
    mockPrisma.apiUsageLog.create.mockResolvedValueOnce({});

    await logUsage({
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      specialty: 'cardiology',
      sessionId: 'session-123',
      durationMs: 2000,
    });

    expect(mockPrisma.apiUsageLog.create).toHaveBeenCalledOnce();
    const callArgs = mockPrisma.apiUsageLog.create.mock.calls[0][0];
    expect(callArgs.data.promptTokens).toBe(1000);
    expect(callArgs.data.completionTokens).toBe(500);
    expect(callArgs.data.totalTokens).toBe(1500);
    expect(callArgs.data.specialty).toBe('cardiology');
    expect(callArgs.data.sessionId).toBe('session-123');
    expect(callArgs.data.durationMs).toBe(2000);
    expect(callArgs.data.model).toBe('gpt-4o');
    // estimatedCostUsd = (1000 * 2.5 + 500 * 10) / 1_000_000 = 0.0075
    expect(callArgs.data.estimatedCostUsd).toBeCloseTo(0.0075);
  });

  it('uses custom model when provided', async () => {
    mockPrisma.apiUsageLog.create.mockResolvedValueOnce({});

    await logUsage({
      promptTokens: 200,
      completionTokens: 100,
      totalTokens: 300,
      specialty: 'dermatology',
      sessionId: 'session-456',
      durationMs: 1500,
      model: 'gpt-4o-mini',
    });

    const callArgs = mockPrisma.apiUsageLog.create.mock.calls[0][0];
    expect(callArgs.data.model).toBe('gpt-4o-mini');
  });
});
