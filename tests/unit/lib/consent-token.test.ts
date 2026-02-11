import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateConsentToken, getConsentUrl } from '@/lib/consent-token';

describe('generateConsentToken', () => {
  it('returns 64-char hex string', () => {
    const token = generateConsentToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(token).toHaveLength(64);
  });

  it('generates unique tokens', () => {
    const token1 = generateConsentToken();
    const token2 = generateConsentToken();
    expect(token1).not.toBe(token2);
  });
});

describe('getConsentUrl', () => {
  it('returns URL with NEXT_PUBLIC_BASE_URL', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';
    const url = getConsentUrl('abc123');
    expect(url).toBe('https://example.com/consent/abc123');
  });

  it('falls back to localhost when env not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    const url = getConsentUrl('abc123');
    expect(url).toBe('http://localhost:3000/consent/abc123');
  });
});
