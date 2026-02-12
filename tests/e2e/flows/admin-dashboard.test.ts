import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';
import { createAdminRequest } from '../../helpers/mock-request';
import { makeBooking, makeAuditLog } from '../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/crypto', () => ({
  decryptBookingPII: vi.fn(),
}));

const mockGetSessionPartnerId = vi.fn();
vi.mock('@/lib/partner-auth', () => ({
  getSessionPartnerId: (...args: unknown[]) => mockGetSessionPartnerId(...args),
  getPartnerName: vi.fn(async (id: string) => (id === 'vinmec' ? 'Vinmec' : id)),
}));

import { prisma } from '@/lib/db';
import { decryptBookingPII } from '@/lib/crypto';

const mockPrisma = prisma as unknown as MockPrisma;
const mockDecrypt = decryptBookingPII as ReturnType<typeof vi.fn>;

describe('Admin Dashboard Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('admin fetches stats successfully', async () => {
    const { GET } = await import('@/app/api/admin/stats/route');

    mockPrisma.booking.count
      .mockResolvedValueOnce(15) // totalActive
      .mockResolvedValueOnce(2)  // totalDeleted
      .mockResolvedValueOnce(8); // recentCount

    mockPrisma.booking.groupBy
      .mockResolvedValueOnce([
        { status: 'pending', _count: 6 },
        { status: 'confirmed', _count: 5 },
        { status: 'completed', _count: 3 },
        { status: 'cancelled', _count: 1 },
      ])
      .mockResolvedValueOnce([
        { partnerId: 'vinmec', _count: 10 },
        { partnerId: 'simmed', _count: 5 },
      ]);

    mockPrisma.consent.count.mockResolvedValueOnce(30);
    mockPrisma.auditLog.count.mockResolvedValueOnce(200);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/stats');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalActive).toBe(15);
    expect(body.totalDeleted).toBe(2);
    expect(body.recentCount).toBe(8);
    expect(body.totalConsents).toBe(30);
    expect(body.totalAuditLogs).toBe(200);
    expect(body.statusCounts.pending).toBe(6);
    expect(body.statusCounts.confirmed).toBe(5);
    expect(body.partnerStats).toHaveLength(2);
    expect(body.partnerStats[0].partnerId).toBe('vinmec');
  });

  it('admin lists bookings', async () => {
    const { GET } = await import('@/app/api/admin/bookings/route');

    const booking = makeBooking({ partnerId: 'vinmec', partnerName: 'Vinmec' });
    mockPrisma.booking.findMany.mockResolvedValueOnce([booking]);
    mockPrisma.booking.count.mockResolvedValueOnce(1);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/bookings');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.bookings).toHaveLength(1);
    expect(body.bookings[0].bookingNumber).toBe(booking.bookingNumber);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
  });

  it('admin reveals PII for a booking', async () => {
    const { POST } = await import('@/app/api/partner/bookings/[id]/reveal/route');

    const booking = makeBooking({ id: 'bk-reveal-1', partnerId: 'vinmec' });
    mockPrisma.booking.findUnique.mockResolvedValueOnce(booking);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});
    mockDecrypt.mockResolvedValueOnce({
      patientName: 'Nguyen Van A',
      phone: '0901234567',
      conditionSummary: 'Headache',
      notes: 'Morning only',
    });

    const request = createAdminRequest('POST', 'http://localhost:3000/api/partner/bookings/bk-reveal-1/reveal');
    const response = await POST(request, { params: Promise.resolve({ id: 'bk-reveal-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.patientName).toBe('Nguyen Van A');
    expect(body.phone).toBe('0901234567');
    expect(body.conditionSummary).toBe('Headache');
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'admin',
          action: 'reveal_pii',
          bookingId: 'bk-reveal-1',
        }),
      })
    );
  });

  it('admin updates booking status', async () => {
    const { PATCH } = await import('@/app/api/admin/bookings/[id]/status/route');

    const booking = makeBooking({ id: 'bk-status-1', status: 'pending' });
    mockPrisma.booking.findUnique.mockResolvedValueOnce(booking);
    mockPrisma.booking.update.mockResolvedValueOnce({ ...booking, status: 'confirmed' });
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const request = createAdminRequest(
      'PATCH',
      'http://localhost:3000/api/admin/bookings/bk-status-1/status',
      { body: { status: 'confirmed' } }
    );
    const response = await PATCH(request, { params: Promise.resolve({ id: 'bk-status-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('confirmed');
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bk-status-1' },
        data: expect.objectContaining({ status: 'confirmed' }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'booking_status_updated',
          metadata: JSON.stringify({ from: 'pending', to: 'confirmed' }),
        }),
      })
    );
  });

  it('admin views audit logs', async () => {
    const { GET } = await import('@/app/api/admin/audit-logs/route');

    const logs = [
      makeAuditLog({ action: 'reveal_pii', actorType: 'admin' }),
      makeAuditLog({ action: 'booking_status_updated', actorType: 'partner' }),
    ];
    mockPrisma.auditLog.findMany.mockResolvedValueOnce(logs);
    mockPrisma.auditLog.count.mockResolvedValueOnce(2);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/audit-logs');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.logs).toHaveLength(2);
    expect(body.logs[0].action).toBe('reveal_pii');
    expect(body.logs[1].action).toBe('booking_status_updated');
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
  });
});
