import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-commission-detail');

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const statement = await prisma.commissionStatement.findUnique({ where: { id } });
    if (!statement) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 });
    }

    return NextResponse.json({
      statement: {
        ...statement,
        generatedAt: statement.generatedAt.toISOString(),
        confirmedAt: statement.confirmedAt?.toISOString() || null,
        paidAt: statement.paidAt?.toISOString() || null,
      },
    });
  } catch (error) {
    log.error('Failed to fetch commission statement', error);
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

    const existing = await prisma.commissionStatement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 });
    }

    if (body.totalRevenue !== undefined) {
      data.totalRevenue = body.totalRevenue;
      data.commissionAmount = body.totalRevenue * (existing.commissionRate / 100);
    }

    if (body.notes !== undefined) {
      data.notes = body.notes;
    }

    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === 'confirmed') {
        data.confirmedAt = new Date();
        // Recalculate with latest totalRevenue if it was also changed
        const revenue = (data.totalRevenue as number) ?? existing.totalRevenue;
        data.commissionAmount = revenue * (existing.commissionRate / 100);
      }
      if (body.status === 'paid') {
        data.paidAt = new Date();
      }
    }

    const statement = await prisma.commissionStatement.update({ where: { id }, data: data as never });

    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: 'admin',
        action: 'commission_updated',
        metadata: JSON.stringify({ statementId: id, fields: Object.keys(data) }),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      statement: {
        ...statement,
        generatedAt: statement.generatedAt.toISOString(),
        confirmedAt: statement.confirmedAt?.toISOString() || null,
        paidAt: statement.paidAt?.toISOString() || null,
      },
    });
  } catch (error) {
    log.error('Failed to update commission statement', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
