import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest } from '../../../helpers/mock-request';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { GET } from '@/app/api/partner/login/[partnerId]/route';

function callGET(partnerId: string) {
  const request = createRequest('GET', `http://localhost:3000/api/partner/login/${partnerId}`);
  return GET(request, { params: Promise.resolve({ partnerId }) });
}

describe('GET /api/partner/login/[partnerId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.rateLimit.findUnique.mockResolvedValue(null);
    mockPrisma.rateLimit.upsert.mockResolvedValue({});
  });

  it('returns partner name for valid portal partner', async () => {
    mockPrisma.partner.findUnique.mockResolvedValueOnce({ name: 'Vinmec' });

    const response = await callGET('vinmec');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.name).toBe('Vinmec');
  });

  it('returns 404 for non-existent partner', async () => {
    mockPrisma.partner.findUnique.mockResolvedValueOnce(null);

    const response = await callGET('nonexistent');
    expect(response.status).toBe(404);
  });

  it('returns 404 for partner without portal access', async () => {
    mockPrisma.partner.findUnique.mockResolvedValueOnce(null);

    const response = await callGET('no-portal-partner');
    expect(response.status).toBe(404);
  });
});
