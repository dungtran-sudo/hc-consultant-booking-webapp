import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { GET } from '@/app/api/partner/list/route';

describe('GET /api/partner/list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/partner/list');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('returns partners with admin auth', async () => {
    mockPrisma.partner.findMany.mockResolvedValue([
      { id: 'vinmec', name: 'Vinmec' },
      { id: 'simmed', name: 'Simmed' },
    ]);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/partner/list');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.partners).toHaveLength(2);
    expect(body.partners[0]).toHaveProperty('id');
    expect(body.partners[0]).toHaveProperty('name');
  });
});
