import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';
import { makePartner } from '../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { loadPartners, filterPartners, getPartnerById } from '@/lib/partners';

describe('loadPartners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns partners from database', async () => {
    const partners = [
      makePartner({ id: 'vinmec', name: 'Vinmec' }),
      makePartner({ id: 'diag', name: 'Diag' }),
    ];
    mockPrisma.partner.findMany.mockResolvedValue(partners);

    const result = await loadPartners();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('vinmec');
    expect(result[1].id).toBe('diag');
    expect(mockPrisma.partner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        include: { branches: true, services: true },
        orderBy: { name: 'asc' },
      })
    );
  });

  it('each partner has id and name', async () => {
    const partners = [
      makePartner({ id: 'p1', name: 'Partner 1' }),
      makePartner({ id: 'p2', name: 'Partner 2' }),
    ];
    mockPrisma.partner.findMany.mockResolvedValue(partners);

    const result = await loadPartners();
    for (const partner of result) {
      expect(partner.id).toBeTruthy();
      expect(typeof partner.id).toBe('string');
      expect(partner.name).toBeTruthy();
      expect(typeof partner.name).toBe('string');
    }
  });
});

describe('filterPartners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns partners matching specialties', async () => {
    const partners = [
      makePartner({ id: 'p1', specialties: ['nhi'], city: 'TP.HCM', branches: [] }),
    ];
    mockPrisma.partner.findMany.mockResolvedValue(partners);

    const result = await filterPartners(['nhi'], 'TP.HCM');
    expect(result.length).toBeGreaterThan(0);
    expect(mockPrisma.partner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, specialties: { hasSome: ['nhi'] } },
      })
    );
  });

  it('returns empty array for no matches', async () => {
    mockPrisma.partner.findMany.mockResolvedValue([]);

    const result = await filterPartners(['nonexistent-specialty'], 'TP.HCM');
    expect(result).toEqual([]);
  });

  it('prioritizes city-matched partners', async () => {
    const partners = [
      makePartner({ id: 'saigon', city: 'TP.HCM', branches: [] }),
      makePartner({ id: 'hanoi', city: 'Hà Nội', branches: [] }),
    ];
    mockPrisma.partner.findMany.mockResolvedValue(partners);

    const result = await filterPartners(['nhi'], 'Hà Nội');
    expect(result).toHaveLength(2);
    expect(result[0].city).toBe('Hà Nội');
    expect(result[1].city).toBe('TP.HCM');
  });
});

describe('getPartnerById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns partner when found', async () => {
    const partner = makePartner({ id: 'vinmec', name: 'Vinmec' });
    mockPrisma.partner.findUnique.mockResolvedValue(partner);

    const result = await getPartnerById('vinmec');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('vinmec');
    expect(result!.name).toBe('Vinmec');
  });

  it('returns null when not found', async () => {
    mockPrisma.partner.findUnique.mockResolvedValue(null);

    const result = await getPartnerById('nonexistent');
    expect(result).toBeNull();
  });
});
