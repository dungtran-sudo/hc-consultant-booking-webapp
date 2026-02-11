import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest } from '../../../helpers/mock-request';
import { makeBooking } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

const mockGetSessionPartnerId = vi.fn();

vi.mock('@/lib/partner-auth', () => ({
  getSessionPartnerId: (...args: unknown[]) => mockGetSessionPartnerId(...args),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { PATCH } from '@/app/api/partner/bookings/[id]/status/route';

function callPATCH(body: Record<string, unknown>, id = 'b1') {
  const req = createRequest('PATCH', `http://localhost:3000/api/partner/bookings/${id}/status`, { body });
  return PATCH(req, { params: Promise.resolve({ id }) });
}

describe('PATCH /api/partner/bookings/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without partner session', async () => {
    mockGetSessionPartnerId.mockResolvedValue(null);

    const res = await callPATCH({ status: 'confirmed' });

    expect(res.status).toBe(401);
  });

  it('returns 403 when booking belongs to different partner', async () => {
    mockGetSessionPartnerId.mockResolvedValue('partnerA');
    const booking = makeBooking({ id: 'b1', partnerId: 'partnerB', status: 'pending', isDeleted: false });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);

    const res = await callPATCH({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });

  it('allows pending -> confirmed', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');
    const booking = makeBooking({ id: 'b1', partnerId: 'vinmec', status: 'pending', isDeleted: false });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'confirmed' });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const res = await callPATCH({ status: 'confirmed' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('confirmed');
  });

  it('allows pending -> cancelled', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');
    const booking = makeBooking({ id: 'b1', partnerId: 'vinmec', status: 'pending', isDeleted: false });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'cancelled' });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const res = await callPATCH({ status: 'cancelled' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('cancelled');
  });

  it('allows confirmed -> completed', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');
    const booking = makeBooking({ id: 'b1', partnerId: 'vinmec', status: 'confirmed', isDeleted: false });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'completed' });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const res = await callPATCH({ status: 'completed' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('completed');
  });

  it('rejects completed -> confirmed (400)', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');
    const booking = makeBooking({ id: 'b1', partnerId: 'vinmec', status: 'completed', isDeleted: false });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);

    const res = await callPATCH({ status: 'confirmed' });

    expect(res.status).toBe(400);
  });

  it('rejects cancelled -> pending (400)', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');
    const booking = makeBooking({ id: 'b1', partnerId: 'vinmec', status: 'cancelled', isDeleted: false });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);

    const res = await callPATCH({ status: 'pending' });

    expect(res.status).toBe(400);
  });
});
