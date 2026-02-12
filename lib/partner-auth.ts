import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { verifyPassword } from './staff-auth';

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

export async function validateLogin(partnerId: string, password: string): Promise<boolean> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { passwordHash: true, isActive: true },
  });
  if (!partner || !partner.passwordHash || !partner.isActive) return false;
  return verifyPassword(password, partner.passwordHash);
}

export async function getPortalPartnerIds(): Promise<string[]> {
  const partners = await prisma.partner.findMany({
    where: { passwordHash: { not: null }, isActive: true },
    select: { id: true },
  });
  return partners.map((p) => p.id);
}

export async function getPartnerName(partnerId: string): Promise<string> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { name: true },
  });
  return partner?.name || partnerId;
}

export async function getSessionPartnerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
