# Hello Bac Si — Healthcare Consultant Webapp

## For Non-Technical Users (Consultants)

### Using the App

1. Open the app in your browser (ask your dev for the URL).
2. On the homepage, pick one of the 12 specialties: Nhi khoa, Da lieu, Sinh san, STD/STI, Tieu hoa, Tim mach, Co Xuong Khop, Tai Mui Hong, Mat, Nam khoa, Tiem chung, Xet nghiem.
3. Fill in the patient form — fields marked with * are required.
4. For "Khu vuc sinh song", if the patient is outside Ha Noi / TP.HCM / Da Nang / Can Tho, select "Tinh khac" and type the province name.
5. Click **Phan tich & Tu van**. Wait for the AI analysis (usually 10-20 seconds).
6. Review the SOAP analysis, red flags, medication notes, and recommended specialties.
7. Below the analysis, the app suggests matching partner clinics and public hospitals.
8. Click **Dat lich ngay** on a partner card to open the booking form, fill in date/time, and submit.

### What Happens After Booking

- The booking is saved to a Google Sheet automatically.
- An email is sent to the partner clinic with patient details and the "Hello Bac Si" branding.
- The partner will contact the patient within 24 hours to confirm.

---

## For Developers

### Prerequisites

- Node.js 18+
- npm
- A Google Cloud service account with Google Sheets API enabled
- An OpenAI API key
- A Gmail account with an App Password (for booking emails)
- PostgreSQL (Neon)
- Prisma

### Setup

```bash
cd healthcare-consultant-webapp
npm install
```

Create `.env.local` in the project root:

```
OPENAI_API_KEY="sk-..."
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="your-google-sheet-id"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
PII_ENCRYPTION_KEY="base64-encoded-32-byte-key"
PARTNER_SESSION_SECRET="random-secret-for-partner-sessions"
STAFF_SESSION_SECRET="random-secret-for-staff-sessions"
ADMIN_SECRET="bearer-token-for-admin-api"
CRON_SECRET="secret-for-cron-job-auth"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
```

### Running Locally

```bash
npm run dev
```

Open http://localhost:3000.

### Building for Production

```bash
npm run build
npm start
```

### Key URLs

| Path | Description |
|---|---|
| `/` | Homepage — specialty selector |
| `/consult/[specialty]` | Patient form + AI analysis |
| `/partner/login` | Partner portal login |
| `/staff/login` | Staff login |
| `/admin` | Admin portal (Bearer token auth) |
| `/consent/[token]` | Patient consent page |
| `/api/analyze` | POST — AI analysis endpoint |
| `/api/booking` | POST — booking endpoint |
| `/api/admin/form-config` | GET/POST — form config API |
| `/api/cron/cleanup` | Cron — PII cleanup endpoint |
| `/api/partners` | GET — partner list endpoint |

---

## How to Update Things

### 1. Form Fields (via Admin Page)

1. Run the app locally: `npm run dev`
2. Go to http://localhost:3000/admin
3. Use the tabs to switch between Common fields and specialty-specific fields (Nhi, Da lieu, Sinh san, STD/STI, Tieu hoa, Tim mach, Co Xuong Khop, Tai Mui Hong, Mat, Nam khoa, Tiem chung, Xet nghiem).
4. For each field you can:
   - **Edit** — change label, type, required flag, options, placeholder
   - **Reorder** — use the up/down arrows
   - **Delete** — remove the field
   - **Add** — click "+ Them field moi" at the bottom
5. Click **Save Config** — this writes to `data/form-config.json`
6. Refresh the consult page to see your changes
7. Commit and push to deploy

Field types available: `text`, `number`, `select`, `textarea`, `checkbox-group`.

The admin page uses Bearer token authentication. Set the `ADMIN_SECRET` environment variable and include the token in the `Authorization` header when accessing admin endpoints.

### 2. Partner Data (via Google Sheet)

Partner data lives in Google Sheets and syncs to the app via a script.

**Google Sheet setup** — add 3 tabs to your existing sheet:

**"Partners" tab** (columns A-K):

| id | name | website | crawl_urls | booking_email | phone | city | district | address | specialties | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| partner-1 | Clinic Name | https://... | url1,url2 | email@... | 0901... | TP.HCM | Quan 1 | 123 ABC | nhi,da-lieu | ... |

**"Branches" tab** (columns A-E):

| partner_id | branch_id | city | district | address |
|---|---|---|---|---|
| partner-1 | branch-1 | Ha Noi | Cau Giay | 456 XYZ |

**"Services" tab** (columns A-H):

| partner_id | service_id | name | specialty | description | price_range | duration | notes |
|---|---|---|---|---|---|---|---|
| partner-1 | svc-1 | Kham nhi | nhi | ... | 200k-500k | 30 phut | ... |

**Sync command:**

```bash
npm run sync-partners
```

This reads all 3 tabs, groups branches and services by partner, and writes `data/partners.json`. If the Branches or Services tabs don't exist yet, they are skipped gracefully.

After syncing, commit and push to deploy.

### 3. Specialties

Edit `data/specialties.json` directly. Each specialty has:

```json
{
  "id": "nhi",
  "label": "Nhi khoa",
  "icon": "",
  "description": "Kham va tu van suc khoe tre em tu so sinh den 15 tuoi",
  "color": "blue"
}
```

### 4. Booking Email Template

Edit `lib/mailer.ts`. The email uses inline HTML/CSS with the "Hello Bac Si" blue header banner.

### 5. AI Prompt Templates

Each specialty has its own prompt file in `lib/prompts/`:

| File | Specialty |
|---|---|
| `nhi.ts` | Nhi khoa |
| `da-lieu.ts` | Da lieu |
| `sinh-san.ts` | Sinh san |
| `std-sti.ts` | STD/STI |
| `tieu-hoa.ts` | Tieu hoa |
| `tim-mach.ts` | Tim mach |
| `co-xuong-khop.ts` | Co Xuong Khop |
| `tai-mui-hong.ts` | Tai Mui Hong |
| `mat.ts` | Mat |
| `nam-khoa.ts` | Nam khoa |
| `tiem-chung.ts` | Tiem chung |
| `xet-nghiem.ts` | Xet nghiem |

Each prompt has 4 layers:
- **Layer 1** — Doctor role and experience
- **Layer 2** — Vietnam-specific epidemiology and context
- **Layer 3** — Patient data (auto-filled from form)
- **Layer 4** — SOAP output format (shared across all specialties, in `shared.ts`)

If you add new fields via the admin page, they are automatically included in the prompt via the `buildExtraFields()` catch-all — no code changes needed.

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Connect the repo to Vercel
3. Add all `.env.local` variables to Vercel's Environment Variables settings
4. Every `git push` to `main` triggers an automatic deploy

---

## Project Structure

```
data/
  form-config.json    — form field definitions (edited via /admin)
  partners.json       — partner clinics (synced from Google Sheet)
  specialties.json    — 12 specialties metadata

components/
  ConsultForm.tsx     — config-driven patient form
  AnalysisResult.tsx  — renders SOAP analysis output
  PartnerCard.tsx     — partner clinic card
  PartnerSearch.tsx   — partner search and filtering
  BookingModal.tsx    — booking form modal
  PIIConsentGate.tsx  — PII consent gate component
  ConsentQRScreen.tsx — QR code consent screen
  ConsentModal.tsx    — consent confirmation modal
  StaffAuthGate.tsx   — staff authentication gate
  AdminAuthGate.tsx   — admin authentication gate
  ConfirmDialog.tsx   — reusable confirmation dialog
  LoadingSpinner.tsx  — loading indicator
  SpecialtyCard.tsx   — homepage specialty card

app/
  page.tsx                          — homepage
  consult/[specialty]/page.tsx      — main consult flow
  partner/
    login/page.tsx                  — partner portal login
    dashboard/page.tsx              — partner dashboard
    bookings/page.tsx               — partner bookings list
    bookings/[id]/page.tsx          — partner booking detail
  staff/
    login/page.tsx                  — staff login
    dashboard/page.tsx              — staff dashboard
  admin/
    page.tsx                        — admin portal (form config editor)
    bookings/page.tsx               — admin bookings management
    bookings/[id]/page.tsx          — admin booking detail
    staff/page.tsx                  — admin staff management
    partners/page.tsx               — admin partners management
  consent/
    [token]/page.tsx                — patient consent page
  api/
    analyze/route.ts                — AI analysis endpoint
    booking/route.ts                — booking endpoint
    admin/
      form-config/route.ts          — form config API
      bookings/route.ts             — admin bookings API
      bookings/[id]/route.ts        — admin booking detail API
      staff/route.ts                — admin staff API
    partner/
      bookings/route.ts             — partner bookings API
      bookings/[id]/route.ts        — partner booking detail API
    partners/route.ts               — partner list endpoint
    consent-token/[token]/route.ts  — consent token API
    cron/
      cleanup/route.ts              — PII cleanup cron endpoint

lib/
  types.ts            — TypeScript interfaces
  openai.ts           — OpenAI client
  sheets.ts           — Google Sheets integration
  mailer.ts           — booking email sender
  partners.ts         — partner loading and filtering
  rate-limit.ts       — rate limiting utility
  sanitize.ts         — input sanitization
  usage.ts            — usage tracking
  staff-auth.ts       — staff authentication logic
  partner-auth.ts     — partner authentication logic
  admin-auth.ts       — admin authentication logic
  consent-token.ts    — consent token generation and validation
  booking-number.ts   — booking number generator
  db.ts               — database client (Prisma)
  crypto.ts           — encryption/decryption utilities
  prompts/            — AI prompt templates (1 per specialty + shared)

middleware.ts         — Next.js middleware (auth, rate limiting)

prisma/
  schema.prisma       — database schema

scripts/
  sync-partners.ts    — Google Sheet -> partners.json sync
  crawl-partners.ts   — crawl partner websites for service data

tests/
  unit/               — unit tests
  integration/        — integration tests
  e2e/                — end-to-end tests
```
