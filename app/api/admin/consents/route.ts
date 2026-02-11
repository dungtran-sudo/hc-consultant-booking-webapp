import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  try {
    const [consents, total] = await Promise.all([
      prisma.consent.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.consent.count(),
    ]);

    return NextResponse.json({
      consents: consents.map((c) => ({
        id: c.id.substring(0, 8),
        phoneHashPrefix: c.phoneHash === 'ANONYMIZED' ? 'ANONYMIZED' : c.phoneHash.substring(0, 8),
        version: c.version,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin consents error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
