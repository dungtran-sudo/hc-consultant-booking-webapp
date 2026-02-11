import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest } from '../../../helpers/mock-request';
import { makeConsentToken } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { POST } from '@/app/api/consent-token/[token]/accept/route';

function callPOST(token: string, body: Record<string, unknown> = {}) {
  const req = createRequest('POST', `http://localhost:3000/api/consent-token/${token}/accept`, { body });
  return POST(req, { params: Promise.resolve({ token }) });
}

describe('POST /api/consent-token/[token]/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 for non-existent token', async () => {
    mockPrisma.consentToken.findUnique.mockResolvedValue(null);

    const res = await callPOST('nonexistent-token');

    expect(res.status).toBe(404);
  });

  it('returns 400 for already accepted token', async () => {
    const token = makeConsentToken({ status: 'accepted' });
    mockPrisma.consentToken.findUnique.mockResolvedValue(token);

    const res = await callPOST(token.token);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('đã đồng ý');
  });

  it('updates to accepted with IP and fingerprint', async () => {
    const token = makeConsentToken({
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    mockPrisma.consentToken.findUnique.mockResolvedValue(token);
    mockPrisma.consentToken.update.mockResolvedValue({ ...token, status: 'accepted' });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const res = await callPOST(token.token, { deviceFingerprint: 'fp-abc-123' });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockPrisma.consentToken.update).toHaveBeenCalledWith({
      where: { token: token.token },
      data: expect.objectContaining({
        status: 'accepted',
        deviceFingerprint: 'fp-abc-123',
      }),
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorType: 'patient',
        action: 'patient_consent_accepted',
      }),
    });
  });
});
