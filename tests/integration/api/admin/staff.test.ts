import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';
import { makeStaff } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/staff-auth', () => ({
  hashPassword: vi.fn().mockResolvedValue('mocked-salt:mocked-hash'),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { GET, POST } from '@/app/api/admin/staff/route';

describe('GET /api/admin/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/admin/staff');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns staff list', async () => {
    const staff = makeStaff();
    mockPrisma.staff.findMany.mockResolvedValue([staff]);

    const req = createAdminRequest('GET', 'http://localhost:3000/api/admin/staff');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.staff).toHaveLength(1);
    expect(body.staff[0].name).toBe(staff.name);
    expect(body.staff[0].createdAt).toBe(staff.createdAt.toISOString());
  });
});

describe('POST /api/admin/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/admin/staff', {
      body: { name: 'test', password: '123456', role: 'cs' },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('creates staff successfully', async () => {
    const created = makeStaff({ name: 'newstaff', role: 'cs', email: null });
    mockPrisma.staff.findUnique.mockResolvedValue(null);
    mockPrisma.staff.create.mockResolvedValue(created);

    const req = createAdminRequest('POST', 'http://localhost:3000/api/admin/staff', {
      body: { name: 'newstaff', password: 'secret123', role: 'cs' },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('newstaff');
    expect(mockPrisma.staff.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'newstaff',
          role: 'cs',
          passwordHash: 'mocked-salt:mocked-hash',
        }),
      })
    );
  });

  it('returns 400 for missing required fields', async () => {
    const req = createAdminRequest('POST', 'http://localhost:3000/api/admin/staff', {
      body: { name: 'onlyname' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
