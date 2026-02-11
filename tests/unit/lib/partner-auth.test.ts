import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createSessionToken,
  verifySessionToken,
  validateLogin,
} from '@/lib/partner-auth';

describe('createSessionToken', () => {
  it('returns string in format partnerId:signature', () => {
    const token = createSessionToken('vinmec');
    const parts = token.split(':');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toBe('vinmec');
    // Signature is a hex-encoded HMAC-SHA256 (64 hex chars)
    expect(parts[1]).toHaveLength(64);
  });

  it('produces deterministic output', () => {
    const token1 = createSessionToken('vinmec');
    const token2 = createSessionToken('vinmec');
    expect(token1).toBe(token2);
  });
});

describe('verifySessionToken', () => {
  it('returns partnerId for valid token', () => {
    const token = createSessionToken('vinmec');
    const result = verifySessionToken(token);
    expect(result).toBe('vinmec');
  });

  it('returns null for invalid signature', () => {
    const result = verifySessionToken('vinmec:invalidsignature');
    expect(result).toBeNull();
  });

  it('returns null for no colon', () => {
    const result = verifySessionToken('noColonHere');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = verifySessionToken('');
    expect(result).toBeNull();
  });
});

describe('validateLogin', () => {
  it('returns true for valid credentials', () => {
    expect(validateLogin('vinmec', 'vinmec2024')).toBe(true);
  });

  it('returns false for wrong password', () => {
    expect(validateLogin('vinmec', 'wrongpassword')).toBe(false);
  });

  it('returns false for non-existent partner', () => {
    expect(validateLogin('nonexistent-partner', 'anything')).toBe(false);
  });
});
