import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`partner-verify:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl, 10);
    }

    const { partnerId } = await params;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId, isActive: true, passwordHash: { not: null } },
      select: { name: true },
    });

    if (!partner) {
      return NextResponse.json(
        { error: 'Không tìm thấy đối tác' },
        { status: 404 }
      );
    }

    return NextResponse.json({ name: partner.name });
  } catch (error) {
    console.error('Partner verify error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
