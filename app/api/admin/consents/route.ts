import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'classic';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  try {
    if (type === 'tokens') {
      const [tokens, total] = await Promise.all([
        prisma.consentToken.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            staffName: true,
            partnerName: true,
            serviceName: true,
            status: true,
            patientIp: true,
            deviceFingerprint: true,
            createdAt: true,
            acceptedAt: true,
          },
        }),
        prisma.consentToken.count(),
      ]);

      return NextResponse.json({
        tokens: tokens.map((t) => ({
          id: t.id.substring(0, 8),
          staffName: t.staffName,
          partnerName: t.partnerName,
          serviceName: t.serviceName,
          status: t.status,
          patientIp: t.patientIp,
          deviceFingerprint: t.deviceFingerprint,
          createdAt: t.createdAt.toISOString(),
          acceptedAt: t.acceptedAt?.toISOString() || null,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Classic consents
    const [consents, total] = await Promise.all([
      prisma.consent.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.consent.count(),
    ]);

    return NextResponse.json({
      consents: consents.map((c) => ({
        id: c.id.substring(0, 8),
        phoneHashPrefix: c.phoneHash === 'ANONYMIZED' ? 'ANONYMIZED' : c.phoneHash.substring(0, 8),
        version: c.version,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin consents error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
