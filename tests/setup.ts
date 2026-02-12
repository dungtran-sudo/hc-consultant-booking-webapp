import { vi } from 'vitest';

// Set required environment variables for all tests
process.env.PII_ENCRYPTION_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
process.env.PARTNER_SESSION_SECRET = 'test-partner-secret-key';
process.env.STAFF_SESSION_SECRET = 'test-staff-secret-key';
process.env.ADMIN_SECRET = 'test-admin-secret';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.OPENAI_API_KEY = 'sk-test-fake-key';
process.env.GMAIL_USER = 'test@example.com';
process.env.GMAIL_APP_PASSWORD = 'test-password';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.LLM_MONTHLY_BUDGET_USD = '200';

// Global mock: next/headers cookies()
const cookieStore = new Map<string, { name: string; value: string }>();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string, _options?: Record<string, unknown>) => {
      cookieStore.set(name, { name, value });
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
    _store: cookieStore,
  })),
}));

// Expose for test helpers
(globalThis as Record<string, unknown>).__cookieStore = cookieStore;
