import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true, isDeleted: true },
    });

    if (!booking || booking.isDeleted) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'confirmed') updateData.confirmedAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();

    await prisma.booking.update({ where: { id }, data: updateData });

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: 'admin',
        action: 'booking_status_updated',
        bookingId: id,
        metadata: JSON.stringify({
          from: booking.status,
          to: status,
        }),
        ip,
      },
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Admin status update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
