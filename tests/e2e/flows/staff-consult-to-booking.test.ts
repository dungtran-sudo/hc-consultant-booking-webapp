import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';
import { createRequest } from '../../helpers/mock-request';
import { makeStaff, makeConsentToken } from '../../helpers/factories';
import { clearAllCookies, setStaffCookie } from '../../helpers/cookie-helpers';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/staff-auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/staff-auth')>();
  return {
    ...original,
    verifyPassword: vi.fn(),
  };
});

vi.mock('@/lib/crypto', () => ({
  hashPhone: vi.fn().mockReturnValue('hashed-phone-value'),
  encryptBookingPII: vi.fn().mockResolvedValue({
    phoneHash: 'hashed-phone-value',
    encKeyId: 'ek-1',
    patientNameEnc: 'enc-name',
    phoneEnc: 'enc-phone',
    conditionEnc: 'enc-condition',
    notesEnc: 'enc-notes',
  }),
}));

vi.mock('@/lib/consent-token', () => ({
  generateConsentToken: vi.fn().mockReturnValue('generated-token-abc123'),
  getConsentUrl: vi.fn().mockReturnValue('http://localhost:3000/consent/generated-token-abc123'),
}));

vi.mock('@/lib/consent', () => ({
  validateConsentHash: vi.fn().mockReturnValue(true),
  CURRENT_CONSENT: { version: 'v1', text: 'consent text', hash: 'valid-hash' },
}));

vi.mock('@/lib/booking-number', () => ({
  generateBookingNumber: vi.fn().mockResolvedValue('HHG-VIN-1234-A1'),
}));

vi.mock('@/lib/mailer', () => ({
  sendBookingEmail: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/staff-auth';

const mockPrisma = prisma as unknown as MockPrisma;
const mockVerifyPassword = verifyPassword as ReturnType<typeof vi.fn>;

describe('Staff Consult-to-Booking Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCookies();
    // Allow rate limit checks to pass
    mockPrisma.rateLimit.findUnique.mockResolvedValue(null);
    mockPrisma.rateLimit.upsert.mockResolvedValue({});
  });

  it('staff logs in successfully', async () => {
    const { POST } = await import('@/app/api/staff/login/route');

    const staff = makeStaff({ name: 'staff-cs1', role: 'cs' });
    mockPrisma.staff.findUnique.mockResolvedValueOnce(staff);
    mockVerifyPassword.mockResolvedValueOnce(true);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const request = createRequest('POST', 'http://localhost:3000/api/staff/login', {
      body: { name: 'staff-cs1', password: 'correct-pass' },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.name).toBe('staff-cs1');
    expect(body.role).toBe('cs');
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'staff',
          action: 'staff_login',
        }),
      })
    );
  });

  it('staff verifies session', async () => {
    const { GET } = await import('@/app/api/staff/me/route');

    setStaffCookie('staff-1', 'TestStaff', 'cs');

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.staffId).toBe('staff-1');
    expect(body.name).toBe('TestStaff');
    expect(body.role).toBe('cs');
  });

  it('staff creates consent token', async () => {
    const { POST } = await import('@/app/api/consent-token/route');

    setStaffCookie('staff-1', 'TestStaff', 'cs');

    const consentToken = makeConsentToken({
      id: 'ct-new-1',
      token: 'generated-token-abc123',
    });
    mockPrisma.consentToken.create.mockResolvedValueOnce(consentToken);

    const request = createRequest('POST', 'http://localhost:3000/api/consent-token', {
      body: {
        phone: '0901234567',
        partnerId: 'vinmec',
        partnerName: 'Vinmec',
        serviceName: 'Kham Nhi',
      },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tokenId).toBe('ct-new-1');
    expect(body.token).toBe('generated-token-abc123');
    expect(body.url).toBe('http://localhost:3000/consent/generated-token-abc123');
    expect(body.expiresAt).toBeDefined();
    expect(mockPrisma.consentToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          token: 'generated-token-abc123',
          phoneHash: 'hashed-phone-value',
          partnerId: 'vinmec',
          partnerName: 'Vinmec',
          staffId: 'staff-1',
          staffName: 'TestStaff',
        }),
      })
    );
  });

  it('booking is created with consent token', async () => {
    const { POST } = await import('@/app/api/booking/route');

    setStaffCookie('staff-1', 'TestStaff', 'cs');

    const createdBooking = {
      id: 'bk-new-1',
      bookingNumber: 'HHG-VIN-1234-A1',
    };
    // Mock consent token validation (new security check)
    mockPrisma.consentToken.findUnique.mockResolvedValueOnce({
      status: 'accepted',
      expiresAt: new Date(Date.now() + 3600_000),
    });
    mockPrisma.consent.create.mockResolvedValueOnce({});
    mockPrisma.booking.create.mockResolvedValueOnce(createdBooking);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});
    mockPrisma.consentToken.update.mockResolvedValueOnce({});
    mockPrisma.partner.findUnique.mockResolvedValueOnce({ bookingEmail: 'test@vinmec.com' });

    const request = createRequest('POST', 'http://localhost:3000/api/booking', {
      body: {
        sessionId: 'session-abc',
        patientName: 'Nguyen Van A',
        phone: '0901234567',
        conditionSummary: 'Sore throat, fever for 2 days',
        serviceId: 'nhi',
        serviceName: 'Kham Nhi',
        partnerId: 'vinmec',
        partnerName: 'Vinmec',
        branchId: 'branch-1',
        branchAddress: '123 Test Street',
        preferredDate: '2026-03-01',
        preferredTime: '09:00',
        notes: 'Please call before visit',
        consentVersion: 'v1',
        consentTextHash: 'valid-hash',
        consentTokenId: 'ct-1',
      },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.bookingNumber).toBe('HHG-VIN-1234-A1');
    expect(mockPrisma.consent.create).toHaveBeenCalledOnce();
    expect(mockPrisma.booking.create).toHaveBeenCalledOnce();
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'staff',
          actorId: 'TestStaff',
          action: 'consent_given',
        }),
      })
    );
    // Consent token should be linked to booking
    expect(mockPrisma.consentToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ct-1' },
        data: { bookingId: 'bk-new-1' },
      })
    );
  });
});
