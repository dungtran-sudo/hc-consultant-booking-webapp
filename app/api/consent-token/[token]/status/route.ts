import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionStaff } from '@/lib/staff-auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const staff = await getSessionStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await params;

  const consentToken = await prisma.consentToken.findUnique({
    where: { token },
    select: {
      status: true,
      acceptedAt: true,
      patientIp: true,
      deviceFingerprint: true,
      expiresAt: true,
    },
  });

  if (!consentToken) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  // Check expiry
  if (consentToken.status === 'pending' && new Date() > consentToken.expiresAt) {
    await prisma.consentToken.update({
      where: { token },
      data: { status: 'expired' },
    });
    return NextResponse.json({ status: 'expired' });
  }

  return NextResponse.json({
    status: consentToken.status,
    acceptedAt: consentToken.acceptedAt?.toISOString() || null,
    patientIp: consentToken.patientIp,
    deviceFingerprint: consentToken.deviceFingerprint,
  });
}
