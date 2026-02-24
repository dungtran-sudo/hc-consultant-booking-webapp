import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const specialtiesParam = url.searchParams.get('specialties') || '';
  const city = url.searchParams.get('city') || '';

  const specialties = specialtiesParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (specialties.length === 0) {
    return NextResponse.json({ partners: [] });
  }

  const partners = await prisma.partner.findMany({
    where: {
      isActive: true,
      contractStatus: 'active',
      specialties: { hasSome: specialties },
    },
    include: { branches: true, services: true },
  });

  // Sort: city-matched partners first
  const cityMatched: typeof partners = [];
  const others: typeof partners = [];

  for (const partner of partners) {
    const partnerCities = [partner.city];
    for (const branch of partner.branches) {
      partnerCities.push(branch.city);
    }
    if (city && partnerCities.includes(city)) {
      cityMatched.push(partner);
    } else {
      others.push(partner);
    }
  }

  return NextResponse.json({ partners: [...cityMatched, ...others] });
}
