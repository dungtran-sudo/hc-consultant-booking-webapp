import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { getPartnerName } from '@/lib/partner-auth';

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

    const partnerStats = byPartner.map((p) => ({
      partnerId: p.partnerId,
      partnerName: getPartnerName(p.partnerId),
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
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
