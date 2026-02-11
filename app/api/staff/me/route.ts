import { NextResponse } from 'next/server';
import { getSessionStaff } from '@/lib/staff-auth';

export async function GET() {
  const staff = await getSessionStaff();

  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    staffId: staff.staffId,
    name: staff.staffName,
    role: staff.role,
  });
}
