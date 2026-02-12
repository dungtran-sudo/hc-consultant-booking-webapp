import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';

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

  it('does not require authentication', async () => {
    mockPrisma.partner.findMany.mockResolvedValue([
      { id: 'vinmec', name: 'Vinmec' },
    ]);

    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('returns partners with id and name fields', async () => {
    mockPrisma.partner.findMany.mockResolvedValue([
      { id: 'vinmec', name: 'Vinmec' },
      { id: 'simmed', name: 'Simmed' },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(body.partners).toBeDefined();
    expect(Array.isArray(body.partners)).toBe(true);
    expect(body.partners).toHaveLength(2);

    for (const partner of body.partners) {
      expect(partner).toHaveProperty('id');
      expect(partner).toHaveProperty('name');
      expect(typeof partner.id).toBe('string');
      expect(typeof partner.name).toBe('string');
    }

    expect(mockPrisma.partner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { passwordHash: { not: null }, isActive: true },
        select: { id: true, name: true },
      })
    );
  });
});
