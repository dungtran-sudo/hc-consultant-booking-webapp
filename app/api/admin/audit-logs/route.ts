import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '30')));
  const action = url.searchParams.get('action') || '';
  const actor = url.searchParams.get('actor') || '';

  try {
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (actor) where.actorType = actor;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        actorType: l.actorType,
        actorId: l.actorId,
        action: l.action,
        bookingId: l.bookingId,
        metadata: l.metadata,
        ip: l.ip,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin audit logs error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
