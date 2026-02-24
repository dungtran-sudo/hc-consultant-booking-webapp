import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-commissions');

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const partnerId = url.searchParams.get('partnerId') || '';
  const month = url.searchParams.get('month') || '';
  const year = url.searchParams.get('year') || '';
  const status = url.searchParams.get('status') || '';

  try {
    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const [statements, total] = await Promise.all([
      prisma.commissionStatement.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { partnerName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.commissionStatement.count({ where }),
    ]);

    return NextResponse.json({
      statements: statements.map((s) => ({
        ...s,
        generatedAt: s.generatedAt.toISOString(),
        confirmedAt: s.confirmedAt?.toISOString() || null,
        paidAt: s.paidAt?.toISOString() || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error('Failed to fetch commissions', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { month, year, partnerId } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'month và year là bắt buộc' }, { status: 400 });
    }

    const monthStart = new Date(year, month - 1, 1);
    const nextMonthStart = new Date(year, month, 1);

    // Find eligible partners
    const partnerWhere: Record<string, unknown> = {
      commissionRate: { gt: 0 },
      contractStatus: 'active',
    };
    if (partnerId) partnerWhere.id = partnerId;

    const partners = await prisma.partner.findMany({
      where: partnerWhere,
      select: { id: true, name: true, commissionRate: true },
    });

    let consolidated = 0;

    for (const partner of partners) {
      const completedBookings = await prisma.booking.count({
        where: {
          partnerId: partner.id,
          status: 'completed',
          isDeleted: false,
          completedAt: { gte: monthStart, lt: nextMonthStart },
        },
      });

      await prisma.commissionStatement.upsert({
        where: {
          partnerId_month_year: {
            partnerId: partner.id,
            month,
            year,
          },
        },
        create: {
          partnerId: partner.id,
          partnerName: partner.name,
          month,
          year,
          completedBookings,
          commissionRate: partner.commissionRate,
          totalRevenue: 0,
          commissionAmount: 0,
          status: 'draft',
        },
        update: {
          partnerName: partner.name,
          completedBookings,
          commissionRate: partner.commissionRate,
        },
      });
      consolidated++;
    }

    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: 'admin',
        action: 'commission_consolidated',
        metadata: JSON.stringify({ month, year, partnerId: partnerId || 'all', partnersProcessed: consolidated }),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ consolidated, month, year });
  } catch (error) {
    log.error('Failed to consolidate commissions', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
