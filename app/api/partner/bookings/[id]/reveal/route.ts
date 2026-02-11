import { NextResponse } from 'next/server';
import { getSessionPartnerId } from '@/lib/partner-auth';
import { prisma } from '@/lib/db';
import { decryptBookingPII } from '@/lib/crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerId = await getSessionPartnerId();

  if (!partnerId) {
    return NextResponse.json(
      { error: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        partnerId: true,
        phoneHash: true,
        patientNameEnc: true,
        phoneEnc: true,
        conditionEnc: true,
        notesEnc: true,
        isDeleted: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Không tìm thấy đặt lịch' },
        { status: 404 }
      );
    }

    if (booking.partnerId !== partnerId) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      );
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    // Audit log the reveal action
    await prisma.auditLog.create({
      data: {
        actorType: 'partner',
        actorId: partnerId,
        action: 'reveal_pii',
        bookingId: id,
        ip,
      },
    });

    if (booking.isDeleted) {
      return NextResponse.json({ deleted: true });
    }

    const pii = await decryptBookingPII({
      phoneHash: booking.phoneHash,
      patientNameEnc: booking.patientNameEnc,
      phoneEnc: booking.phoneEnc,
      conditionEnc: booking.conditionEnc,
      notesEnc: booking.notesEnc,
    });

    if (!pii) {
      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json(pii);
  } catch (error) {
    console.error('Reveal PII error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi đọc dữ liệu' },
      { status: 500 }
    );
  }
}
