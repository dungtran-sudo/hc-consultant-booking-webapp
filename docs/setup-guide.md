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

Lenh nay se tao tat ca 7 table trong PostgreSQL dua tren `prisma/schema.prisma`.

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

Moi session token co dinh dang: `id:role:name:hmac_signature`

### Database Models

7 models trong Prisma schema:

| Model | Table | Muc dich |
|-------|-------|----------|
| Booking | `bookings` | Dat lich voi PII ma hoa |
| Consent | `consents` | Ban ghi consent truyen thong |
| ConsentToken | `consent_tokens` | QR consent voi device fingerprint |
| Staff | `staff` | Tai khoan nhan vien |
| EncryptionKey | `encryption_keys` | Khoa ma hoa per-patient |
| AuditLog | `audit_logs` | Nhat ky hanh dong |
| DeletionRequest | `deletion_requests` | Yeu cau xoa du lieu |

---

## 3. Cau truc Thu muc

```
app/                    # Next.js App Router
  page.tsx              # Trang chu — chon chuyen khoa
  layout.tsx            # Root layout (Vietnamese lang, metadata)
  consult/              # Trang tu van
  consent/              # Trang consent benh nhan (public)
  partner/              # Portal doi tac
  staff/                # Dang nhap nhan vien
  admin/                # Portal quan tri
  api/                  # API routes

components/             # React components
  BookingModal.tsx      # Modal dat lich voi QR consent flow
  ConsentQRScreen.tsx   # Hien thi ma QR + polling trang thai
  ConfirmDialog.tsx     # Hop thoai xac nhan
  PIIConsentGate.tsx    # Modal cam ket bao mat PII
  StaffAuthGate.tsx     # Gate xac thuc nhan vien
  AdminAuthGate.tsx     # Gate xac thuc admin
  ConsultForm.tsx       # Form tu van theo chuyen khoa
  AnalysisResult.tsx    # Hien thi ket qua AI (SOAP)
  PartnerCard.tsx       # The doi tac
  ConsentModal.tsx      # Modal consent truyen thong (fallback)

lib/                    # Server utilities
  db.ts                 # Prisma client (Neon adapter, lazy init)
  crypto.ts             # AES-256-GCM encryption/decryption
  staff-auth.ts         # Staff auth (scrypt + HMAC)
  partner-auth.ts       # Partner auth
  admin-auth.ts         # Admin auth
  booking-number.ts     # Tao ma dat lich (HHG-XXX-XXXX-XX)
  consent-token.ts      # Tao token consent
  consent.ts            # Logic consent
  mailer.ts             # Nodemailer (Gmail SMTP)
  openai.ts             # OpenAI client
  partners.ts           # Load/filter partners
  types.ts              # TypeScript interfaces
  prompts/              # AI prompt templates (5 chuyen khoa)

data/                   # Du lieu tinh
  partners.json         # Thong tin doi tac y te
  specialties.json      # Metadata 5 chuyen khoa
  partner-passwords.json # Mat khau doi tac (hashed)
  form-config.json      # Cau hinh form dong

prisma/
  schema.prisma         # Database schema (7 models)
  migrations/           # Migration history
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

1. Truy cap https://hhg-booking.vercel.app — trang chu hien thi 5 chuyen khoa
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
