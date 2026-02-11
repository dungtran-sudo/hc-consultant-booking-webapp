import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';
import { makeBooking } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/partner-auth', () => ({
  getPartnerName: vi.fn((id: string) => id.toUpperCase()),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { GET } from '@/app/api/admin/bookings/route';

describe('GET /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/admin/bookings');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns paginated bookings', async () => {
    const booking = makeBooking({ partnerName: 'Vinmec' });
    mockPrisma.booking.findMany.mockResolvedValue([booking]);
    mockPrisma.booking.count.mockResolvedValue(1);

    const req = createAdminRequest('GET', 'http://localhost:3000/api/admin/bookings?page=1&limit=10');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bookings).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(body.bookings[0].bookingNumber).toBe(booking.bookingNumber);
    expect(mockPrisma.booking.findMany).toHaveBeenCalledOnce();
    expect(mockPrisma.booking.count).toHaveBeenCalledOnce();
  });

  it('applies status filter', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.booking.count.mockResolvedValue(0);

    const req = createAdminRequest('GET', 'http://localhost:3000/api/admin/bookings?status=confirmed');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const findManyCall = mockPrisma.booking.findMany.mock.calls[0][0];
    expect(findManyCall.where.status).toBe('confirmed');
  });
});
