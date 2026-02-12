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

        // Clean up consent tokens for this phone
        await prisma.consentToken.deleteMany({
          where: { phoneHash: ph },
        });

        // Delete encryption key record (already revoked above)
        await prisma.encryptionKey.deleteMany({
          where: { phoneHash: ph },
        });
      }
    }

    // Mark expired bookings as deleted
    await prisma.booking.updateMany({
      where: { expiresAt: { lte: now }, isDeleted: false },
      data: { isDeleted: true },
    });

    // Clean up old API usage logs (older than 90 days)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const deletedUsageLogs = await prisma.apiUsageLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });

    // Clean up stale rate limit records (older than 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deletedRateLimits = await prisma.rateLimit.deleteMany({
      where: { windowStart: { lt: oneDayAgo } },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'system',
        actorId: 'cron-cleanup',
        action: 'data_expired',
        metadata: JSON.stringify({
          bookingsDeleted: expired.length,
          phoneHashesProcessed: phoneHashes.length,
          usageLogsDeleted: deletedUsageLogs.count,
          rateLimitsDeleted: deletedRateLimits.count,
        }),
        ip: 'system',
      },
    });

    return NextResponse.json({
      deleted: expired.length,
      usageLogsDeleted: deletedUsageLogs.count,
      rateLimitsDeleted: deletedRateLimits.count,
    });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
