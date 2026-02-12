import { prisma } from './db';
import { Partner, Branch, Service } from './types';

type PartnerWithRelations = {
  id: string;
  name: string;
  type: string;
  website: string;
  bookingEmail: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  specialties: string[];
  notes: string;
  isActive: boolean;
  branches: { id: string; name: string; city: string; district: string; address: string; phone: string }[];
  services: { id: string; name: string; specialty: string; description: string; priceRange: string; duration: string }[];
};

function toPartner(p: PartnerWithRelations): Partner {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    website: p.website,
    bookingEmail: p.bookingEmail,
    phone: p.phone,
    city: p.city,
    district: p.district,
    address: p.address,
    specialties: p.specialties,
    notes: p.notes,
    isActive: p.isActive,
    services: p.services.map((s): Service => ({
      id: s.id,
      name: s.name,
      specialty: s.specialty,
      description: s.description,
      priceRange: s.priceRange,
      duration: s.duration,
    })),
    branches: p.branches.map((b): Branch => ({
      id: b.id,
      name: b.name,
      city: b.city,
      district: b.district,
      address: b.address,
      phone: b.phone,
    })),
  };
}

export async function loadPartners(): Promise<Partner[]> {
  const partners = await prisma.partner.findMany({
    where: { isActive: true },
    include: { branches: true, services: true },
    orderBy: { name: 'asc' },
  });
  return partners.map(toPartner);
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { branches: true, services: true },
  });
  if (!partner) return null;
  return toPartner(partner);
}

export async function filterPartners(specialties: string[], city: string): Promise<Partner[]> {
  const partners = await prisma.partner.findMany({
    where: {
      isActive: true,
      specialties: { hasSome: specialties },
    },
    include: { branches: true, services: true },
  });

  const mapped = partners.map(toPartner);

  const cityMatched: Partner[] = [];
  const others: Partner[] = [];

  for (const partner of mapped) {
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
