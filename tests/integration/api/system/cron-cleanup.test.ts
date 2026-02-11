import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createCronRequest } from '../../../helpers/mock-request';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/crypto', () => ({
  revokeEncKey: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@/lib/db';
import { GET } from '@/app/api/cron/cleanup/route';

const mockPrisma = prisma as unknown as MockPrisma;

describe('GET /api/cron/cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without cron auth', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/cron/cleanup');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns deleted count of 0 when no expired bookings', async () => {
    mockPrisma.booking.findMany.mockResolvedValueOnce([]);

    const request = createCronRequest('http://localhost:3000/api/cron/cleanup');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deleted).toBe(0);
  });

  it('processes expired bookings and returns deleted count', async () => {
    const expiredBookings = [
      { id: 'b1', phoneHash: 'hash-a' },
      { id: 'b2', phoneHash: 'hash-a' },
      { id: 'b3', phoneHash: 'hash-b' },
    ];

    mockPrisma.booking.findMany.mockResolvedValueOnce(expiredBookings);

    // No active bookings remain for any phoneHash
    mockPrisma.booking.count.mockResolvedValue(0);

    mockPrisma.consent.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.booking.updateMany.mockResolvedValue({ count: 3 });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const request = createCronRequest('http://localhost:3000/api/cron/cleanup');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deleted).toBe(3);

    // Verify audit log was created
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'system',
          actorId: 'cron-cleanup',
          action: 'data_expired',
        }),
      })
    );
  });
});
