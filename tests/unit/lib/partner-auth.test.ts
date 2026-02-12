import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/staff-auth', () => ({
  verifyPassword: vi.fn((password: string, hash: string) => {
    // Simple mock: password matches if hash ends with the password
    return hash === `salt:${password}`;
  }),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true for valid credentials', async () => {
    mockPrisma.partner.findUnique.mockResolvedValue({
      passwordHash: 'salt:correctpass',
      isActive: true,
    });

    const result = await validateLogin('vinmec', 'correctpass');
    expect(result).toBe(true);
  });

  it('returns false for wrong password', async () => {
    mockPrisma.partner.findUnique.mockResolvedValue({
      passwordHash: 'salt:correctpass',
      isActive: true,
    });

    const result = await validateLogin('vinmec', 'wrongpassword');
    expect(result).toBe(false);
  });

  it('returns false for non-existent partner', async () => {
    mockPrisma.partner.findUnique.mockResolvedValue(null);

    const result = await validateLogin('nonexistent-partner', 'anything');
    expect(result).toBe(false);
  });

  it('returns false for inactive partner', async () => {
    mockPrisma.partner.findUnique.mockResolvedValue({
      passwordHash: 'salt:correctpass',
      isActive: false,
    });

    const result = await validateLogin('vinmec', 'correctpass');
    expect(result).toBe(false);
  });

  it('returns false for partner without password', async () => {
    mockPrisma.partner.findUnique.mockResolvedValue({
      passwordHash: null,
      isActive: true,
    });

    const result = await validateLogin('vinmec', 'anything');
    expect(result).toBe(false);
  });
});
