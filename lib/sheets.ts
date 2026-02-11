import { google } from 'googleapis';
import { BookingPayload } from './types';

function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY || '';
  // Handle both actual newlines and escaped \n in env vars
  return raw.replace(/\\n/g, '\n');
}

function getAuth() {
  const privateKey = getPrivateKey();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey) {
    throw new Error(
      `Missing Google credentials: email=${!!clientEmail}, key=${!!privateKey}`
    );
  }

  console.log('[sheets debug] clientEmail:', clientEmail);
  console.log('[sheets debug] key length:', privateKey.length);
  console.log('[sheets debug] key starts with BEGIN:', privateKey.startsWith('-----BEGIN'));
  console.log('[sheets debug] key has real newlines:', privateKey.includes('\n'));
  console.log('[sheets debug] key first 30:', privateKey.substring(0, 30));

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function appendBookingRow(payload: BookingPayload): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:L',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toISOString(),
        payload.sessionId,
        payload.patientName,
        payload.phone,
        payload.conditionSummary,
        payload.serviceName,
        payload.partnerName,
        payload.branchAddress,
        payload.preferredDate,
        payload.preferredTime,
        payload.notes,
        payload.partnerId,
      ]],
    },
  });
}

export interface BookingRow {
  timestamp: string;
  sessionId: string;
  patientName: string;
  phone: string;
  conditionSummary: string;
  serviceName: string;
  partnerName: string;
  branchAddress: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  partnerId: string;
}

export async function readBookingsByPartner(partnerId: string): Promise<BookingRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A:L',
  });

  const rows = response.data.values || [];

  const bookings = rows
    .filter((row) => row[11] === partnerId)
    .map((row) => ({
      timestamp: row[0] || '',
      sessionId: row[1] || '',
      patientName: row[2] || '',
      phone: row[3] || '',
      conditionSummary: row[4] || '',
      serviceName: row[5] || '',
      partnerName: row[6] || '',
      branchAddress: row[7] || '',
      preferredDate: row[8] || '',
      preferredTime: row[9] || '',
      notes: row[10] || '',
      partnerId: row[11] || '',
    }));

  return bookings.reverse();
}
