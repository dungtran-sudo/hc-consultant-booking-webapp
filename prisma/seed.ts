import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { hashPassword } from '../lib/staff-auth';
import partnersData from '../data/partners.json';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface SeedPartner {
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
  isActive?: boolean;
  services?: {
    name: string;
    specialty: string;
    description?: string;
    priceRange?: string;
    duration?: string;
  }[];
  branches?: {
    name?: string;
    city: string;
    district?: string;
    address: string;
    phone?: string;
  }[];
}

async function main() {
  console.log('Seeding partners...');

  const partners = partnersData as SeedPartner[];

  for (const p of partners) {
    const passwordHash = p.password ? await hashPassword(p.password) : null;

    // Upsert partner
    await prisma.partner.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        type: p.type || 'hospital',
        website: p.website || '',
        bookingEmail: p.bookingEmail || '',
        phone: p.phone || '',
        city: p.city || '',
        district: p.district || '',
        address: p.address || '',
        specialties: p.specialties || [],
        notes: p.notes || '',
        passwordHash,
        isActive: p.isActive ?? true,
      },
      create: {
        id: p.id,
        name: p.name,
        type: p.type || 'hospital',
        website: p.website || '',
        bookingEmail: p.bookingEmail || '',
        phone: p.phone || '',
        city: p.city || '',
        district: p.district || '',
        address: p.address || '',
        specialties: p.specialties || [],
        notes: p.notes || '',
        passwordHash,
        isActive: p.isActive ?? true,
      },
    });

    // Replace branches
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

    // Replace services
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

    console.log(`  ✓ ${p.id} (${p.branches?.length || 0} branches, ${p.services?.length || 0} services)`);
  }

  console.log(`\nSeeded ${partners.length} partners.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
