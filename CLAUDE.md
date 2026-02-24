# Healthcare Consultant Webapp (HHG Internal)

Vietnamese-language healthcare consultation platform with AI triage, partner management, and booking system. Deployed on Vercel (Hobby) + Neon (free tier PostgreSQL).

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL via Neon, Prisma ORM (schema at `prisma/schema.prisma`)
- **Styling**: Tailwind CSS
- **State**: SWR for data fetching
- **AI**: OpenAI GPT-4o for medical triage (`lib/openai.ts`)
- **Auth**: Admin uses Bearer token (`ADMIN_SECRET`), Partners use HMAC cookie sessions, Staff uses cookie sessions
- **Testing**: Vitest (unit + integration + e2e)

## Project Structure
```
app/
  admin/          # Admin dashboard (layout.tsx has nav, context.tsx has auth)
    bookings/     # Booking management
    partners/     # Partner CRUD (contracts, branches, services, portal)
    commissions/  # Commission consolidation & tracking
    staff/        # Staff CRUD
    audit/        # Audit logs
    consents/     # Consent management
    form-config/  # Dynamic form configuration
    delete/       # Patient data deletion
  api/
    admin/        # Admin APIs (Bearer auth via validateAdminAuth)
    partner/      # Partner APIs (cookie auth via getSessionPartnerId)
    partners/     # Public partner search APIs
    cron/         # Cron jobs (cleanup + contract auto-expiry)
    staff/        # Staff auth APIs
  partner/        # Partner portal (dashboard, login)
  consult/        # Patient consultation flow
  consent/        # Consent token flow
lib/
  hooks/          # SWR hooks (use-admin-*.ts, use-partner-*.ts)
  types.ts        # Shared TypeScript interfaces
  db.ts           # Prisma client singleton
  admin-auth.ts   # validateAdminAuth(request) -> boolean
  partner-auth.ts # getSessionPartnerId() -> string | null
  staff-auth.ts   # hashPassword(), verifyPassword()
  swr.ts          # fetcher (cookie) + adminFetcher (Bearer token)
  logger.ts       # createLogger(), safeErrorMessage()
components/       # Shared UI (ConfirmDialog, LoadingSpinner, etc.)
prisma/
  schema.prisma   # Database schema (all models)
```

## Key Patterns

### API Routes
- Admin routes: `validateAdminAuth(request)` returns 401 if invalid
- Partner routes: `getSessionPartnerId()` returns partnerId from cookie
- All mutations create `AuditLog` entries
- Paginated endpoints return `{ data, total, page, totalPages }`
- Error responses: `{ error: string }` with appropriate status codes

### SWR Hooks
- Located in `lib/hooks/`
- Admin hooks use `adminFetcher(secret)` from `lib/swr.ts`
- Partner hooks use `fetcher` (cookie-based) from `lib/swr.ts`
- Pattern: `useSWR(key, fetcher, { dedupingInterval, revalidateOnFocus })`

### UI Pages
- Admin pages use `useAdminAuth()` from `app/admin/context` for the secret
- Follow pattern: header + filters + table + pagination + modals
- Vietnamese labels throughout (Tạo, Lưu, Xóa, Hủy, etc.)
- Tailwind classes, rounded-xl cards, blue-600 primary color
- ConfirmDialog for destructive actions

### Database
- Schema uses `@@map("table_name")` for snake_case table names
- Use `prisma db push` (not migrate dev) — migration history has drift
- All String IDs use `@default(cuid())` except Partner which has user-defined IDs
- Dates serialized with `.toISOString()` in API responses

## Commands
```bash
npm run dev          # Dev server
npm run build        # Production build (checks types)
npm run test         # Run all tests
npm run seed-partners # Seed partners from partners.json to DB
npx prisma db push   # Push schema changes
npx prisma generate  # Regenerate Prisma client
```

## Important Notes
- All UI text is in Vietnamese
- `priceRange` on PartnerService is text ("50,000 - 100,000 VND"), not numeric
- Commission `totalRevenue` is manually entered by admin (not computed from bookings)
- Public partner routes filter by `isActive: true` AND `contractStatus: 'active'`
- Cron at `api/cron/cleanup` handles data expiry + contract auto-expiry
- Partner model has contract fields (contractStatus, contractStartDate, contractEndDate, contractNotes, commissionRate)
- CommissionStatement has workflow: draft → confirmed → paid
