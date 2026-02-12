import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF protection: validate Origin header on state-changing requests.
 * Cron endpoints use Bearer auth (no browser origin), so they're exempt.
 */
export function middleware(request: NextRequest) {
  // Only check state-changing methods
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    return NextResponse.next();
  }

  // Exempt cron endpoints (authenticated via Bearer token, not browser-initiated)
  if (request.nextUrl.pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  const origin = request.headers.get('origin');

  // Allow requests with no origin (non-browser clients like curl, Postman, server-to-server)
  // These are safe because browsers always send Origin on cross-origin requests
  if (!origin) {
    return NextResponse.next();
  }

  // Build allowed origins
  const allowedOrigins = new Set<string>();

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    allowedOrigins.add(new URL(process.env.NEXT_PUBLIC_BASE_URL).origin);
  }
  if (process.env.VERCEL_URL) {
    allowedOrigins.add(`https://${process.env.VERCEL_URL}`);
  }

  // Always allow localhost in development
  allowedOrigins.add('http://localhost:3000');

  if (!allowedOrigins.has(origin)) {
    return new NextResponse(
      JSON.stringify({ error: 'CSRF validation failed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
