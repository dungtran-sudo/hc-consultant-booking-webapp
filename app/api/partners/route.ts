import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';

  const where: Record<string, unknown> = { isActive: true, contractStatus: 'active' };
  if (search.trim().length >= 2) {
    where.name = { contains: search.trim(), mode: 'insensitive' };
  }

  const partners = await prisma.partner.findMany({
    where,
    include: { branches: true, services: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ partners });
}
