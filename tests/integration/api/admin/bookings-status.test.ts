import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';
import { makeBooking } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { PATCH } from '@/app/api/admin/bookings/[id]/status/route';

describe('PATCH /api/admin/bookings/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const req = createRequest('PATCH', 'http://localhost:3000/api/admin/bookings/b1/status', {
      body: { status: 'confirmed' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'b1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when booking not found', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const req = createAdminRequest('PATCH', 'http://localhost:3000/api/admin/bookings/nonexistent/status', {
      body: { status: 'confirmed' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Booking not found');
  });

  it('updates status successfully', async () => {
    const booking = makeBooking({ id: 'b1', status: 'pending', isDeleted: false });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'confirmed' });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const req = createAdminRequest('PATCH', 'http://localhost:3000/api/admin/bookings/b1/status', {
      body: { status: 'confirmed' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'b1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('confirmed');

    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: expect.objectContaining({ status: 'confirmed' }),
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
  });
});
