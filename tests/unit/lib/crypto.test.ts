import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';
import { makeEncryptionKey } from '../../helpers/factories';

// Mock prisma before importing the module under test
vi.mock('@/lib/db', () => {
  const mockPrisma = createMockPrisma();
  return { prisma: mockPrisma };
});

// Import module under test after mocking
import {
  hashPhone,
  encrypt,
  decrypt,
  getOrCreateEncKey,
  encryptBookingPII,
  decryptBookingPII,
} from '@/lib/crypto';
import { prisma } from '@/lib/db';

// Cast prisma to our mock type so we can control return values
const db = prisma as unknown as MockPrisma;

describe('hashPhone', () => {
  it('returns consistent SHA-256 hex for same input', () => {
    const hash1 = hashPhone('0901234567');
    const hash2 = hashPhone('0901234567');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  it('returns different hashes for different phones', () => {
    const hash1 = hashPhone('0901234567');
    const hash2 = hashPhone('0909999999');
    expect(hash1).not.toBe(hash2);
  });

  it('trims whitespace before hashing', () => {
    const hash1 = hashPhone('0901234567');
    const hash2 = hashPhone('  0901234567  ');
    expect(hash1).toBe(hash2);
  });
});

describe('encrypt / decrypt', () => {
  const key = crypto.randomBytes(32);

  it('returns colon-separated string with 3 parts', () => {
    const result = encrypt('hello world', key);
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    // Each part should be a non-empty base64 string
    parts.forEach((part) => {
      expect(part.length).toBeGreaterThan(0);
    });
  });

  it('roundtrip recovers original plaintext', () => {
    const plaintext = 'Nguyen Van A - 0901234567';
    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('secret data', key);
    const parts = encrypted.split(':');
    // Tamper with the encrypted data portion
    const tampered = [parts[0], 'AAAA' + parts[1], parts[2]].join(':');
    expect(() => decrypt(tampered, key)).toThrow();
  });

  it('each encrypt produces different output (random IV)', () => {
    const plaintext = 'same input';
    const result1 = encrypt(plaintext, key);
    const result2 = encrypt(plaintext, key);
    expect(result1).not.toBe(result2);
  });
});

describe('getOrCreateEncKey', () => {
  beforeEach(() => {
    vi.mocked(db.encryptionKey.findUnique).mockReset();
    vi.mocked(db.encryptionKey.create).mockReset();
  });

  it('creates new key when none exists', async () => {
    db.encryptionKey.findUnique.mockResolvedValue(null);
    db.encryptionKey.create.mockResolvedValue(
      makeEncryptionKey({ phoneHash: 'abc123', isRevoked: false })
    );

    const result = await getOrCreateEncKey('abc123');
    expect(db.encryptionKey.findUnique).toHaveBeenCalledWith({
      where: { phoneHash: 'abc123' },
    });
    expect(db.encryptionKey.create).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('key');
    expect(Buffer.isBuffer(result.key)).toBe(true);
    expect(result.key).toHaveLength(32);
  });

  it('returns existing key when found', async () => {
    const existing = makeEncryptionKey({
      phoneHash: 'abc123',
      isRevoked: false,
    });
    db.encryptionKey.findUnique.mockResolvedValue(existing);

    const result = await getOrCreateEncKey('abc123');
    expect(db.encryptionKey.create).not.toHaveBeenCalled();
    expect(result.id).toBe(existing.id);
    expect(result.key).toHaveLength(32);
  });

  it('throws when key is revoked', async () => {
    const revoked = makeEncryptionKey({
      phoneHash: 'abc123',
      isRevoked: true,
    });
    db.encryptionKey.findUnique.mockResolvedValue(revoked);

    await expect(getOrCreateEncKey('abc123')).rejects.toThrow(
      'Encryption key has been revoked'
    );
  });
});

describe('encryptBookingPII / decryptBookingPII', () => {
  beforeEach(() => {
    vi.mocked(db.encryptionKey.findUnique).mockReset();
    vi.mocked(db.encryptionKey.create).mockReset();
  });

  it('full roundtrip: encrypt all 4 fields and decrypt back', async () => {
    const phone = '0901234567';
    const phoneHash = hashPhone(phone);
    const piiData = {
      patientName: 'Nguyen Van A',
      phone: '0901234567',
      conditionSummary: 'Headache for 3 days',
      notes: 'Urgent consultation needed',
    };

    // Mock for encryptBookingPII: no existing key, so it creates one
    const createdKey = makeEncryptionKey({ phoneHash, isRevoked: false });
    db.encryptionKey.findUnique.mockResolvedValueOnce(null); // getOrCreateEncKey lookup
    db.encryptionKey.create.mockResolvedValueOnce(createdKey);

    const encrypted = await encryptBookingPII(phone, piiData);
    expect(encrypted.phoneHash).toBe(phoneHash);
    expect(encrypted.encKeyId).toBe(createdKey.id);
    // All encrypted fields should be colon-separated base64 strings
    expect(encrypted.patientNameEnc.split(':')).toHaveLength(3);
    expect(encrypted.phoneEnc.split(':')).toHaveLength(3);
    expect(encrypted.conditionEnc.split(':')).toHaveLength(3);
    expect(encrypted.notesEnc.split(':')).toHaveLength(3);

    // Mock for decryptBookingPII: key exists and is not revoked
    db.encryptionKey.findUnique.mockResolvedValueOnce(
      makeEncryptionKey({ phoneHash, isRevoked: false })
    );

    const decrypted = await decryptBookingPII({
      phoneHash: encrypted.phoneHash,
      patientNameEnc: encrypted.patientNameEnc,
      phoneEnc: encrypted.phoneEnc,
      conditionEnc: encrypted.conditionEnc,
      notesEnc: encrypted.notesEnc,
    });

    expect(decrypted).not.toBeNull();
    expect(decrypted!.patientName).toBe(piiData.patientName);
    expect(decrypted!.phone).toBe(piiData.phone);
    expect(decrypted!.conditionSummary).toBe(piiData.conditionSummary);
    expect(decrypted!.notes).toBe(piiData.notes);
  });

  it('returns null when key is revoked', async () => {
    const phone = '0901234567';
    const phoneHash = hashPhone(phone);

    // First encrypt to get valid encrypted data
    db.encryptionKey.findUnique.mockResolvedValueOnce(null);
    db.encryptionKey.create.mockResolvedValueOnce(
      makeEncryptionKey({ phoneHash, isRevoked: false })
    );

    const encrypted = await encryptBookingPII(phone, {
      patientName: 'Test',
      phone: '0901234567',
      conditionSummary: 'Test condition',
      notes: '',
    });

    // Now simulate revoked key for decryption
    db.encryptionKey.findUnique.mockResolvedValueOnce(
      makeEncryptionKey({ phoneHash, isRevoked: true })
    );

    const result = await decryptBookingPII({
      phoneHash: encrypted.phoneHash,
      patientNameEnc: encrypted.patientNameEnc,
      phoneEnc: encrypted.phoneEnc,
      conditionEnc: encrypted.conditionEnc,
      notesEnc: encrypted.notesEnc,
    });

    expect(result).toBeNull();
  });
});
