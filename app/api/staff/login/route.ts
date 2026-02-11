import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import {
  verifyPassword,
  createStaffSessionToken,
  STAFF_COOKIE_NAME,
} from '@/lib/staff-auth';

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên và mật khẩu' },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { name: name.trim() },
    });

    if (!staff || !staff.isActive) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, staff.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const token = createStaffSessionToken(staff.id, staff.name, staff.role);
    const cookieStore = await cookies();
    cookieStore.set(STAFF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    await prisma.auditLog.create({
      data: {
        actorType: 'staff',
        actorId: staff.name,
        action: 'staff_login',
        ip,
      },
    });

    return NextResponse.json({
      success: true,
      name: staff.name,
      role: staff.role,
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
