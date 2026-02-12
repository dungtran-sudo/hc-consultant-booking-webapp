# Huong dan Cai dat & Trien khai (Developer Setup Guide)

## Yeu cau he thong

- Node.js 18+
- npm 9+
- PostgreSQL database (khuyem dung [Neon](https://neon.tech) serverless)
- Tai khoan OpenAI (API key)
- Tai khoan Google Cloud (cho Sheets API va Gmail)
- Tai khoan Vercel (de deploy)

---

## 1. Cai dat Local

### Clone va cai dat

```bash
git clone https://github.com/dungtran-sudo/hc-consultant-booking-webapp.git
cd hc-consultant-booking-webapp
npm install
```

`npm install` se tu dong chay `postinstall` script de generate Prisma client.

### Cau hinh Environment

Tao file `.env.local` o thu muc goc:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# AI
OPENAI_API_KEY="sk-..."

# Encryption
PII_ENCRYPTION_KEY="<32-byte hex string>"

# Authentication
PARTNER_SESSION_SECRET="<random 32+ char string>"
STAFF_SESSION_SECRET="<random 32+ char string>"
ADMIN_SECRET="<random string for admin access>"

# Public URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Google APIs
GOOGLE_SERVICE_ACCOUNT_EMAIL="...@...iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="<Google Sheet ID from URL>"

# Email
GMAIL_USER="your@gmail.com"
GMAIL_APP_PASSWORD="<Gmail App Password>"

# Cron
CRON_SECRET="<random string>"
```

#### Tao PII_ENCRYPTION_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Tao Session Secrets

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

### Cai dat Database

```bash
npx prisma db push
```

Lenh nay se tao tat ca 11 table trong PostgreSQL dua tren `prisma/schema.prisma`.

### Tao tai khoan admin/staff dau tien

Sau khi database san sang, tao tai khoan staff dau tien qua API:

```bash
# Dang nhap admin portal tai /admin voi ADMIN_SECRET
# Vao tab "Nhan vien" > Tao nhan vien moi
```

### Chay Development Server

```bash
npm run dev
```

Truy cap http://localhost:3000.

---

## 2. Kien truc He thong

### Luong Du lieu Chinh

```
Benh nhan → [Form tu van] → [AI Analysis (OpenAI)] → [Goi y doi tac]
                                                            ↓
                                                    [Tao booking]
                                                            ↓
                                               [QR Consent → Benh nhan quet]
                                                            ↓
                                               [Luu DB + Email doi tac]
```

### Ma hoa Du lieu

```
Phone → SHA-256 hash → phoneHash (dung de lookup)
PII (name, phone, condition, notes) → AES-256-GCM → encrypted fields
Encryption key → HKDF(masterKey, phoneHash) → per-patient key
```

**Crypto-shredding:** Xoa encryption key → du lieu PII tro thanh khong doc duoc vinh vien.

### Xac thuc

He thong co 3 lop xac thuc doc lap:

| Lop | Cookie | Secret | File |
|-----|--------|--------|------|
| Staff (CS/Doctor) | `staff_session` | `STAFF_SESSION_SECRET` | `lib/staff-auth.ts` |
| Partner | `partner_session` | `PARTNER_SESSION_SECRET` | `lib/partner-auth.ts` |
| Admin | Bearer token | `ADMIN_SECRET` | `lib/admin-auth.ts` |

Staff session token co dinh dang: `staffId:role:name:timestamp:signature` (het han sau 24 gio)

Partner session token co dinh dang: `partnerId:timestamp:signature` (het han sau 7 ngay)

Admin su dung Bearer token (khong het han, doi chieu voi ADMIN_SECRET)

### Database Models

11 models trong Prisma schema:

| Model | Table | Muc dich |
|-------|-------|----------|
| Booking | `bookings` | Dat lich voi PII ma hoa |
| Consent | `consents` | Ban ghi consent truyen thong |
| ConsentToken | `consent_tokens` | QR consent voi device fingerprint |
| Staff | `staff` | Tai khoan nhan vien |
| EncryptionKey | `encryption_keys` | Khoa ma hoa per-patient |
| AuditLog | `audit_logs` | Nhat ky hanh dong |
| DeletionRequest | `deletion_requests` | Yeu cau xoa du lieu |
| Partner | `partners` | Doi tac y te (phong kham, benh vien) |
| PartnerBranch | `partner_branches` | Chi nhanh doi tac |
| PartnerService | `partner_services` | Dich vu theo doi tac va chuyen khoa |
| ApiUsageLog | `api_usage_logs` | Theo doi chi phi su dung AI |
| RateLimit | `rate_limits` | Gioi han truy cap per-IP |

---

## 3. Cau truc Thu muc

```
app/                    # Next.js App Router
  page.tsx              # Trang chu — chon chuyen khoa
  layout.tsx            # Root layout
  consult/              # Trang tu van
  consent/              # Trang consent benh nhan (public)
  partner/              # Portal doi tac (login, dashboard)
  staff/                # Dang nhap nhan vien
  admin/                # Portal quan tri (7 trang)
  api/                  # API routes
    analyze/            # AI analysis
    booking/            # Tao dat lich
    consent-token/      # Consent token CRUD
    partner/            # Partner APIs (bookings, reveal, status, login, logout)
    partners/           # Public partner listing
    staff/              # Staff auth APIs
    admin/              # Admin APIs (stats, bookings, staff, audit, form-config, delete-patient, usage-stats)
    cron/               # Automated cleanup

middleware.ts           # CSRF protection (Origin header validation)

components/             # React components
  BookingModal.tsx      # Modal dat lich voi QR consent flow
  ConsentQRScreen.tsx   # Ma QR + polling trang thai
  ConsultForm.tsx       # Form tu van theo chuyen khoa
  AnalysisResult.tsx    # Ket qua AI (SOAP)
  PartnerCard.tsx       # The doi tac
  PartnerSearch.tsx     # Tim kiem doi tac
  ConfirmDialog.tsx     # Hop thoai xac nhan
  PIIConsentGate.tsx    # Modal cam ket bao mat PII
  StaffAuthGate.tsx     # Gate xac thuc nhan vien
  AdminAuthGate.tsx     # Gate xac thuc admin
  ConsentModal.tsx      # Modal consent truyen thong (fallback)
  SpecialtyCard.tsx     # The chuyen khoa trang chu
  LoadingSpinner.tsx    # Loading indicator

lib/                    # Server utilities
  db.ts                 # Prisma client (Neon adapter, lazy init)
  crypto.ts             # AES-256-GCM encryption/decryption
  staff-auth.ts         # Staff auth (scrypt + HMAC, 24h expiry)
  partner-auth.ts       # Partner auth (HMAC, 7d expiry)
  admin-auth.ts         # Admin auth (Bearer token)
  booking-number.ts     # Ma dat lich (HHG-XXX-XXXX-XX)
  consent-token.ts      # Token consent
  consent.ts            # Logic consent
  mailer.ts             # Nodemailer (Gmail SMTP)
  openai.ts             # OpenAI client (lazy init)
  partners.ts           # Load/filter partners
  rate-limit.ts         # Rate limiting per-IP
  sanitize.ts           # Input sanitization (HTML/control chars)
  usage.ts              # LLM budget tracking (reserve/finalize/cancel)
  types.ts              # TypeScript interfaces
  prompts/              # AI prompt templates (12 chuyen khoa)

data/                   # Du lieu tinh
  partners.json         # Thong tin doi tac y te
  specialties.json      # Metadata 12 chuyen khoa
  form-config.json      # Cau hinh form dong

prisma/
  schema.prisma         # Database schema (11 models)

tests/                  # Test suite (Vitest)
  unit/                 # Unit tests
  integration/          # API integration tests
  e2e/                  # End-to-end flow tests

scripts/
  sync-partners.ts      # Google Sheet → partners.json sync
  crawl-partners.ts     # Crawl partner websites
```

---

## 4. Trien khai len Vercel

### Thiet lap Env Vars

Thiet lap **tat ca** environment variables trong Vercel project settings truoc khi deploy.

**Luu y quan trong:**
- Dung `printf '%s'` thay vi `echo` khi pipe gia tri qua CLI (tranh trailing newline)
- Voi `GOOGLE_PRIVATE_KEY`, luu dang escaped `\n` va dung `replace(/\\n/g, '\n')` o runtime

```bash
# Vi du them env var qua CLI
printf '%s' 'your-secret-value' | vercel env add STAFF_SESSION_SECRET production
```

### Deploy

```bash
# Preview deploy
vercel --yes

# Production deploy
vercel --prod --yes

# Alias domain
vercel alias set <deployment-url> hhg-booking.vercel.app
```

### Kiem tra sau deploy

1. Truy cap https://hhg-booking.vercel.app — trang chu hien thi 12 chuyen khoa
2. Chon 1 chuyen khoa, dien form, gui — AI analysis hien thi
3. Dang nhap staff tai `/staff/login`
4. Dang nhap partner tai `/partner/login`
5. Dang nhap admin tai `/admin`
6. Kiem tra audit logs tai `/admin/audit`

---

## 5. Bao tri

### Cap nhat Du lieu Doi tac

```bash
npm run sync-partners
```

Hoac chinh sua truc tiep `data/partners.json`.

### Database Migration

Khi thay doi `prisma/schema.prisma`:

```bash
# Tao migration SQL
npx prisma db push

# Hoac tao migration file
npx prisma migrate dev --name <ten_migration>
```

### Prisma Client

Sau khi thay doi schema, regenerate client:

```bash
npx prisma generate
```

### Xem Logs

```bash
vercel logs <deployment-url>
# Hoac
vercel inspect <deployment-url> --logs
```

---

## 6. Luu y Ky thuat

### Prisma v7 voi Neon Adapter

- Client duoc generate tai `lib/generated/prisma/`
- Su dung `@prisma/adapter-neon` voi `@neondatabase/serverless`
- `lib/db.ts` su dung Proxy de lazy-init (tranh loi khi build static pages)

### Module-level Side Effects

- **KHONG** khoi tao OpenAI client o module level (se loi khi Vercel build static pages)
- Su dung getter function (lazy initialization) thay the
- `nodemailer.createTransport()` an toan o module level

### Prisma Migrations

- `prisma db execute --url` **KHONG** hoat dong trong Prisma v7
- Bo flag `--url`, Prisma se tu doc tu datasource config
- Uu tien `prisma db push` cho development, `prisma migrate` cho production

---

## 7. Bao mat

### CSRF Protection

`middleware.ts` kiem tra Origin header tren tat ca request POST/PATCH/PUT/DELETE den `/api/*`. Request khong co Origin hop le se bi tu choi.

### Rate Limiting

Gioi han truy cap per-IP tren tat ca API endpoints:

- `analyze`: 10 request/phut
- `booking`: 20 request/gio
- Partner endpoints: 30-60 request/phut

### Input Sanitization

HTML tags va control characters duoc loai bo khoi tat ca input cua nguoi dung truoc khi xu ly. Xu ly boi `lib/sanitize.ts`.

### Session Token Expiry

- Partner: 7 ngay — timestamp duoc nhung trong HMAC payload
- Staff: 24 gio — timestamp duoc nhung trong HMAC payload

### LLM Budget Control

Su dung pattern atomic reserve/finalize/cancel de ngan chan overspend khi co nhieu request dong thoi. Budget duoc theo doi trong bang `api_usage_logs`.
