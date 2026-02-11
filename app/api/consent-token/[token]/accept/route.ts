import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const consentToken = await prisma.consentToken.findUnique({
      where: { token },
    });

    if (!consentToken) {
      return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 404 });
    }

    if (consentToken.status !== 'pending') {
      return NextResponse.json({
        error: consentToken.status === 'accepted'
          ? 'Bạn đã đồng ý trước đó'
          : 'Token đã hết hạn',
      }, { status: 400 });
    }

    if (new Date() > consentToken.expiresAt) {
      await prisma.consentToken.update({
        where: { token },
        data: { status: 'expired' },
      });
      return NextResponse.json({ error: 'Token đã hết hạn' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get device fingerprint from body
    const body = await request.json().catch(() => ({}));
    const deviceFingerprint = body.deviceFingerprint || null;

    await prisma.consentToken.update({
      where: { token },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        patientIp: ip,
        patientUserAgent: userAgent,
        deviceFingerprint: typeof deviceFingerprint === 'string'
          ? deviceFingerprint
          : JSON.stringify(deviceFingerprint),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorType: 'patient',
        actorId: consentToken.phoneHash.substring(0, 8),
        action: 'patient_consent_accepted',
        metadata: JSON.stringify({
          partnerId: consentToken.partnerId,
          staffId: consentToken.staffId,
          staffName: consentToken.staffName,
          patientIp: ip,
          deviceFingerprint: deviceFingerprint
            ? (typeof deviceFingerprint === 'string' ? deviceFingerprint : JSON.stringify(deviceFingerprint))
            : null,
        }),
        ip,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Accept consent error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
