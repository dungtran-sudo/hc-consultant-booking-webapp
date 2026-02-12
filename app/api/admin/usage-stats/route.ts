import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthlyBudget = parseFloat(process.env.LLM_MONTHLY_BUDGET_USD || '200');
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyBudget = monthlyBudget / daysInMonth;

    const [
      monthlyAgg,
      dailyAgg,
      monthlyCount,
      dailyCount,
      bySpecialtyMonth,
      bySpecialtyDay,
    ] = await Promise.all([
      prisma.apiUsageLog.aggregate({
        _sum: { estimatedCostUsd: true, promptTokens: true, completionTokens: true, totalTokens: true },
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.apiUsageLog.aggregate({
        _sum: { estimatedCostUsd: true, promptTokens: true, completionTokens: true, totalTokens: true },
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.apiUsageLog.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.apiUsageLog.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.apiUsageLog.groupBy({
        by: ['specialty'],
        where: { createdAt: { gte: startOfMonth } },
        _count: true,
        _sum: { estimatedCostUsd: true },
      }),
      prisma.apiUsageLog.groupBy({
        by: ['specialty'],
        where: { createdAt: { gte: startOfDay } },
        _count: true,
        _sum: { estimatedCostUsd: true },
      }),
    ]);

    return NextResponse.json({
      daily: {
        cost: dailyAgg._sum.estimatedCostUsd || 0,
        promptTokens: dailyAgg._sum.promptTokens || 0,
        completionTokens: dailyAgg._sum.completionTokens || 0,
        totalTokens: dailyAgg._sum.totalTokens || 0,
        callCount: dailyCount,
        budget: dailyBudget,
        utilizationPercent: dailyBudget > 0
          ? ((dailyAgg._sum.estimatedCostUsd || 0) / dailyBudget) * 100
          : 0,
      },
      monthly: {
        cost: monthlyAgg._sum.estimatedCostUsd || 0,
        promptTokens: monthlyAgg._sum.promptTokens || 0,
        completionTokens: monthlyAgg._sum.completionTokens || 0,
        totalTokens: monthlyAgg._sum.totalTokens || 0,
        callCount: monthlyCount,
        budget: monthlyBudget,
        utilizationPercent: monthlyBudget > 0
          ? ((monthlyAgg._sum.estimatedCostUsd || 0) / monthlyBudget) * 100
          : 0,
      },
      bySpecialty: {
        month: bySpecialtyMonth.map((s) => ({
          specialty: s.specialty,
          count: s._count,
          cost: s._sum.estimatedCostUsd || 0,
        })),
        today: bySpecialtyDay.map((s) => ({
          specialty: s.specialty,
          count: s._count,
          cost: s._sum.estimatedCostUsd || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
