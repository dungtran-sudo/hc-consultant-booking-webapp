import { NextResponse } from 'next/server';

export async function GET() {
  const raw = process.env.GOOGLE_PRIVATE_KEY || '';
  const processed = raw.replace(/\\n/g, '\n');
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const sheetId = process.env.GOOGLE_SHEET_ID || '';

  return NextResponse.json({
    raw_length: raw.length,
    processed_length: processed.length,
    raw_has_literal_backslash_n: raw.includes('\\n'),
    raw_has_real_newlines: raw.includes('\n'),
    processed_has_real_newlines: processed.includes('\n'),
    raw_first_30: raw.substring(0, 30),
    raw_last_30: raw.substring(raw.length - 30),
    processed_starts_with_begin: processed.startsWith('-----BEGIN'),
    processed_ends_with_end: processed.trimEnd().endsWith('-----'),
    email_set: !!email,
    email_value: email,
    sheet_id_set: !!sheetId,
    sheet_id_value: sheetId,
  });
}
