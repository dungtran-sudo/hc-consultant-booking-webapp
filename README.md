# Hello Bac Si — Healthcare Consultant Booking Platform

Internal platform for healthcare consultants to provide AI-powered clinical analysis and manage patient bookings with partner clinics.

**Live:** https://hhg-booking.vercel.app

## Overview

The platform has four user-facing portals:

| Portal | URL | Purpose |
|--------|-----|---------|
| Consultation | `/consult/[specialty]` | CS/Doctor fills patient form, gets AI analysis, creates bookings |
| Partner | `/partner/login` | Partner clinics manage their bookings, view patient data |
| Admin | `/admin` | System admin manages bookings, staff, audit logs, form config |
| Patient Consent | `/consent/[token]` | Patient scans QR to consent to data sharing |

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript, React 19
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL (Neon serverless) via Prisma v7
- **AI:** OpenAI GPT-4o for clinical analysis (SOAP format)
- **Email:** Nodemailer (Gmail SMTP)
- **Logging:** Google Sheets API for booking records
- **Deployment:** Vercel

## Key Features

- **5 Medical Specialties:** Nhi khoa, Da lieu, Sinh san, STD/STI, Tieu hoa
- **AI Clinical Analysis:** SOAP-format analysis with Vietnam-specific epidemiology
- **End-to-End Encryption:** Patient PII encrypted with AES-256-GCM, per-patient HKDF keys
- **Crypto-shredding:** Delete encryption keys to permanently erase patient data
- **Staff Authentication:** Individual accounts with scrypt password hashing, HMAC session tokens
- **Patient Consent via QR:** Patients scan QR code to consent, with device fingerprinting for audit proof
- **Custom Booking Numbers:** Format `HHG-{partner}-{phone}-{suffix}` (e.g., `HHG-VIN-4567-A1`)
- **PII Compliance Gate:** Healthcare data privacy acknowledgment required before viewing patient data
- **Full Audit Trail:** Every action logged with actor, IP, timestamp, and metadata
- **Vietnamese UI:** All interfaces in Vietnamese with proper diacritics

## Quick Start

```bash
git clone https://github.com/dungtran-sudo/hc-consultant-booking-webapp.git
cd hc-consultant-booking-webapp
cp .env.local.example .env.local   # Fill in your values
npm install
npm run dev
```

Open http://localhost:3000.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI analysis |
| `PII_ENCRYPTION_KEY` | Yes | 32-byte hex key for AES-256-GCM patient data encryption |
| `PARTNER_SESSION_SECRET` | Yes | HMAC secret for partner session tokens |
| `STAFF_SESSION_SECRET` | Yes | HMAC secret for staff session tokens |
| `ADMIN_SECRET` | Yes | Shared secret for admin portal access |
| `NEXT_PUBLIC_BASE_URL` | Yes | Public app URL (e.g., `https://hhg-booking.vercel.app`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes | Google service account for Sheets API |
| `GOOGLE_PRIVATE_KEY` | Yes | Google service account private key |
| `GOOGLE_SHEET_ID` | Yes | Google Sheet ID for booking records |
| `GMAIL_USER` | Yes | Gmail address for sending booking emails |
| `GMAIL_APP_PASSWORD` | Yes | Gmail App Password for SMTP |
| `CRON_SECRET` | Yes | Secret for cron job endpoints |

## Database

Prisma v7 with Neon serverless adapter. 7 models:

- **Booking** — Encrypted patient bookings with status tracking
- **Consent** — Patient data sharing consent records
- **ConsentToken** — QR-based consent tokens with device fingerprinting
- **Staff** — CS/Doctor user accounts (scrypt hashed passwords)
- **EncryptionKey** — Per-patient AES-256-GCM key material
- **AuditLog** — Comprehensive action audit trail
- **DeletionRequest** — GDPR-style patient data deletion requests

Run migrations:
```bash
npx prisma db push
```

## Project Structure

```
app/
  page.tsx                          # Specialty selector homepage
  consult/[specialty]/page.tsx      # Consultation form + AI analysis
  consent/[token]/page.tsx          # Patient consent page (public)
  partner/
    login/page.tsx                  # Partner login
    dashboard/page.tsx              # Partner booking dashboard
  staff/login/page.tsx              # Staff login
  admin/
    page.tsx                        # Admin dashboard
    bookings/page.tsx               # Booking management
    staff/page.tsx                  # Staff management
    audit/page.tsx                  # Audit logs
    consents/page.tsx               # Consent records
    form-config/page.tsx            # Dynamic form configuration
    delete/page.tsx                 # Patient data deletion
  api/
    analyze/route.ts                # POST: AI clinical analysis
    booking/route.ts                # POST: Create booking
    consent-token/                  # Consent token CRUD
    partner/                        # Partner APIs (bookings, PII reveal)
    staff/                          # Staff auth APIs
    admin/                          # Admin APIs (stats, bookings, staff, audit)
    cron/cleanup/route.ts           # Automated data cleanup

components/                         # Reusable React components
lib/                                # Server utilities, auth, crypto, prompts
data/                               # Partner data, specialties, form config
prisma/                             # Database schema and migrations
```

## Documentation

- [Developer Setup Guide](docs/setup-guide.md) — Environment setup, database, deployment
- [Admin Portal Guide](docs/admin-guide.md) — Managing bookings, staff, audit logs
- [Partner Portal Guide](docs/partner-guide.md) — Viewing bookings, patient data access
- [Staff User Guide](docs/staff-guide.md) — Consultation flow, QR consent, booking creation

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run start            # Start production server
npm run sync-partners    # Sync partner data from source
```

## Deployment

```bash
vercel --prod
vercel alias set <deployment-url> hhg-booking.vercel.app
```

All environment variables must be set in Vercel project settings before deploying.

## Security

- Patient PII (name, phone, condition, notes) is encrypted at rest with AES-256-GCM
- Per-patient encryption keys derived via HKDF from phone hash
- Crypto-shredding: deleting a patient's key makes their data permanently unrecoverable
- Staff passwords hashed with scrypt (random salt per password)
- Session tokens use HMAC-SHA256 signatures in httpOnly cookies
- PII reveal requires per-session healthcare compliance acknowledgment
- Patient consent via QR records IP, user-agent, and device fingerprint as proof
- All actions logged to audit trail with actor, IP, and timestamp
