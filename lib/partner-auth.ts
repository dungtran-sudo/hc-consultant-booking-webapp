import crypto from 'crypto';
import { cookies } from 'next/headers';
import { loadPartners } from './partners';
import passwordsData from '@/data/partner-passwords.json';

const COOKIE_NAME = 'partner_session';

function getSecret(): string {
  const secret = process.env.PARTNER_SESSION_SECRET;
  if (!secret) throw new Error('Missing PARTNER_SESSION_SECRET');
  return secret;
}

export function createSessionToken(partnerId: string): string {
  const secret = getSecret();
  const signature = crypto.createHmac('sha256', secret).update(partnerId).digest('hex');
  return `${partnerId}:${signature}`;
}

export function verifySessionToken(token: string): string | null {
  const secret = getSecret();
  const colonIndex = token.indexOf(':');
  if (colonIndex === -1) return null;
  const partnerId = token.substring(0, colonIndex);
  const signature = token.substring(colonIndex + 1);
  const expected = crypto.createHmac('sha256', secret).update(partnerId).digest('hex');
  if (signature !== expected) return null;
  return partnerId;
}

export function validateLogin(partnerId: string, password: string): boolean {
  const passwords = passwordsData as Record<string, string>;
  if (!passwords[partnerId]) return false;
  return passwords[partnerId] === password;
}

export function getPortalPartnerIds(): string[] {
  return Object.keys(passwordsData as Record<string, string>);
}

export function getPartnerName(partnerId: string): string {
  const partners = loadPartners();
  const partner = partners.find((p) => p.id === partnerId);
  return partner?.name || partnerId;
}

export async function getSessionPartnerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
