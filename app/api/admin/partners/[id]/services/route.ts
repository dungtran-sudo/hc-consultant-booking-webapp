import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-partner-services');

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, specialty, description, priceRange, duration, isActive } = body;

    if (!name || !specialty) {
      return NextResponse.json({ error: 'name và specialty là bắt buộc' }, { status: 400 });
    }

    const service = await prisma.partnerService.create({
      data: {
        partnerId: id,
        name,
        specialty,
        description: description || '',
        priceRange: priceRange || '',
        duration: duration || '',
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    log.error('Failed to create service', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
