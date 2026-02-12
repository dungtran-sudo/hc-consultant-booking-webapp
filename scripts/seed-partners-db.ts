/**
 * Seed / sync all partners from data/partners.json into the Prisma database.
 *
 * Usage:  npx tsx scripts/seed-partners-db.ts
 *
 * What it does:
 *   - Upserts every partner (core fields, branches, services)
 *   - Hashes the `password` field from JSON (or falls back to `{id}2024`)
 *   - Skips password update if the partner already has a passwordHash in the DB
 *   - Prints a summary at the end
 */

import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

interface JsonPartner {
  id: string;
  name: string;
  type?: string;
  website?: string;
  bookingEmail?: string;
  phone?: string;
  city?: string;
  district?: string;
  address?: string;
  specialties?: string[];
  notes?: string;
  password?: string;
  services?: Array<{
    name: string;
    specialty: string;
    description?: string;
    priceRange?: string;
    duration?: string;
  }>;
  branches?: Array<{
    name?: string;
    city: string;
    district?: string;
    address: string;
    phone?: string;
  }>;
}

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const jsonPath = path.resolve(__dirname, '../data/partners.json');
  const partners: JsonPartner[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`Loaded ${partners.length} partners from partners.json\n`);

  let created = 0;
  let updated = 0;
  let passwordsSet = 0;

  for (const p of partners) {
    const existing = await prisma.partner.findUnique({
      where: { id: p.id },
      select: { id: true, passwordHash: true },
    });

    // Only set password if partner doesn't already have one in DB
    let passwordHash: string | undefined;
    if (!existing?.passwordHash) {
      const rawPassword = p.password || `${p.id}2024`;
      passwordHash = await hashPassword(rawPassword);
      passwordsSet++;
    }

    await prisma.partner.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        type: p.type || 'clinic',
        website: p.website || '',
        bookingEmail: p.bookingEmail || '',
        phone: p.phone || '',
        city: p.city || '',
        district: p.district || '',
        address: p.address || '',
        specialties: p.specialties || [],
        notes: p.notes || '',
        passwordHash: passwordHash ?? null,
        isActive: true,
      },
      update: {
        name: p.name,
        type: p.type || 'clinic',
        website: p.website || '',
        bookingEmail: p.bookingEmail || '',
        phone: p.phone || '',
        city: p.city || '',
        district: p.district || '',
        address: p.address || '',
        specialties: p.specialties || [],
        notes: p.notes || '',
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    // Sync branches: delete existing, recreate
    await prisma.partnerBranch.deleteMany({ where: { partnerId: p.id } });
    if (p.branches && p.branches.length > 0) {
      await prisma.partnerBranch.createMany({
        data: p.branches.map((b) => ({
          partnerId: p.id,
          name: b.name || '',
          city: b.city,
          district: b.district || '',
          address: b.address,
          phone: b.phone || '',
        })),
      });
    }

    // Sync services: delete existing, recreate
    await prisma.partnerService.deleteMany({ where: { partnerId: p.id } });
    if (p.services && p.services.length > 0) {
      await prisma.partnerService.createMany({
        data: p.services.map((s) => ({
          partnerId: p.id,
          name: s.name,
          specialty: s.specialty,
          description: s.description || '',
          priceRange: s.priceRange || '',
          duration: s.duration || '',
        })),
      });
    }

    const label = existing ? 'updated' : 'created';
    const branchCount = p.branches?.length || 0;
    const serviceCount = p.services?.length || 0;
    console.log(`  ${label}  ${p.id} (${branchCount} branches, ${serviceCount} services)`);

    if (existing) updated++;
    else created++;
  }

  console.log(`\nDone! Created: ${created}, Updated: ${updated}, Passwords set: ${passwordsSet}`);
  if (passwordsSet > 0) {
    console.log('Partners without explicit password got default: {id}2024');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
