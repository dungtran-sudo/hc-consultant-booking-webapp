import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CURRENT_CONSENT,
  getConsentVersion,
  validateConsentHash,
} from '@/lib/consent';

describe('CURRENT_CONSENT', () => {
  it('has version v1', () => {
    expect(CURRENT_CONSENT.version).toBe('v1');
  });

  it('hash is 64-char hex string', () => {
    expect(CURRENT_CONSENT.hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('getConsentVersion', () => {
  it('returns ConsentVersion for v1', () => {
    const result = getConsentVersion('v1');
    expect(result).not.toBeNull();
    expect(result!.version).toBe('v1');
    expect(result!.text).toBeTruthy();
    expect(result!.hash).toBeTruthy();
  });

  it('returns null for unknown version', () => {
    expect(getConsentVersion('v99')).toBeNull();
    expect(getConsentVersion('')).toBeNull();
    expect(getConsentVersion('invalid')).toBeNull();
  });
});

describe('validateConsentHash', () => {
  it('returns true for correct version+hash', () => {
    const { version, hash } = CURRENT_CONSENT;
    expect(validateConsentHash(version, hash)).toBe(true);
  });

  it('returns false for wrong hash', () => {
    expect(validateConsentHash('v1', 'wrong-hash')).toBe(false);
    expect(validateConsentHash('v1', '')).toBe(false);
    expect(validateConsentHash('v99', CURRENT_CONSENT.hash)).toBe(false);
  });
});
