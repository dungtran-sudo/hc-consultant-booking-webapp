import { Partner } from './types';
import partnersData from '@/data/partners.json';

export function loadPartners(): Partner[] {
  return partnersData as Partner[];
}

export function filterPartners(specialties: string[], city: string): Partner[] {
  const partners = loadPartners();

  const matched = partners.filter(
    (p) =>
      p.specialties.length > 0 &&
      p.specialties.some((s) => specialties.includes(s))
  );

  const cityMatched: Partner[] = [];
  const others: Partner[] = [];

  for (const partner of matched) {
    const partnerCities = [partner.city];
    if (partner.branches) {
      for (const branch of partner.branches) {
        partnerCities.push(branch.city);
      }
    }

    if (partnerCities.includes(city)) {
      cityMatched.push(partner);
    } else {
      others.push(partner);
    }
  }

  return [...cityMatched, ...others];
}
