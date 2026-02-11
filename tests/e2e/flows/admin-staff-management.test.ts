import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../helpers/mock-prisma';
import { createAdminRequest } from '../../helpers/mock-request';
import { makeStaff } from '../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/staff-auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/staff-auth')>();
  return {
    ...original,
    hashPassword: vi.fn().mockResolvedValue('newsalt:newhash'),
  };
});

import { prisma } from '@/lib/db';

const mockPrisma = prisma as unknown as MockPrisma;

describe('Admin Staff Management Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('admin creates staff', async () => {
    const { POST } = await import('@/app/api/admin/staff/route');

    // No duplicate found
    mockPrisma.staff.findUnique.mockResolvedValueOnce(null);

    const createdStaff = makeStaff({
      id: 'staff-new-1',
      name: 'newcsstaff',
      email: 'newcs@test.com',
      role: 'cs',
      isActive: true,
    });
    mockPrisma.staff.create.mockResolvedValueOnce(createdStaff);

    const request = createAdminRequest('POST', 'http://localhost:3000/api/admin/staff', {
      body: {
        name: 'newcsstaff',
        password: 'securepass123',
        role: 'cs',
        email: 'newcs@test.com',
      },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.name).toBe('newcsstaff');
    expect(body.role).toBe('cs');
    expect(body.isActive).toBe(true);
    expect(mockPrisma.staff.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'newcsstaff' },
      })
    );
    expect(mockPrisma.staff.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'newcsstaff',
          role: 'cs',
          passwordHash: 'newsalt:newhash',
        }),
      })
    );
  });

  it('admin lists staff', async () => {
    const { GET } = await import('@/app/api/admin/staff/route');

    const staffList = [
      makeStaff({ name: 'cs1', role: 'cs' }),
      makeStaff({ name: 'doctor1', role: 'doctor' }),
      makeStaff({ name: 'admin1', role: 'admin' }),
    ];
    mockPrisma.staff.findMany.mockResolvedValueOnce(staffList);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/staff');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.staff).toHaveLength(3);
    expect(body.staff[0].name).toBe('cs1');
    expect(body.staff[1].name).toBe('doctor1');
    expect(body.staff[2].name).toBe('admin1');
    // Verify createdAt is serialized as ISO string
    expect(typeof body.staff[0].createdAt).toBe('string');
  });

  it('admin deactivates staff', async () => {
    const { PATCH } = await import('@/app/api/admin/staff/[id]/route');

    const deactivatedStaff = makeStaff({ id: 'staff-deact-1', name: 'csold', isActive: false });
    mockPrisma.staff.update.mockResolvedValueOnce({
      id: deactivatedStaff.id,
      name: deactivatedStaff.name,
      isActive: false,
    });

    const request = createAdminRequest(
      'PATCH',
      'http://localhost:3000/api/admin/staff/staff-deact-1',
      { body: { isActive: false } }
    );
    const response = await PATCH(request, { params: Promise.resolve({ id: 'staff-deact-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isActive).toBe(false);
    expect(body.id).toBe('staff-deact-1');
    expect(mockPrisma.staff.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'staff-deact-1' },
        data: { isActive: false },
      })
    );
  });

  it('admin resets staff password', async () => {
    const { PATCH } = await import('@/app/api/admin/staff/[id]/route');

    mockPrisma.staff.update.mockResolvedValueOnce({});

    const request = createAdminRequest(
      'PATCH',
      'http://localhost:3000/api/admin/staff/staff-pw-1',
      { body: { newPassword: 'new-secure-pass-123' } }
    );
    const response = await PATCH(request, { params: Promise.resolve({ id: 'staff-pw-1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockPrisma.staff.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'staff-pw-1' },
        data: { passwordHash: 'newsalt:newhash' },
      })
    );
  });
});
