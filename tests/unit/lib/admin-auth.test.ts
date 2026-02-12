import { describe, it, expect, vi, beforeEach } from 'vitest';

import { validateAdminAuth } from '@/lib/admin-auth';

describe('validateAdminAuth', () => {
  it('returns true for valid Bearer token', () => {
    const request = new Request('http://localhost:3000/api/admin/test', {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_SECRET}`,
      },
    });
    expect(validateAdminAuth(request)).toBe(true);
  });

  it('returns false for missing auth header', () => {
    const request = new Request('http://localhost:3000/api/admin/test');
    expect(validateAdminAuth(request)).toBe(false);
  });

  it('returns false for wrong token', () => {
    const request = new Request('http://localhost:3000/api/admin/test', {
      headers: {
        Authorization: 'Bearer wrong-secret-value',
      },
    });
    expect(validateAdminAuth(request)).toBe(false);
  });

  it('returns false for wrong format (no Bearer prefix)', () => {
    const request = new Request('http://localhost:3000/api/admin/test', {
      headers: {
        Authorization: process.env.ADMIN_SECRET!,
      },
    });
    expect(validateAdminAuth(request)).toBe(false);
  });

  it('returns false when ADMIN_SECRET is empty', () => {
    const original = process.env.ADMIN_SECRET;
    process.env.ADMIN_SECRET = '';
    const request = new Request('http://localhost:3000/api/admin/test', {
      headers: {
        Authorization: 'Bearer ',
      },
    });
    expect(validateAdminAuth(request)).toBe(false);
    process.env.ADMIN_SECRET = original;
  });

  it('returns false when ADMIN_SECRET is undefined', () => {
    const original = process.env.ADMIN_SECRET;
    delete process.env.ADMIN_SECRET;
    const request = new Request('http://localhost:3000/api/admin/test', {
      headers: {
        Authorization: 'Bearer undefined',
      },
    });
    expect(validateAdminAuth(request)).toBe(false);
    process.env.ADMIN_SECRET = original;
  });
});
