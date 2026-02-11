import { NextResponse } from 'next/server';
import { getSessionPartnerId } from '@/lib/partner-auth';
import { validateAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const partnerId = await getSessionPartnerId();
  const isAdmin = validateAdminAuth(request);

  if (!partnerId && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  await prisma.auditLog.create({
    data: {
      actorType: isAdmin ? 'admin' : 'partner',
      actorId: isAdmin ? 'admin' : partnerId!,
      action: 'pii_consent_acknowledged',
      ip,
    },
  });

  return NextResponse.json({ ok: true });
}
