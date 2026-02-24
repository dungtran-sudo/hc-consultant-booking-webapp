import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { hashPassword } from '@/lib/staff-auth';
import { createLogger, safeErrorMessage } from '@/lib/logger';

const log = createLogger('admin-partners');

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const search = url.searchParams.get('search') || '';
  const type = url.searchParams.get('type') || '';
  const city = url.searchParams.get('city') || '';
  const contractStatus = url.searchParams.get('contractStatus') || '';
  const isActive = url.searchParams.get('isActive') || '';

  try {
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (contractStatus) where.contractStatus = contractStatus;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          district: true,
          phone: true,
          contractStatus: true,
          contractEndDate: true,
          commissionRate: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.partner.count({ where }),
    ]);

    return NextResponse.json({
      partners: partners.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        contractEndDate: p.contractEndDate?.toISOString() || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error('Failed to fetch partners', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, password, ...rest } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'id và name là bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.partner.findUnique({ where: { id } });
    if (existing) {
      return NextResponse.json({ error: 'ID đối tác đã tồn tại' }, { status: 409 });
    }

    const data: Record<string, unknown> = { id, name };
    const allowedFields = [
      'type', 'website', 'bookingEmail', 'phone', 'city', 'district',
      'address', 'specialties', 'notes', 'isActive',
      'contractStatus', 'contractStartDate', 'contractEndDate', 'contractNotes',
      'commissionRate',
    ];
    for (const field of allowedFields) {
      if (rest[field] !== undefined) {
        if (field === 'contractStartDate' || field === 'contractEndDate') {
          data[field] = rest[field] ? new Date(rest[field]) : null;
        } else {
          data[field] = rest[field];
        }
      }
    }

    if (password) {
      data.passwordHash = await hashPassword(password);
    }

    const partner = await prisma.partner.create({ data: data as never });

    await prisma.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: 'admin',
        action: 'partner_created',
        metadata: JSON.stringify({ partnerId: partner.id, partnerName: partner.name }),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ partner: { ...partner, passwordHash: undefined } }, { status: 201 });
  } catch (error) {
    log.error('Failed to create partner', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Lỗi server') }, { status: 500 });
  }
}
