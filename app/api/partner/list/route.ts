import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const portalPartners = await prisma.partner.findMany({
    where: { passwordHash: { not: null }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ partners: portalPartners });
}
