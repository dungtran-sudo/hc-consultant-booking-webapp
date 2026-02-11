import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';
import { makeStaff } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/staff-auth', () => ({
  hashPassword: vi.fn().mockResolvedValue('new-salt:new-hash'),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { PATCH } from '@/app/api/admin/staff/[id]/route';

describe('PATCH /api/admin/staff/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const req = createRequest('PATCH', 'http://localhost:3000/api/admin/staff/s1', {
      body: { isActive: false },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 's1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('toggles isActive', async () => {
    const staff = makeStaff({ id: 's1', isActive: false });
    mockPrisma.staff.update.mockResolvedValue({ id: 's1', name: staff.name, isActive: false });

    const req = createAdminRequest('PATCH', 'http://localhost:3000/api/admin/staff/s1', {
      body: { isActive: false },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 's1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isActive).toBe(false);
    expect(mockPrisma.staff.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isActive: false },
      select: { id: true, name: true, isActive: true },
    });
  });

  it('resets password', async () => {
    mockPrisma.staff.update.mockResolvedValue({});

    const req = createAdminRequest('PATCH', 'http://localhost:3000/api/admin/staff/s1', {
      body: { newPassword: 'newpass123' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 's1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockPrisma.staff.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { passwordHash: 'new-salt:new-hash' },
    });
  });
});
