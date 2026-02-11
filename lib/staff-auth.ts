import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'staff_session';

function getSecret(): string {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret) throw new Error('STAFF_SESSION_SECRET not set');
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') === hash);
    });
  });
}

export function createStaffSessionToken(
  staffId: string,
  name: string,
  role: string
): string {
  const secret = getSecret();
  const payload = `${staffId}:${role}:${name}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `${payload}:${signature}`;
}

export function verifyStaffSessionToken(
  token: string
): { staffId: string; staffName: string; role: string } | null {
  const parts = token.split(':');
  if (parts.length < 4) return null;

  const signature = parts.pop()!;
  const payload = parts.join(':');
  // Re-split payload: staffId:role:name (name may contain colons)
  const [staffId, role, ...nameParts] = payload.split(':');
  const staffName = nameParts.join(':');

  const secret = getSecret();
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expected) return null;
  return { staffId, staffName, role };
}

export async function getSessionStaff(): Promise<{
  staffId: string;
  staffName: string;
  role: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStaffSessionToken(token);
}

export { COOKIE_NAME as STAFF_COOKIE_NAME };
