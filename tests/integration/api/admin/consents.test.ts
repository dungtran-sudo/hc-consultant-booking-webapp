import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '../../../helpers/mock-prisma';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';
import { makeConsent, makeConsentToken } from '../../../helpers/factories';

vi.mock('@/lib/db', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '@/lib/db';
import { GET } from '@/app/api/admin/consents/route';

const mockPrisma = prisma as unknown as MockPrisma;

describe('GET /api/admin/consents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/admin/consents');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns classic consents by default', async () => {
    const consent = makeConsent();
    mockPrisma.consent.findMany.mockResolvedValueOnce([consent]);
    mockPrisma.consent.count.mockResolvedValueOnce(1);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/consents');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.consents).toHaveLength(1);
    expect(body.consents[0].version).toBe('v1');
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
  });

  it('returns token consents when type=tokens', async () => {
    const token = makeConsentToken();
    mockPrisma.consentToken.findMany.mockResolvedValueOnce([token]);
    mockPrisma.consentToken.count.mockResolvedValueOnce(1);

    const request = createAdminRequest(
      'GET',
      'http://localhost:3000/api/admin/consents?type=tokens'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tokens).toHaveLength(1);
    expect(body.tokens[0].staffName).toBe(token.staffName);
    expect(body.tokens[0].status).toBe('pending');
    expect(body.total).toBe(1);
  });

  it('supports pagination', async () => {
    mockPrisma.consent.findMany.mockResolvedValueOnce([]);
    mockPrisma.consent.count.mockResolvedValueOnce(50);

    const request = createAdminRequest(
      'GET',
      'http://localhost:3000/api/admin/consents?page=3&limit=10'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(3);
    expect(body.totalPages).toBe(5);

    // Verify skip/take was called correctly
    expect(mockPrisma.consent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });

  it('truncates IDs to 8 characters', async () => {
    const consent = makeConsent({ id: 'abcdefghij1234567890' });
    mockPrisma.consent.findMany.mockResolvedValueOnce([consent]);
    mockPrisma.consent.count.mockResolvedValueOnce(1);

    const request = createAdminRequest('GET', 'http://localhost:3000/api/admin/consents');
    const response = await GET(request);

    const body = await response.json();
    expect(body.consents[0].id).toBe('abcdefgh');
  });
});
