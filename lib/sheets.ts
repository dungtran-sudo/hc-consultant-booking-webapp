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
    range: 'Sheet1!A:K',
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
        payload.preferredDate?.split('-').reverse().join('/'),
        payload.preferredTime,
        payload.notes,
      ]],
    },
  });
}
