import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionPartnerId } from '@/lib/partner-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('partner-commissions');

export async function GET() {
  const partnerId = await getSessionPartnerId();
  if (!partnerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const statements = await prisma.commissionStatement.findMany({
      where: {
        partnerId,
        status: { in: ['confirmed', 'paid'] },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json({
      statements: statements.map((s) => ({
        ...s,
        generatedAt: s.generatedAt.toISOString(),
        confirmedAt: s.confirmedAt?.toISOString() || null,
        paidAt: s.paidAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    log.error('Failed to fetch partner commissions', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
