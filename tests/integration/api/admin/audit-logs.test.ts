import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';
import { makeAuditLog } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
import { GET } from '@/app/api/admin/audit-logs/route';

const mockPrisma = prisma as unknown as MockPrisma;

describe('GET /api/admin/audit-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/admin/audit-logs');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns audit logs', async () => {
    const log = makeAuditLog({ action: 'booking_created', actorType: 'staff', actorId: 'staff1' });
    mockPrisma.auditLog.findMany.mockResolvedValueOnce([log]);
    mockPrisma.auditLog.count.mockResolvedValueOnce(1);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/audit-logs');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].action).toBe('booking_created');
    expect(body.logs[0].actorType).toBe('staff');
    expect(body.total).toBe(1);
  });

  it('filters by action', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);
    mockPrisma.auditLog.count.mockResolvedValueOnce(0);

    const request = createAdminRequest(
      'GET',
      'http://localhost:3000/api/admin/audit-logs?action=staff_login'
    );
    await GET(request);

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: 'staff_login' }),
      })
    );
  });

  it('filters by actor type', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);
    mockPrisma.auditLog.count.mockResolvedValueOnce(0);

    const request = createAdminRequest(
      'GET',
      'http://localhost:3000/api/admin/audit-logs?actor=system'
    );
    await GET(request);

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ actorType: 'system' }),
      })
    );
  });
});
