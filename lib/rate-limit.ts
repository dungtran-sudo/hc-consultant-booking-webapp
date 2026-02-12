import { prisma } from '@/lib/db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  // No record or window expired — reset counter
  if (!existing || existing.windowStart < windowStart) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, windowStart: now },
      create: { key, count: 1, windowStart: now },
    });

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }

  // At or over limit
  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(existing.windowStart.getTime() + windowMs),
    };
  }

  // Increment counter
  await prisma.rateLimit.update({
    where: { key },
    data: { count: existing.count + 1 },
  });

  return {
    allowed: true,
    remaining: limit - (existing.count + 1),
    resetAt: new Date(existing.windowStart.getTime() + windowMs),
  };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  );
}

export function rateLimitResponse(result: RateLimitResult, limit: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        'Retry-After': Math.ceil(
          (result.resetAt.getTime() - Date.now()) / 1000
        ).toString(),
      },
    }
  );
}
