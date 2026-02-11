import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';
import { makeBooking } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

const mockGetSessionPartnerId = vi.fn();

vi.mock('@/lib/partner-auth', () => ({
  getSessionPartnerId: (...args: unknown[]) => mockGetSessionPartnerId(...args),
}));

const mockDecryptBookingPII = vi.fn();

vi.mock('@/lib/crypto', () => ({
  decryptBookingPII: (...args: unknown[]) => mockDecryptBookingPII(...args),
}));

import { prisma } from '@/lib/db';
const mockPrisma = prisma as unknown as MockPrisma;

import { POST } from '@/app/api/partner/bookings/[id]/reveal/route';

function callPOST(req: Request, id = 'b1') {
  return POST(req, { params: Promise.resolve({ id }) });
}

describe('POST /api/partner/bookings/[id]/reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no auth provided', async () => {
    mockGetSessionPartnerId.mockResolvedValue(null);

    const req = createRequest('POST', 'http://localhost:3000/api/partner/bookings/b1/reveal');
    const res = await callPOST(req);

    expect(res.status).toBe(401);
  });

  it('returns PII when authorized as partner', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    const booking = makeBooking({
      id: 'b1',
      partnerId: 'vinmec',
      isDeleted: false,
      phoneHash: 'ph123',
      patientNameEnc: 'enc-name',
      phoneEnc: 'enc-phone',
      conditionEnc: 'enc-cond',
      notesEnc: 'enc-notes',
    });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockDecryptBookingPII.mockResolvedValue({
      patientName: 'Nguyen Van A',
      phone: '0901234567',
      conditionSummary: 'Dau dau',
      notes: 'Ghi chu',
    });

    const req = createRequest('POST', 'http://localhost:3000/api/partner/bookings/b1/reveal');
    const res = await callPOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patientName).toBe('Nguyen Van A');
    expect(body.phone).toBe('0901234567');
    expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
  });

  it('returns {deleted: true} for a deleted booking', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    const booking = makeBooking({ id: 'b1', partnerId: 'vinmec', isDeleted: true });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.auditLog.create.mockResolvedValue({});

    const req = createRequest('POST', 'http://localhost:3000/api/partner/bookings/b1/reveal');
    const res = await callPOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it('returns {deleted: true} when decrypt returns null', async () => {
    mockGetSessionPartnerId.mockResolvedValue('vinmec');

    const booking = makeBooking({ id: 'b1', partnerId: 'vinmec', isDeleted: false });
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockDecryptBookingPII.mockResolvedValue(null);

    const req = createRequest('POST', 'http://localhost:3000/api/partner/bookings/b1/reveal');
    const res = await callPOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});
