import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
import { GET } from '@/app/api/admin/stats/route';

const mockPrisma = prisma as unknown as MockPrisma;

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/admin/stats');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns stats on success', async () => {
    mockPrisma.booking.count
      .mockResolvedValueOnce(10)   // totalActive
      .mockResolvedValueOnce(3)    // totalDeleted
      .mockResolvedValueOnce(5);   // recentCount

    mockPrisma.booking.groupBy
      .mockResolvedValueOnce([
        { status: 'pending', _count: 4 },
        { status: 'confirmed', _count: 3 },
        { status: 'completed', _count: 2 },
        { status: 'cancelled', _count: 1 },
      ])
      .mockResolvedValueOnce([
        { partnerId: 'vinmec', _count: 7 },
        { partnerId: 'simmed', _count: 3 },
      ]);

    mockPrisma.partner.findMany.mockResolvedValueOnce([
      { id: 'vinmec', name: 'Vinmec' },
      { id: 'simmed', name: 'SimMed' },
    ]);
    mockPrisma.consent.count.mockResolvedValueOnce(25);
    mockPrisma.auditLog.count.mockResolvedValueOnce(100);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/stats');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalActive).toBe(10);
    expect(body.totalDeleted).toBe(3);
    expect(body.recentCount).toBe(5);
    expect(body.totalConsents).toBe(25);
    expect(body.totalAuditLogs).toBe(100);
    expect(body.statusCounts).toEqual({
      pending: 4,
      confirmed: 3,
      completed: 2,
      cancelled: 1,
    });
    expect(body.partnerStats).toHaveLength(2);
    expect(body.partnerStats[0].partnerId).toBe('vinmec');
    expect(body.partnerStats[0].count).toBe(7);
  });
});
