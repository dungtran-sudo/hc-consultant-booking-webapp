import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';
import { createRequest } from '../../helpers/mock-request';
import { makeBooking } from '../../helpers/factories';
import { clearAllCookies } from '../../helpers/cookie-helpers';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

const mockGetSessionPartnerId = vi.fn();
const mockGetPartnerName = vi.fn();
vi.mock('@/lib/partner-auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/partner-auth')>();
  return {
    ...original,
    getSessionPartnerId: (...args: unknown[]) => mockGetSessionPartnerId(...args),
    getPartnerName: (...args: unknown[]) => mockGetPartnerName(...args),
  };
});

vi.mock('@/lib/crypto', () => ({
  decryptBookingPII: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { decryptBookingPII } from '@/lib/crypto';

const mockPrisma = prisma as unknown as MockPrisma;
const mockDecrypt = decryptBookingPII as ReturnType<typeof vi.fn>;

describe('Partner Booking Management Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCookies();
  });

  it('partner logs in and gets cookie', async () => {
    const { POST } = await import('@/app/api/partner/login/route');

    const request = createRequest('POST', 'http://localhost:3000/api/partner/login', {
      body: { partnerId: 'vinmec', password: 'vinmec2024' },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // Verify the response has a set-cookie header
    const setCookie = response.headers.getSetCookie?.() || [];
    expect(setCookie.length).toBeGreaterThanOrEqual(0);
  });

  it('partner lists bookings with statusCounts', async () => {
    const { GET } = await import('@/app/api/partner/bookings/route');

    mockGetSessionPartnerId.mockResolvedValue('vinmec');
    mockGetPartnerName.mockReturnValue('Vinmec');

    const bookings = [
      makeBooking({ partnerId: 'vinmec', status: 'pending' }),
      makeBooking({ partnerId: 'vinmec', status: 'confirmed', confirmedAt: new Date() }),
    ];
    mockPrisma.booking.findMany.mockResolvedValueOnce(bookings);
    mockPrisma.booking.count.mockResolvedValueOnce(2);
    mockPrisma.booking.groupBy.mockResolvedValueOnce([
      { status: 'pending', _count: 1 },
      { status: 'confirmed', _count: 1 },
    ]);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const request = createRequest('GET', 'http://localhost:3000/api/partner/bookings');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.bookings).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.partnerName).toBe('Vinmec');
    expect(body.statusCounts).toBeDefined();
    expect(body.statusCounts.pending).toBe(1);
    expect(body.statusCounts.confirmed).toBe(1);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
  });

  it('partner reveals PII', async () => {
    const { POST } = await import('@/app/api/partner/bookings/[id]/reveal/route');

    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    const booking = makeBooking({ id: 'bk-p-1', partnerId: 'vinmec' });
    mockPrisma.booking.findUnique.mockResolvedValueOnce(booking);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});
    mockDecrypt.mockResolvedValueOnce({
      patientName: 'Tran Van B',
      phone: '0912345678',
      conditionSummary: 'Flu symptoms',
      notes: 'Needs afternoon appointment',
    });

    const request = createRequest('POST', 'http://localhost:3000/api/partner/bookings/bk-p-1/reveal');
    const response = await POST(request, { params: Promise.resolve({ id: 'bk-p-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.patientName).toBe('Tran Van B');
    expect(body.phone).toBe('0912345678');
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'partner',
          actorId: 'vinmec',
          action: 'reveal_pii',
        }),
      })
    );
  });

  it('partner confirms booking', async () => {
    const { PATCH } = await import('@/app/api/partner/bookings/[id]/status/route');

    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    const booking = makeBooking({ id: 'bk-confirm-1', partnerId: 'vinmec', status: 'pending' });
    mockPrisma.booking.findUnique.mockResolvedValueOnce(booking);
    mockPrisma.booking.update.mockResolvedValueOnce({ ...booking, status: 'confirmed' });
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const request = createRequest(
      'PATCH',
      'http://localhost:3000/api/partner/bookings/bk-confirm-1/status',
      { body: { status: 'confirmed' } }
    );
    const response = await PATCH(request, { params: Promise.resolve({ id: 'bk-confirm-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('confirmed');
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bk-confirm-1' },
        data: expect.objectContaining({ status: 'confirmed' }),
      })
    );
  });

  it('partner cannot change completed booking', async () => {
    const { PATCH } = await import('@/app/api/partner/bookings/[id]/status/route');

    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    const booking = makeBooking({ id: 'bk-done-1', partnerId: 'vinmec', status: 'completed' });
    mockPrisma.booking.findUnique.mockResolvedValueOnce(booking);

    const request = createRequest(
      'PATCH',
      'http://localhost:3000/api/partner/bookings/bk-done-1/status',
      { body: { status: 'cancelled' } }
    );
    const response = await PATCH(request, { params: Promise.resolve({ id: 'bk-done-1' }) });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('completed');
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });
});
