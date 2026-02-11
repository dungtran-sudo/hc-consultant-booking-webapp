import crypto from 'crypto';

export function generateConsentToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getConsentUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${base}/consent/${token}`;
}
