import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';
import { createRequest } from '../../helpers/mock-request';
import { makeConsentToken } from '../../helpers/factories';
import { clearAllCookies, setStaffCookie } from '../../helpers/cookie-helpers';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';

const mockPrisma = prisma as unknown as MockPrisma;

describe('Patient Consent Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCookies();
  });

  it('patient fetches consent info', async () => {
    const { GET } = await import('@/app/api/consent-token/[token]/info/route');

    const token = makeConsentToken({
      status: 'pending',
      partnerName: 'Vinmec',
      serviceName: 'Kham Nhi',
      dataDescription: 'Ho ten, SDT, tinh trang suc khoe',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
    });
    mockPrisma.consentToken.findUnique.mockResolvedValueOnce(token);

    const request = createRequest('GET', 'http://localhost:3000/api/consent-token/abc123/info');
    const response = await GET(request, { params: Promise.resolve({ token: 'abc123' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.partnerName).toBe('Vinmec');
    expect(body.serviceName).toBe('Kham Nhi');
    expect(body.dataDescription).toBe('Ho ten, SDT, tinh trang suc khoe');
    expect(body.status).toBe('pending');
  });

  it('patient accepts consent', async () => {
    const { POST } = await import('@/app/api/consent-token/[token]/accept/route');

    const token = makeConsentToken({
      status: 'pending',
      phoneHash: 'b'.repeat(64),
      partnerId: 'vinmec',
      staffId: 'staff-1',
      staffName: 'TestStaff',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    mockPrisma.consentToken.findUnique.mockResolvedValueOnce(token);
    mockPrisma.consentToken.update.mockResolvedValueOnce({ ...token, status: 'accepted' });
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const request = createRequest(
      'POST',
      'http://localhost:3000/api/consent-token/abc123/accept',
      {
        body: { deviceFingerprint: 'fp-device-xyz' },
      }
    );
    const response = await POST(request, { params: Promise.resolve({ token: 'abc123' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockPrisma.consentToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { token: 'abc123' },
        data: expect.objectContaining({
          status: 'accepted',
          deviceFingerprint: 'fp-device-xyz',
        }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'patient',
          action: 'patient_consent_accepted',
        }),
      })
    );
  });

  it('staff polls and sees accepted status', async () => {
    const { GET } = await import('@/app/api/consent-token/[token]/status/route');

    setStaffCookie('staff-1', 'TestStaff', 'cs');

    const acceptedAt = new Date('2026-02-11T10:00:00Z');
    const token = makeConsentToken({
      status: 'accepted',
      acceptedAt,
      patientIp: '192.168.1.1',
      deviceFingerprint: 'fp-device-xyz',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    mockPrisma.consentToken.findUnique.mockResolvedValueOnce(token);

    const request = createRequest('GET', 'http://localhost:3000/api/consent-token/abc123/status');
    const response = await GET(request, { params: Promise.resolve({ token: 'abc123' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('accepted');
    expect(body.acceptedAt).toBe(acceptedAt.toISOString());
    expect(body.patientIp).toBe('192.168.1.1');
    expect(body.deviceFingerprint).toBe('fp-device-xyz');
  });

  it('expired token returns error', async () => {
    const { GET } = await import('@/app/api/consent-token/[token]/info/route');

    const token = makeConsentToken({
      status: 'pending',
      expiresAt: new Date(Date.now() - 60 * 1000), // expired 1 minute ago
    });
    mockPrisma.consentToken.findUnique.mockResolvedValueOnce(token);
    mockPrisma.consentToken.update.mockResolvedValueOnce({ ...token, status: 'expired' });

    const request = createRequest('GET', 'http://localhost:3000/api/consent-token/expired-token/info');
    const response = await GET(request, { params: Promise.resolve({ token: 'expired-token' }) });

    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.error).toContain('hết hạn');
    // Should have updated the status to expired in DB
    expect(mockPrisma.consentToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { token: 'expired-token' },
        data: { status: 'expired' },
      })
    );
  });
});
