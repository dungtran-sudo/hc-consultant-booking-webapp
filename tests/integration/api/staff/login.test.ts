import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest } from '../../../helpers/mock-request';
import { clearAllCookies } from '../../../helpers/cookie-helpers';
import { makeStaff } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/staff-auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/staff-auth')>();
  return {
    ...original,
    verifyPassword: vi.fn(),
  };
});

import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/staff-auth';
import { POST } from '@/app/api/staff/login/route';

const mockPrisma = prisma as unknown as MockPrisma;
const mockVerifyPassword = verifyPassword as ReturnType<typeof vi.fn>;

describe('POST /api/staff/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCookies();
  });

  it('returns 400 when fields are missing', async () => {
    const request = createRequest('POST', 'http://localhost:3000/api/staff/login', {
      body: { name: 'staff1' },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it('returns 401 when staff not found', async () => {
    mockPrisma.staff.findUnique.mockResolvedValueOnce(null);

    const request = createRequest('POST', 'http://localhost:3000/api/staff/login', {
      body: { name: 'nonexistent', password: 'pass123' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 401 when staff is inactive', async () => {
    const staff = makeStaff({ isActive: false });
    mockPrisma.staff.findUnique.mockResolvedValueOnce(staff);

    const request = createRequest('POST', 'http://localhost:3000/api/staff/login', {
      body: { name: staff.name, password: 'pass123' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns success on valid credentials', async () => {
    const staff = makeStaff({ name: 'teststaff', role: 'cs' });
    mockPrisma.staff.findUnique.mockResolvedValueOnce(staff);
    mockVerifyPassword.mockResolvedValueOnce(true);
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const request = createRequest('POST', 'http://localhost:3000/api/staff/login', {
      body: { name: 'teststaff', password: 'correct-password' },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.name).toBe('teststaff');
    expect(body.role).toBe('cs');

    // Verify audit log was created
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'staff',
          action: 'staff_login',
        }),
      })
    );
  });
});
