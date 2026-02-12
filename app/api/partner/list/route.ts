import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const portalPartners = await prisma.partner.findMany({
    where: { passwordHash: { not: null }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ partners: portalPartners });
}
