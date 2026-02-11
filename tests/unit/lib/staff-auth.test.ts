import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  hashPassword,
  verifyPassword,
  createStaffSessionToken,
  verifyStaffSessionToken,
  getSessionStaff,
  STAFF_COOKIE_NAME,
} from '@/lib/staff-auth';

describe('hashPassword', () => {
  it('returns salt:hash format', async () => {
    const hashed = await hashPassword('mypassword');
    const parts = hashed.split(':');
    expect(parts).toHaveLength(2);
    // Salt is 16 random bytes as hex = 32 chars
    expect(parts[0]).toHaveLength(32);
    // Hash is scrypt 64-byte output as hex = 128 chars
    expect(parts[1]).toHaveLength(128);
  });

  it('different hashes for same password (random salt)', async () => {
    const hash1 = await hashPassword('mypassword');
    const hash2 = await hashPassword('mypassword');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hashed = await hashPassword('correctpassword');
    const result = await verifyPassword('correctpassword', hashed);
    expect(result).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hashed = await hashPassword('correctpassword');
    const result = await verifyPassword('wrongpassword', hashed);
    expect(result).toBe(false);
  });
});

describe('createStaffSessionToken', () => {
  it('returns staffId:role:name:signature format', () => {
    const token = createStaffSessionToken('staff-1', 'Dr. Nguyen', 'admin');
    const parts = token.split(':');
    // staffId:role:name:signature = 4 parts minimum
    expect(parts.length).toBeGreaterThanOrEqual(4);
    expect(parts[0]).toBe('staff-1');
    expect(parts[1]).toBe('admin');
    expect(parts[2]).toBe('Dr. Nguyen');
    // Last part is the HMAC signature (64 hex chars)
    expect(parts[parts.length - 1]).toHaveLength(64);
  });
});

describe('verifyStaffSessionToken', () => {
  it('returns { staffId, staffName, role } for valid token', () => {
    const token = createStaffSessionToken('staff-1', 'Dr. Nguyen', 'admin');
    const result = verifyStaffSessionToken(token);
    expect(result).toEqual({
      staffId: 'staff-1',
      staffName: 'Dr. Nguyen',
      role: 'admin',
    });
  });

  it('returns null for invalid signature', () => {
    const result = verifyStaffSessionToken(
      'staff-1:admin:Dr. Nguyen:invalidsignature'
    );
    expect(result).toBeNull();
  });

  it('returns null for too few parts', () => {
    const result = verifyStaffSessionToken('staff-1:admin');
    expect(result).toBeNull();
  });

  it('parses name with colons correctly', () => {
    const token = createStaffSessionToken(
      'staff-2',
      'Dr. A: Specialist: Cardio',
      'cs'
    );
    const result = verifyStaffSessionToken(token);
    expect(result).toEqual({
      staffId: 'staff-2',
      staffName: 'Dr. A: Specialist: Cardio',
      role: 'cs',
    });
  });
});

describe('STAFF_COOKIE_NAME', () => {
  it('equals staff_session', () => {
    expect(STAFF_COOKIE_NAME).toBe('staff_session');
  });
});

describe('getSessionStaff', () => {
  it('returns null when no cookie set', async () => {
    // The setup.ts mock creates a fresh empty cookie store.
    // With mockReset: true in vitest config, the cookie store is reset.
    // Ensure no staff_session cookie is set.
    const cookieStore = (globalThis as Record<string, unknown>)
      .__cookieStore as Map<string, unknown>;
    cookieStore.delete('staff_session');

    const result = await getSessionStaff();
    expect(result).toBeNull();
  });
});
