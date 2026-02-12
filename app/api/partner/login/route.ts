import { NextResponse } from 'next/server';
import { validateLogin, createSessionToken } from '@/lib/partner-auth';

const COOKIE_NAME = 'partner_session';

export async function POST(request: Request) {
  try {
    const { partnerId, password } = await request.json();

    if (!partnerId || !password) {
      return NextResponse.json(
        { error: 'Thiếu thông tin đăng nhập' },
        { status: 400 }
      );
    }

    if (!(await validateLogin(partnerId, password))) {
      return NextResponse.json(
        { error: 'Sai mật khẩu hoặc không tìm thấy đối tác' },
        { status: 401 }
      );
    }

    const token = createSessionToken(partnerId);
    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Partner login error:', msg);
    return NextResponse.json(
      { error: `Lỗi đăng nhập: ${msg}` },
      { status: 500 }
    );
  }
}
