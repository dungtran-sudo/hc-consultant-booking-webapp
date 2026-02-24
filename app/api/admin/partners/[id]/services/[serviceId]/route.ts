import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-partner-service');

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, serviceId } = await params;

  try {
    const existing = await prisma.partnerService.findUnique({ where: { id: serviceId } });
    if (!existing || existing.partnerId !== id) {
      return NextResponse.json({ error: 'Không tìm thấy dịch vụ' }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    const allowedFields = ['name', 'specialty', 'description', 'priceRange', 'duration', 'isActive'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    const service = await prisma.partnerService.update({
      where: { id: serviceId },
      data: data as never,
    });

    return NextResponse.json({ service });
  } catch (error) {
    log.error('Failed to update service', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, serviceId } = await params;

  try {
    const existing = await prisma.partnerService.findUnique({ where: { id: serviceId } });
    if (!existing || existing.partnerId !== id) {
      return NextResponse.json({ error: 'Không tìm thấy dịch vụ' }, { status: 404 });
    }

    await prisma.partnerService.delete({ where: { id: serviceId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to delete service', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
