import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-partner-branch');

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; branchId: string }> }
) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, branchId } = await params;

  try {
    const existing = await prisma.partnerBranch.findUnique({ where: { id: branchId } });
    if (!existing || existing.partnerId !== id) {
      return NextResponse.json({ error: 'Không tìm thấy chi nhánh' }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    const allowedFields = ['name', 'city', 'district', 'address', 'phone', 'isActive'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    const branch = await prisma.partnerBranch.update({
      where: { id: branchId },
      data: data as never,
    });

    return NextResponse.json({ branch });
  } catch (error) {
    log.error('Failed to update branch', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; branchId: string }> }
) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, branchId } = await params;

  try {
    const existing = await prisma.partnerBranch.findUnique({ where: { id: branchId } });
    if (!existing || existing.partnerId !== id) {
      return NextResponse.json({ error: 'Không tìm thấy chi nhánh' }, { status: 404 });
    }

    await prisma.partnerBranch.delete({ where: { id: branchId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to delete branch', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
