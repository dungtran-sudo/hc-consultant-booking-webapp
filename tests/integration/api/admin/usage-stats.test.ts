import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
import { GET } from '@/app/api/admin/usage-stats/route';

const mockPrisma = prisma as unknown as MockPrisma;

describe('GET /api/admin/usage-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const request = new Request('http://localhost:3000/api/admin/usage-stats');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 with wrong auth token', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/admin/usage-stats', {
      headers: { Authorization: 'Bearer wrong-token' },
    });
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns 200 with usage data', async () => {
    const monthlyAgg = {
      _sum: {
        estimatedCostUsd: 45.5,
        promptTokens: 500000,
        completionTokens: 400000,
        totalTokens: 900000,
      },
    };

    const dailyAgg = {
      _sum: {
        estimatedCostUsd: 3.25,
        promptTokens: 30000,
        completionTokens: 20000,
        totalTokens: 50000,
      },
    };

    mockPrisma.apiUsageLog.aggregate
      .mockResolvedValueOnce(monthlyAgg)
      .mockResolvedValueOnce(dailyAgg);

    mockPrisma.apiUsageLog.count
      .mockResolvedValueOnce(150)   // monthlyCount
      .mockResolvedValueOnce(12);   // dailyCount

    mockPrisma.apiUsageLog.groupBy
      .mockResolvedValueOnce([
        { specialty: 'cardiology', _count: 80, _sum: { estimatedCostUsd: 25.0 } },
        { specialty: 'dermatology', _count: 70, _sum: { estimatedCostUsd: 20.5 } },
      ])
      .mockResolvedValueOnce([
        { specialty: 'cardiology', _count: 7, _sum: { estimatedCostUsd: 2.0 } },
        { specialty: 'dermatology', _count: 5, _sum: { estimatedCostUsd: 1.25 } },
      ]);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/usage-stats');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    // Monthly stats
    expect(body.monthly.cost).toBe(45.5);
    expect(body.monthly.promptTokens).toBe(500000);
    expect(body.monthly.completionTokens).toBe(400000);
    expect(body.monthly.totalTokens).toBe(900000);
    expect(body.monthly.callCount).toBe(150);
    expect(body.monthly.budget).toBe(200);
    expect(body.monthly.utilizationPercent).toBeCloseTo(22.75); // (45.5 / 200) * 100

    // Daily stats
    expect(body.daily.cost).toBe(3.25);
    expect(body.daily.promptTokens).toBe(30000);
    expect(body.daily.completionTokens).toBe(20000);
    expect(body.daily.totalTokens).toBe(50000);
    expect(body.daily.callCount).toBe(12);

    // By specialty
    expect(body.bySpecialty.month).toHaveLength(2);
    expect(body.bySpecialty.month[0].specialty).toBe('cardiology');
    expect(body.bySpecialty.month[0].count).toBe(80);
    expect(body.bySpecialty.month[0].cost).toBe(25.0);

    expect(body.bySpecialty.today).toHaveLength(2);
    expect(body.bySpecialty.today[0].specialty).toBe('cardiology');
    expect(body.bySpecialty.today[0].count).toBe(7);
    expect(body.bySpecialty.today[0].cost).toBe(2.0);
  });

  it('handles null aggregate sums gracefully', async () => {
    mockPrisma.apiUsageLog.aggregate
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: null, promptTokens: null, completionTokens: null, totalTokens: null } })
      .mockResolvedValueOnce({ _sum: { estimatedCostUsd: null, promptTokens: null, completionTokens: null, totalTokens: null } });

    mockPrisma.apiUsageLog.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    mockPrisma.apiUsageLog.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/usage-stats');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.monthly.cost).toBe(0);
    expect(body.monthly.promptTokens).toBe(0);
    expect(body.monthly.callCount).toBe(0);
    expect(body.daily.cost).toBe(0);
    expect(body.bySpecialty.month).toHaveLength(0);
    expect(body.bySpecialty.today).toHaveLength(0);
  });
});
