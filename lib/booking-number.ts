import { prisma } from '@/lib/db';

function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getPartnerCode(partnerName: string): string {
  const clean = stripDiacritics(partnerName)
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
  return clean.substring(0, 3).padEnd(3, 'X');
}

function getPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4).padStart(4, '0');
}

const SUFFIX_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I, O to avoid confusion

function generateSuffix(index: number): string {
  if (index < 9 * SUFFIX_CHARS.length) {
    const letterIdx = Math.floor(index / 9);
    const digit = (index % 9) + 1;
    return `${SUFFIX_CHARS[letterIdx]}${digit}`;
  }
  // Extended: AA, AB, AC...
  const extended = index - 9 * SUFFIX_CHARS.length;
  const first = Math.floor(extended / SUFFIX_CHARS.length);
  const second = extended % SUFFIX_CHARS.length;
  return `${SUFFIX_CHARS[first % SUFFIX_CHARS.length]}${SUFFIX_CHARS[second]}`;
}

export async function generateBookingNumber(
  partnerName: string,
  phone: string
): Promise<string> {
  const partnerCode = getPartnerCode(partnerName);
  const phoneDigits = getPhoneDigits(phone);
  const prefix = `HHG-${partnerCode}-${phoneDigits}`;

  // Find existing booking numbers with this prefix
  const existing = await prisma.booking.findMany({
    where: {
      bookingNumber: { startsWith: prefix },
    },
    select: { bookingNumber: true },
  });

  const existingSet = new Set(existing.map((b) => b.bookingNumber));

  for (let i = 0; i < 1000; i++) {
    const candidate = `${prefix}-${generateSuffix(i)}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback: add random suffix
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}
