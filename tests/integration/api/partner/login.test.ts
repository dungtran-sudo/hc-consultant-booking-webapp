import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest } from '../../../helpers/mock-request';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

const mockValidateLogin = vi.fn();
vi.mock('@/lib/partner-auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/partner-auth')>();
  return {
    ...original,
    validateLogin: (...args: unknown[]) => mockValidateLogin(...args),
  };
});

import { prisma } from '@/lib/db';
import { POST } from '@/app/api/partner/login/route';

const mockPrisma = prisma as unknown as MockPrisma;

describe('POST /api/partner/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Allow rate limit checks to pass
    mockPrisma.rateLimit.findUnique.mockResolvedValue(null);
    mockPrisma.rateLimit.upsert.mockResolvedValue({});
  });

  it('returns 400 when fields are missing', async () => {
    const request = createRequest('POST', 'http://localhost:3000/api/partner/login', {
      body: { partnerId: 'vinmec' },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it('returns 401 with wrong credentials', async () => {
    mockValidateLogin.mockResolvedValue(false);

    const request = createRequest('POST', 'http://localhost:3000/api/partner/login', {
      body: { partnerId: 'vinmec', password: 'wrong-password' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it('returns success and sets cookie with valid credentials', async () => {
    mockValidateLogin.mockResolvedValue(true);

    const request = createRequest('POST', 'http://localhost:3000/api/partner/login', {
      body: { partnerId: 'vinmec', password: 'vinmec2024' },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('partner_session=');
  });
});
