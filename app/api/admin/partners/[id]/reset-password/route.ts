import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { hashPassword } from '@/lib/staff-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-partner-password');

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { password } = body;

    const passwordHash = password ? await hashPassword(password) : null;

    await prisma.partner.update({
      where: { id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: 'admin',
        action: 'partner_password_reset',
        metadata: JSON.stringify({ partnerId: id, removed: !password }),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, hasPortalAccess: !!password });
  } catch (error) {
    log.error('Failed to reset partner password', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
