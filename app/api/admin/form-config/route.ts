import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { validateAdminAuth } from '@/lib/admin-auth';

const CONFIG_PATH = path.resolve(process.cwd(), 'data/form-config.json');

export async function GET(request: Request) {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return NextResponse.json(JSON.parse(data));
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await request.json();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  return NextResponse.json({ success: true });
}
