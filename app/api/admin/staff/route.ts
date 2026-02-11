import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { hashPassword } from '@/lib/staff-auth';

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const staff = await prisma.staff.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    staff: staff.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, password, role, email } = await request.json();

    if (!name || !password || !role) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    if (!['cs', 'doctor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Vai trò không hợp lệ' },
        { status: 400 }
      );
    }

    const existing = await prisma.staff.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const staff = await prisma.staff.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        role,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ...staff,
      createdAt: staff.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
