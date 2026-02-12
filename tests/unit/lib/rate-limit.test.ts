import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const mockPrisma = prisma as unknown as MockPrisma;

describe('checkRateLimit', () => {
  const key = 'test-ip:127.0.0.1';
  const limit = 10;
  const windowMs = 60_000; // 1 minute

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates via upsert on first request (no existing record)', async () => {
    mockPrisma.rateLimit.findUnique.mockResolvedValueOnce(null);
    mockPrisma.rateLimit.upsert.mockResolvedValueOnce({});

    const result = await checkRateLimit(key, limit, windowMs);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(limit - 1);
    expect(result.resetAt).toBeInstanceOf(Date);
    expect(mockPrisma.rateLimit.upsert).toHaveBeenCalledOnce();
  });

  it('increments counter when within limit', async () => {
    const now = new Date();
    mockPrisma.rateLimit.findUnique.mockResolvedValueOnce({
      key,
      windowStart: now,
      count: 3,
    });
    mockPrisma.rateLimit.update.mockResolvedValueOnce({});

    const result = await checkRateLimit(key, limit, windowMs);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(limit - 4); // limit - (3 + 1)
    expect(mockPrisma.rateLimit.update).toHaveBeenCalledOnce();
    const updateArgs = mockPrisma.rateLimit.update.mock.calls[0][0];
    expect(updateArgs.data.count).toBe(4);
  });

  it('returns not allowed when count is at limit', async () => {
    const now = new Date();
    mockPrisma.rateLimit.findUnique.mockResolvedValueOnce({
      key,
      windowStart: now,
      count: limit,
    });

    const result = await checkRateLimit(key, limit, windowMs);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(mockPrisma.rateLimit.update).not.toHaveBeenCalled();
    expect(mockPrisma.rateLimit.upsert).not.toHaveBeenCalled();
  });

  it('returns not allowed when count exceeds limit', async () => {
    const now = new Date();
    mockPrisma.rateLimit.findUnique.mockResolvedValueOnce({
      key,
      windowStart: now,
      count: limit + 5,
    });

    const result = await checkRateLimit(key, limit, windowMs);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets counter when window has expired', async () => {
    const oldWindowStart = new Date(Date.now() - windowMs - 1000); // 1s past the window
    mockPrisma.rateLimit.findUnique.mockResolvedValueOnce({
      key,
      windowStart: oldWindowStart,
      count: limit,
    });
    mockPrisma.rateLimit.upsert.mockResolvedValueOnce({});

    const result = await checkRateLimit(key, limit, windowMs);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(limit - 1);
    expect(mockPrisma.rateLimit.upsert).toHaveBeenCalledOnce();
  });
});

describe('getClientIp', () => {
  it('extracts first IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' },
    });

    expect(getClientIp(request)).toBe('192.168.1.1');
  });

  it('returns single IP when only one present', () => {
    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '203.0.113.50' },
    });

    expect(getClientIp(request)).toBe('203.0.113.50');
  });

  it('returns "unknown" when no x-forwarded-for header', () => {
    const request = new Request('http://localhost:3000/api/test');

    expect(getClientIp(request)).toBe('unknown');
  });

  it('trims whitespace from extracted IP', () => {
    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '  192.168.1.1 , 10.0.0.1' },
    });

    expect(getClientIp(request)).toBe('192.168.1.1');
  });
});

describe('rateLimitResponse', () => {
  it('returns 429 status', () => {
    const resetAt = new Date(Date.now() + 30_000);
    const result = { allowed: false, remaining: 0, resetAt };

    const response = rateLimitResponse(result, 10);

    expect(response.status).toBe(429);
  });

  it('includes correct rate limit headers', () => {
    const resetAt = new Date(Date.now() + 30_000);
    const result = { allowed: false, remaining: 0, resetAt };
    const limit = 10;

    const response = rateLimitResponse(result, limit);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('X-RateLimit-Reset')).toBe(resetAt.toISOString());
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('includes Retry-After header with seconds until reset', () => {
    const secondsUntilReset = 45;
    const resetAt = new Date(Date.now() + secondsUntilReset * 1000);
    const result = { allowed: false, remaining: 0, resetAt };

    const response = rateLimitResponse(result, 10);

    const retryAfter = parseInt(response.headers.get('Retry-After')!, 10);
    // Allow 1 second tolerance due to Date.now() drift between calls
    expect(retryAfter).toBeGreaterThanOrEqual(secondsUntilReset - 1);
    expect(retryAfter).toBeLessThanOrEqual(secondsUntilReset);
  });

  it('returns JSON error body', async () => {
    const resetAt = new Date(Date.now() + 30_000);
    const result = { allowed: false, remaining: 0, resetAt };

    const response = rateLimitResponse(result, 10);
    const body = await response.json();

    expect(body.error).toBeDefined();
    expect(typeof body.error).toBe('string');
  });
});
