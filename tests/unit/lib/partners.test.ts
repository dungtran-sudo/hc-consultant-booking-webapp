import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPartners, filterPartners } from '@/lib/partners';

describe('loadPartners', () => {
  it('returns non-empty array', () => {
    const partners = loadPartners();
    expect(Array.isArray(partners)).toBe(true);
    expect(partners.length).toBeGreaterThan(0);
  });

  it('each partner has id and name', () => {
    const partners = loadPartners();
    for (const partner of partners) {
      expect(partner.id).toBeTruthy();
      expect(typeof partner.id).toBe('string');
      expect(partner.name).toBeTruthy();
      expect(typeof partner.name).toBe('string');
    }
  });
});

describe('filterPartners', () => {
  it('returns partners matching specialties', () => {
    const result = filterPartners(['nhi'], 'TP.HCM');
    expect(result.length).toBeGreaterThan(0);
    for (const partner of result) {
      expect(partner.specialties).toContain('nhi');
    }
  });

  it('returns empty array for no matches', () => {
    const result = filterPartners(['nonexistent-specialty'], 'TP.HCM');
    expect(result).toEqual([]);
  });

  it('prioritizes city-matched partners', () => {
    // Filter for a specialty that has partners in multiple cities
    const result = filterPartners(['nhi'], 'Hà Nội');
    expect(result.length).toBeGreaterThan(0);

    // Find the first partner whose city (or branch city) is NOT "Hà Nội"
    const firstNonHanoiIndex = result.findIndex((p) => {
      const cities = [p.city];
      if (p.branches) {
        for (const b of p.branches) {
          cities.push(b.city);
        }
      }
      return !cities.includes('Hà Nội');
    });

    // Find the last partner whose city (or branch city) IS "Hà Nội"
    const lastHanoiIndex = result.findLastIndex((p) => {
      const cities = [p.city];
      if (p.branches) {
        for (const b of p.branches) {
          cities.push(b.city);
        }
      }
      return cities.includes('Hà Nội');
    });

    // All Hanoi-matched partners should come before non-Hanoi partners
    if (firstNonHanoiIndex !== -1 && lastHanoiIndex !== -1) {
      expect(lastHanoiIndex).toBeLessThan(firstNonHanoiIndex);
    }
  });
});
