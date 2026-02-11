import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPhone, revokeEncKey } from '@/lib/crypto';
import { validateAdminAuth } from '@/lib/admin-auth';

export async function POST(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phone } = await request.json();

  if (!phone || typeof phone !== 'string') {
    return NextResponse.json(
      { error: 'Phone number is required' },
      { status: 400 }
    );
  }

  const phoneHash = hashPhone(phone);

  try {
    // Find all bookings for this phone
    const bookings = await prisma.booking.findMany({
      where: { phoneHash, isDeleted: false },
      select: { id: true },
    });

    if (bookings.length === 0) {
      return NextResponse.json({ found: false, deleted: 0 });
    }

    // Revoke encryption key (crypto-shred)
    await revokeEncKey(phoneHash);

    // Mark all bookings as deleted
    await prisma.booking.updateMany({
      where: { phoneHash },
      data: { isDeleted: true },
    });

    // Anonymize consent records
    await prisma.consent.updateMany({
      where: { phoneHash },
      data: { phoneHash: 'ANONYMIZED' },
    });

    // Create deletion request record
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    await prisma.deletionRequest.create({
      data: {
        phoneHash,
        status: 'completed',
        requestedBy: 'cs-admin',
        completedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: 'cs-admin',
        action: 'patient_data_deleted',
        metadata: JSON.stringify({
          bookingsDeleted: bookings.length,
          phoneHashPrefix: phoneHash.substring(0, 8),
        }),
        ip,
      },
    });

    return NextResponse.json({
      found: true,
      deleted: bookings.length,
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { error: 'Deletion failed' },
      { status: 500 }
    );
  }
}
