import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const consentToken = await prisma.consentToken.findUnique({
    where: { token },
    select: {
      partnerName: true,
      serviceName: true,
      dataDescription: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!consentToken) {
    return NextResponse.json({ error: 'Liên kết không hợp lệ hoặc đã hết hạn' }, { status: 404 });
  }

  if (consentToken.status === 'expired' || new Date() > consentToken.expiresAt) {
    if (consentToken.status !== 'expired') {
      await prisma.consentToken.update({
        where: { token },
        data: { status: 'expired' },
      });
    }
    return NextResponse.json({ error: 'Liên kết đã hết hạn' }, { status: 410 });
  }

  return NextResponse.json({
    partnerName: consentToken.partnerName,
    serviceName: consentToken.serviceName,
    dataDescription: consentToken.dataDescription,
    status: consentToken.status,
  });
}
