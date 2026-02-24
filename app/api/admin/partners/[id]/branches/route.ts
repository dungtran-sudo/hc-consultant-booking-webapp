import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-partner-branches');

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, city, district, address, phone, isActive } = body;

    if (!city || !address) {
      return NextResponse.json({ error: 'city và address là bắt buộc' }, { status: 400 });
    }

    const branch = await prisma.partnerBranch.create({
      data: {
        partnerId: id,
        name: name || '',
        city,
        district: district || '',
        address,
        phone: phone || '',
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    log.error('Failed to create branch', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
