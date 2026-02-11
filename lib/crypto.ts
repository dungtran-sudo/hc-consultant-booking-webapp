import crypto from 'crypto';
import { prisma } from './db';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCODING: BufferEncoding = 'base64';

function getMasterKey(): Buffer {
  const hex = process.env.PII_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('PII_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function hashPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone.trim()).digest('hex');
}

function deriveKey(masterKey: Buffer, phoneHash: string): Buffer {
  return Buffer.from(
    crypto.hkdfSync('sha256', masterKey, phoneHash, 'pii-encryption', 32)
  );
}

export function encrypt(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString(ENCODING),
    encrypted.toString(ENCODING),
    tag.toString(ENCODING),
  ].join(':');
}

export function decrypt(encryptedStr: string, key: Buffer): string {
  const [ivB64, dataB64, tagB64] = encryptedStr.split(':');
  const iv = Buffer.from(ivB64, ENCODING);
  const data = Buffer.from(dataB64, ENCODING);
  const tag = Buffer.from(tagB64, ENCODING);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString('utf8') + decipher.final('utf8');
}

export async function getOrCreateEncKey(
  phoneHash: string
): Promise<{ id: string; key: Buffer }> {
  const masterKey = getMasterKey();
  const derivedKey = deriveKey(masterKey, phoneHash);

  let record = await prisma.encryptionKey.findUnique({
    where: { phoneHash },
  });

  if (!record) {
    const keyMaterial = encrypt(derivedKey.toString('hex'), masterKey);
    record = await prisma.encryptionKey.create({
      data: { phoneHash, keyMaterial },
    });
  }

  if (record.isRevoked) {
    throw new Error('Encryption key has been revoked (data deleted)');
  }

  return { id: record.id, key: derivedKey };
}

export async function revokeEncKey(phoneHash: string): Promise<void> {
  await prisma.encryptionKey.updateMany({
    where: { phoneHash },
    data: { isRevoked: true, keyMaterial: 'REVOKED' },
  });
}

export async function encryptBookingPII(
  phone: string,
  data: {
    patientName: string;
    phone: string;
    conditionSummary: string;
    notes: string;
  }
): Promise<{
  phoneHash: string;
  encKeyId: string;
  patientNameEnc: string;
  phoneEnc: string;
  conditionEnc: string;
  notesEnc: string;
}> {
  const ph = hashPhone(phone);
  const { id, key } = await getOrCreateEncKey(ph);
  return {
    phoneHash: ph,
    encKeyId: id,
    patientNameEnc: encrypt(data.patientName, key),
    phoneEnc: encrypt(data.phone, key),
    conditionEnc: encrypt(data.conditionSummary, key),
    notesEnc: encrypt(data.notes || '', key),
  };
}

export async function decryptBookingPII(booking: {
  phoneHash: string;
  patientNameEnc: string;
  phoneEnc: string;
  conditionEnc: string;
  notesEnc: string;
}): Promise<{
  patientName: string;
  phone: string;
  conditionSummary: string;
  notes: string;
} | null> {
  const masterKey = getMasterKey();
  const derivedKey = deriveKey(masterKey, booking.phoneHash);

  const encKey = await prisma.encryptionKey.findUnique({
    where: { phoneHash: booking.phoneHash },
  });

  if (!encKey || encKey.isRevoked) {
    return null;
  }

  try {
    return {
      patientName: decrypt(booking.patientNameEnc, derivedKey),
      phone: decrypt(booking.phoneEnc, derivedKey),
      conditionSummary: decrypt(booking.conditionEnc, derivedKey),
      notes: decrypt(booking.notesEnc, derivedKey),
    };
  } catch {
    return null;
  }
}
