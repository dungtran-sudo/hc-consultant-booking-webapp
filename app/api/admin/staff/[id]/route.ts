import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAdminAuth } from '@/lib/admin-auth';
import { hashPassword } from '@/lib/staff-auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Toggle active/inactive
    if ('isActive' in body) {
      const staff = await prisma.staff.update({
        where: { id },
        data: { isActive: body.isActive },
        select: { id: true, name: true, isActive: true },
      });
      return NextResponse.json(staff);
    }

    // Reset password
    if ('newPassword' in body && body.newPassword) {
      const passwordHash = await hashPassword(body.newPassword);
      await prisma.staff.update({
        where: { id },
        data: { passwordHash },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Không có thay đổi' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
