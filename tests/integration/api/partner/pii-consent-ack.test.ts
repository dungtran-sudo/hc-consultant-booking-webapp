import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest } from '../../../helpers/mock-request';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

const mockGetSessionPartnerId = vi.fn();

vi.mock('@/lib/partner-auth', () => ({
  getSessionPartnerId: (...args: unknown[]) => mockGetSessionPartnerId(...args),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { POST } from '@/app/api/partner/pii-consent-ack/route';

describe('POST /api/partner/pii-consent-ack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no auth provided', async () => {
    mockGetSessionPartnerId.mockResolvedValue(null);

    const req = createRequest('POST', 'http://localhost:3000/api/partner/pii-consent-ack');
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('creates audit log on success for partner', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');
    mockPrisma.auditLog.create.mockResolvedValue({});

    const req = createRequest('POST', 'http://localhost:3000/api/partner/pii-consent-ack');
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorType: 'partner',
        actorId: 'vinmec',
        action: 'pii_consent_acknowledged',
      }),
    });
  });
});
