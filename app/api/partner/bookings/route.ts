import { NextResponse } from 'next/server';
import { getSessionPartnerId, getPartnerName } from '@/lib/partner-auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const partnerId = await getSessionPartnerId();

  if (!partnerId) {
    return NextResponse.json(
      { error: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { partnerId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bookingNumber: true,
        serviceName: true,
        specialty: true,
        branchAddress: true,
        preferredDate: true,
        preferredTime: true,
        createdAt: true,
      },
    });

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    await prisma.auditLog.create({
      data: {
        actorType: 'partner',
        actorId: partnerId,
        action: 'view_booking_list',
        metadata: JSON.stringify({ count: bookings.length }),
        ip,
      },
    });

    const partnerName = getPartnerName(partnerId);
    return NextResponse.json({
      bookings: bookings.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
      })),
      partnerName,
    });
  } catch (error) {
    console.error('Error reading bookings:', error);
    return NextResponse.json(
      { error: 'Lỗi khi đọc dữ liệu' },
      { status: 500 }
    );
  }
}
