import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revokeEncKey } from '@/lib/crypto';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();

    // Find expired bookings
    const expired = await prisma.booking.findMany({
      where: { expiresAt: { lte: now }, isDeleted: false },
      select: { id: true, phoneHash: true },
    });

    if (expired.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    // Group by phoneHash
    const phoneHashes = [...new Set(expired.map((b) => b.phoneHash))];

    for (const ph of phoneHashes) {
      // Check if ALL bookings for this phone are expired
      const activeCount = await prisma.booking.count({
        where: {
          phoneHash: ph,
          isDeleted: false,
          expiresAt: { gt: now },
        },
      });

      if (activeCount === 0) {
        await revokeEncKey(ph);

        await prisma.consent.updateMany({
          where: { phoneHash: ph },
          data: { phoneHash: 'ANONYMIZED' },
        });
      }
    }

    // Mark expired bookings as deleted
    await prisma.booking.updateMany({
      where: { expiresAt: { lte: now }, isDeleted: false },
      data: { isDeleted: true },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'system',
        actorId: 'cron-cleanup',
        action: 'data_expired',
        metadata: JSON.stringify({
          bookingsDeleted: expired.length,
          phoneHashesProcessed: phoneHashes.length,
        }),
        ip: 'system',
      },
    });

    return NextResponse.json({ deleted: expired.length });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
