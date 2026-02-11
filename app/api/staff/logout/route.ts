import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STAFF_COOKIE_NAME } from '@/lib/staff-auth';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}
