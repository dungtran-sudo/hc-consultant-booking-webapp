import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { getPartnerName } from '@/lib/partner-auth';

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const search = url.searchParams.get('search') || '';
  const partner = url.searchParams.get('partner') || '';
  const status = url.searchParams.get('status') || '';
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';

  try {
    const where: Record<string, unknown> = { isDeleted: false };

    if (search) {
      where.bookingNumber = { contains: search, mode: 'insensitive' };
    }

    if (partner) {
      where.partnerId = partner;
    }

    if (status) {
      where.status = status;
    }

    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to + 'T23:59:59.999Z');
      where.createdAt = createdAt;
    }

    const [bookings, total] = await Promise.all([
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
          partnerId: true,
          partnerName: true,
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
    ]);

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        ...b,
        partnerName: b.partnerName || getPartnerName(b.partnerId),
        createdAt: b.createdAt.toISOString(),
        confirmedAt: b.confirmedAt?.toISOString() || null,
        completedAt: b.completedAt?.toISOString() || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin bookings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
