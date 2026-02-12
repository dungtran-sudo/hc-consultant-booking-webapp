import { NextResponse } from 'next/server';
import { getSessionPartnerId, getPartnerName } from '@/lib/partner-auth';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('partner-bookings');

export async function GET(request: Request) {
  // Rate limit: 60 requests per minute per IP
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`partner-bookings:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return rateLimitResponse(rl, 60);
  }

  const partnerId = await getSessionPartnerId();

  if (!partnerId) {
    return NextResponse.json(
      { error: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';

  try {
    const where: Record<string, unknown> = { partnerId, isDeleted: false };

    if (search) {
      where.bookingNumber = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, string> = {};
      if (dateFrom) dateFilter.gte = dateFrom;
      if (dateTo) dateFilter.lte = dateTo;
      where.preferredDate = dateFilter;
    }

    const [bookings, total, statusGroups] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          bookingNumber: true,
          serviceName: true,
          specialty: true,
          branchAddress: true,
          preferredDate: true,
          preferredTime: true,
          status: true,
          createdAt: true,
          confirmedAt: true,
          completedAt: true,
          bookedByStaffName: true,
        },
      }),
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by: ['status'],
        where: { partnerId, isDeleted: false },
        _count: true,
      }),
    ]);

    const statusCounts: Record<string, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const g of statusGroups) {
      statusCounts[g.status] = g._count;
    }

    const ip =
      request.headers.get('x-real-ip')?.trim() ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    await prisma.auditLog.create({
      data: {
        actorType: 'partner',
        actorId: partnerId,
        action: 'view_booking_list',
        metadata: JSON.stringify({ count: bookings.length, page }),
        ip,
      },
    });

    const partnerName = await getPartnerName(partnerId);
    return NextResponse.json({
      partnerId,
      bookings: bookings.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        confirmedAt: b.confirmedAt?.toISOString() || null,
        completedAt: b.completedAt?.toISOString() || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      partnerName,
      statusCounts,
    });
  } catch (error) {
    log.error('Error reading bookings', error);
    return NextResponse.json(
      { error: 'Lỗi khi đọc dữ liệu' },
      { status: 500 }
    );
  }
}
