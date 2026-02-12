import { NextResponse } from 'next/server';
import { getSessionPartnerId } from '@/lib/partner-auth';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 status updates per minute per IP
  const clientIp = getClientIp(request);
  const rl = await checkRateLimit(`partner-status:${clientIp}`, 30, 60_000);
  if (!rl.allowed) {
    return rateLimitResponse(rl, 30);
  }

  const partnerId = await getSessionPartnerId();

  if (!partnerId) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, partnerId: true, status: true, isDeleted: true },
    });

    if (!booking || booking.isDeleted) {
      return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    }

    if (booking.partnerId !== partnerId) {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Không thể chuyển từ "${booking.status}" sang "${status}"` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'confirmed') updateData.confirmedAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();

    await prisma.booking.update({ where: { id }, data: updateData });

    const ip =
      request.headers.get('x-real-ip')?.trim() ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    await prisma.auditLog.create({
      data: {
        actorType: 'partner',
        actorId: partnerId,
        action: 'booking_status_updated',
        bookingId: id,
        metadata: JSON.stringify({ from: booking.status, to: status }),
        ip,
      },
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Partner status update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
