import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-stats');

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      totalActive,
      totalDeleted,
      byStatus,
      byPartner,
      recentCount,
      totalConsents,
      totalAuditLogs,
    ] = await Promise.all([
      prisma.booking.count({ where: { isDeleted: false } }),
      prisma.booking.count({ where: { isDeleted: true } }),
      prisma.booking.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: true,
      }),
      prisma.booking.groupBy({
        by: ['partnerId'],
        where: { isDeleted: false },
        _count: true,
        orderBy: { _count: { partnerId: 'desc' } },
      }),
      prisma.booking.count({
        where: {
          isDeleted: false,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.consent.count(),
      prisma.auditLog.count(),
    ]);

    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const s of byStatus) {
      statusCounts[s.status] = s._count;
    }

    const partnerIds = byPartner.map((p) => p.partnerId);
    const partners = await prisma.partner.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true },
    });
    const partnerNameMap = new Map(partners.map((p) => [p.id, p.name]));

    const partnerStats = byPartner.map((p) => ({
      partnerId: p.partnerId,
      partnerName: partnerNameMap.get(p.partnerId) || p.partnerId,
      count: p._count,
    }));

    return NextResponse.json({
      totalActive,
      totalDeleted,
      statusCounts,
      partnerStats,
      recentCount,
      totalConsents,
      totalAuditLogs,
    });
  } catch (error) {
    log.error('Failed to fetch admin stats', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
