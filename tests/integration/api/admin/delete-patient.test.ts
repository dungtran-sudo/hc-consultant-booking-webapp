import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';
import { makeBooking } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

vi.mock('@/lib/crypto', () => ({
  hashPhone: vi.fn().mockReturnValue('hashed-phone-value'),
  revokeEncKey: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { POST } from '@/app/api/admin/delete-patient/route';

describe('POST /api/admin/delete-patient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/admin/delete-patient', {
      body: { phone: '0901234567' },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for missing phone', async () => {
    const req = createAdminRequest('POST', 'http://localhost:3000/api/admin/delete-patient', {
      body: {},
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Phone number is required');
  });

  it('returns deleted count when bookings found', async () => {
    const bookings = [makeBooking({ id: 'b1' }), makeBooking({ id: 'b2' })];
    mockPrisma.booking.findMany.mockResolvedValue(bookings);
    mockPrisma.booking.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.consent.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.deletionRequest.create.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});

    const req = createAdminRequest('POST', 'http://localhost:3000/api/admin/delete-patient', {
      body: { phone: '0901234567' },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.found).toBe(true);
    expect(body.deleted).toBe(2);
    expect(mockPrisma.booking.updateMany).toHaveBeenCalledOnce();
    expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
  });
});
