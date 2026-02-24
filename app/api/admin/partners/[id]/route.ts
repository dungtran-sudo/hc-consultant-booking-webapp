import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-partner-detail');

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: { branches: true, services: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Không tìm thấy đối tác' }, { status: 404 });
    }

    return NextResponse.json({
      partner: {
        ...partner,
        passwordHash: undefined,
        hasPortalAccess: !!partner.passwordHash,
        createdAt: partner.createdAt.toISOString(),
        updatedAt: partner.updatedAt.toISOString(),
        contractStartDate: partner.contractStartDate?.toISOString() || null,
        contractEndDate: partner.contractEndDate?.toISOString() || null,
      },
    });
  } catch (error) {
    log.error('Failed to fetch partner', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    const allowedFields = [
      'name', 'type', 'website', 'bookingEmail', 'phone', 'city', 'district',
      'address', 'specialties', 'notes', 'isActive',
      'contractStatus', 'contractStartDate', 'contractEndDate', 'contractNotes',
      'commissionRate',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'contractStartDate' || field === 'contractEndDate') {
          data[field] = body[field] ? new Date(body[field]) : null;
        } else {
          data[field] = body[field];
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Không có trường nào để cập nhật' }, { status: 400 });
    }

    const partner = await prisma.partner.update({ where: { id }, data: data as never });

    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: 'admin',
        action: 'partner_updated',
        metadata: JSON.stringify({ partnerId: id, fields: Object.keys(data) }),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      partner: {
        ...partner,
        passwordHash: undefined,
        hasPortalAccess: !!partner.passwordHash,
      },
    });
  } catch (error) {
    log.error('Failed to update partner', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
