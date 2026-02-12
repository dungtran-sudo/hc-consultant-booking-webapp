import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../helpers/mock-request';
import { makeBooking } from '../../helpers/factories';
import { clearAllCookies } from '../../helpers/cookie-helpers';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/crypto', () => ({
  decryptBookingPII: vi.fn(),
  hashPhone: vi.fn().mockReturnValue('hashed-phone-value'),
  revokeEncKey: vi.fn().mockResolvedValue(undefined),
}));

const mockGetSessionPartnerId = vi.fn();
vi.mock('@/lib/partner-auth', () => ({
  getSessionPartnerId: (...args: unknown[]) => mockGetSessionPartnerId(...args),
  getPartnerName: vi.fn(async (id: string) => id),
}));

vi.mock('@/lib/admin-auth', () => ({
  validateAdminAuth: vi.fn((request: Request) => {
    const auth = request.headers.get('authorization');
    return auth === `Bearer ${process.env.ADMIN_SECRET}`;
  }),
}));

import { prisma } from '@/lib/db';
import { decryptBookingPII } from '@/lib/crypto';

const mockPrisma = prisma as unknown as MockPrisma;
const mockDecrypt = decryptBookingPII as ReturnType<typeof vi.fn>;

describe('Crypto-Shredding Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCookies();
  });

  it('PII can be revealed for active booking', async () => {
    const { POST } = await import('@/app/api/partner/bookings/[id]/reveal/route');

    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    const booking = makeBooking({
      id: 'bk-active-1',
      partnerId: 'vinmec',
      isDeleted: false,
    });
    mockPrisma.booking.findUnique.mockResolvedValueOnce(booking);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});
    mockDecrypt.mockResolvedValueOnce({
      patientName: 'Le Thi C',
      phone: '0987654321',
      conditionSummary: 'Back pain for 1 week',
      notes: 'Previous surgery in 2024',
    });

    const request = createRequest('POST', 'http://localhost:3000/api/partner/bookings/bk-active-1/reveal');
    const response = await POST(request, { params: Promise.resolve({ id: 'bk-active-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.patientName).toBe('Le Thi C');
    expect(body.phone).toBe('0987654321');
    expect(body.conditionSummary).toBe('Back pain for 1 week');
    expect(body.notes).toBe('Previous surgery in 2024');
    expect(body.deleted).toBeUndefined();
  });

  it('admin deletes patient data', async () => {
    const { POST } = await import('@/app/api/admin/delete-patient/route');

    const bookings = [
      makeBooking({ id: 'bk-del-1', phoneHash: 'hashed-phone-value' }),
      makeBooking({ id: 'bk-del-2', phoneHash: 'hashed-phone-value' }),
    ];
    mockPrisma.booking.findMany.mockResolvedValueOnce(bookings);
    mockPrisma.booking.updateMany.mockResolvedValueOnce({ count: 2 });
    mockPrisma.consent.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.deletionRequest.create.mockResolvedValueOnce({});
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const request = createAdminRequest('POST', 'http://localhost:3000/api/admin/delete-patient', {
      body: { phone: '0987654321' },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.found).toBe(true);
    expect(body.deleted).toBe(2);

    // Verify crypto-shredding steps
    expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { phoneHash: 'hashed-phone-value' },
        data: { isDeleted: true },
      })
    );
    expect(mockPrisma.consent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { phoneHash: 'hashed-phone-value' },
        data: { phoneHash: 'ANONYMIZED' },
      })
    );
    expect(mockPrisma.deletionRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phoneHash: 'hashed-phone-value',
          status: 'completed',
        }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'patient_data_deleted',
          metadata: expect.stringContaining('bookingsDeleted'),
        }),
      })
    );
  });

  it('PII reveal returns deleted after crypto-shred', async () => {
    const { POST } = await import('@/app/api/partner/bookings/[id]/reveal/route');

    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    const booking = makeBooking({
      id: 'bk-shredded-1',
      partnerId: 'vinmec',
      isDeleted: true,
    });
    mockPrisma.booking.findUnique.mockResolvedValueOnce(booking);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const request = createRequest('POST', 'http://localhost:3000/api/partner/bookings/bk-shredded-1/reveal');
    const response = await POST(request, { params: Promise.resolve({ id: 'bk-shredded-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deleted).toBe(true);
    expect(body.patientName).toBeUndefined();
    expect(body.phone).toBeUndefined();
    // decryptBookingPII should NOT have been called since isDeleted check returns early
    expect(mockDecrypt).not.toHaveBeenCalled();
  });

  it('decryption returns null after key revocation', async () => {
    const { POST } = await import('@/app/api/partner/bookings/[id]/reveal/route');

    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    // Booking is not marked as deleted, but encryption key has been revoked
    const booking = makeBooking({
      id: 'bk-revoked-1',
      partnerId: 'vinmec',
      isDeleted: false,
    });
    mockPrisma.booking.findUnique.mockResolvedValueOnce(booking);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});
    // decryptBookingPII returns null when the key is revoked
    mockDecrypt.mockResolvedValueOnce(null);

    const request = createRequest('POST', 'http://localhost:3000/api/partner/bookings/bk-revoked-1/reveal');
    const response = await POST(request, { params: Promise.resolve({ id: 'bk-revoked-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deleted).toBe(true);
    expect(body.patientName).toBeUndefined();
    expect(mockDecrypt).toHaveBeenCalledOnce();
  });
});
