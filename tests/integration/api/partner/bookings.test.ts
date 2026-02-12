import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest } from '../../../helpers/mock-request';
import { makeBooking } from '../../../helpers/factories';
import { clearAllCookies } from '../../../helpers/cookie-helpers';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

const mockGetSessionPartnerId = vi.fn();
const mockGetPartnerName = vi.fn();

vi.mock('@/lib/partner-auth', () => ({
  getSessionPartnerId: (...args: unknown[]) => mockGetSessionPartnerId(...args),
  getPartnerName: (...args: unknown[]) => mockGetPartnerName(...args),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { GET } from '@/app/api/partner/bookings/route';

describe('GET /api/partner/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCookies();
  });

  it('returns 401 without partner session', async () => {
    mockGetSessionPartnerId.mockResolvedValue(null);

    const req = createRequest('GET', 'http://localhost:3000/api/partner/bookings');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns bookings with statusCounts', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');
    mockGetPartnerName.mockResolvedValue('Vinmec');

    const booking = makeBooking({ partnerId: 'vinmec' });
    mockPrisma.booking.findMany.mockResolvedValue([booking]);
    mockPrisma.booking.count.mockResolvedValue(1);
    mockPrisma.booking.groupBy.mockResolvedValue([
      { status: 'pending', _count: 1 },
      { status: 'confirmed', _count: 0 },
    ]);
    mockPrisma.auditLog.create.mockResolvedValue({});

    const req = createRequest('GET', 'http://localhost:3000/api/partner/bookings');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bookings).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.partnerName).toBe('Vinmec');
    expect(body.statusCounts).toBeDefined();
    expect(body.statusCounts.pending).toBe(1);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
  });
});
