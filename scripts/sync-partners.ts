import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

interface SheetPartner {
  id: string;
  name: string;
  website: string;
  crawl_urls: string[];
  booking_email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  specialties: string[];
  notes: string;
}

interface SheetBranch {
  partner_id: string;
  branch_id: string;
  city: string;
  district: string;
  address: string;
}

interface SheetService {
  partner_id: string;
  service_id: string;
  name: string;
  specialty: string;
  description: string;
  price_range: string;
  duration: string;
  notes: string;
}

function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY || '';
  return raw.replace(/\\n/g, '\n');
}

function getAuth() {
  const privateKey = getPrivateKey();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google credentials');
  }
  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

async function readSheet(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, range: string): Promise<string[][]> {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return (res.data.values || []) as string[][];
}

function parsePartners(rows: string[][]): SheetPartner[] {
  if (rows.length < 2) return [];
  const [, ...dataRows] = rows; // skip header
  return dataRows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      id: (row[0] || '').trim(),
      name: (row[1] || '').trim(),
      website: (row[2] || '').trim(),
      crawl_urls: (row[3] || '').split(',').map((u) => u.trim()).filter(Boolean),
      booking_email: (row[4] || '').trim(),
      phone: (row[5] || '').trim(),
      city: (row[6] || '').trim(),
      district: (row[7] || '').trim(),
      address: (row[8] || '').trim(),
      specialties: (row[9] || '').split(',').map((s) => s.trim()).filter(Boolean),
      notes: (row[10] || '').trim(),
    }));
}

function parseBranches(rows: string[][]): SheetBranch[] {
  if (rows.length < 2) return [];
  const [, ...dataRows] = rows;
  return dataRows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      partner_id: (row[0] || '').trim(),
      branch_id: (row[1] || '').trim(),
      city: (row[2] || '').trim(),
      district: (row[3] || '').trim(),
      address: (row[4] || '').trim(),
    }));
}

function parseServices(rows: string[][]): SheetService[] {
  if (rows.length < 2) return [];
  const [, ...dataRows] = rows;
  return dataRows
    .filter((row) => row[0]?.trim())
    .map((row) => ({
      partner_id: (row[0] || '').trim(),
      service_id: (row[1] || '').trim(),
      name: (row[2] || '').trim(),
      specialty: (row[3] || '').trim(),
      description: (row[4] || '').trim(),
      price_range: (row[5] || '').trim(),
      duration: (row[6] || '').trim(),
      notes: (row[7] || '').trim(),
    }));
}

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('Reading Partners tab...');
  const partnersRows = await readSheet(sheets, spreadsheetId, 'Partners!A:K');
  const partners = parsePartners(partnersRows);
  console.log(`  Found ${partners.length} partners`);

  let branches: SheetBranch[] = [];
  try {
    console.log('Reading Branches tab...');
    const branchesRows = await readSheet(sheets, spreadsheetId, 'Branches!A:E');
    branches = parseBranches(branchesRows);
    console.log(`  Found ${branches.length} branches`);
  } catch {
    console.log('  Branches tab not found, skipping');
  }

  let services: SheetService[] = [];
  try {
    console.log('Reading Services tab...');
    const servicesRows = await readSheet(sheets, spreadsheetId, 'Services!A:H');
    services = parseServices(servicesRows);
    console.log(`  Found ${services.length} services`);
  } catch {
    console.log('  Services tab not found, skipping');
  }

  // Group branches and services by partner_id
  const branchesByPartner = new Map<string, SheetBranch[]>();
  for (const b of branches) {
    const arr = branchesByPartner.get(b.partner_id) || [];
    arr.push(b);
    branchesByPartner.set(b.partner_id, arr);
  }

  const servicesByPartner = new Map<string, SheetService[]>();
  for (const s of services) {
    const arr = servicesByPartner.get(s.partner_id) || [];
    arr.push(s);
    servicesByPartner.set(s.partner_id, arr);
  }

  // Assemble final JSON
  const output = partners.map((p) => ({
    id: p.id,
    name: p.name,
    website: p.website,
    crawl_urls: p.crawl_urls,
    booking_email: p.booking_email,
    phone: p.phone,
    city: p.city,
    district: p.district,
    address: p.address,
    branches: (branchesByPartner.get(p.id) || []).map((b) => ({
      id: b.branch_id,
      city: b.city,
      district: b.district,
      address: b.address,
    })),
    specialties: p.specialties,
    notes: p.notes,
    services: (servicesByPartner.get(p.id) || []).map((s) => ({
      id: s.service_id,
      name: s.name,
      specialty: s.specialty,
      description: s.description,
      price_range: s.price_range,
      duration: s.duration,
      notes: s.notes,
    })),
  }));

  const outPath = path.resolve(__dirname, '../data/partners.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');

  console.log(`\nWritten ${output.length} partners to data/partners.json`);
  console.log('Summary:');
  for (const p of output) {
    console.log(`  ${p.id}: ${p.name} (${p.branches.length} branches, ${p.services.length} services)`);
  }
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
