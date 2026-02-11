import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest } from '../../../helpers/mock-request';

import { GET } from '@/app/api/partner/list/route';

describe('GET /api/partner/list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not require authentication', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/partner/list');
    const response = await GET();

    expect(response.status).toBe(200);
  });

  it('returns partners with id and name fields', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/partner/list');
    const response = await GET();

    const body = await response.json();
    expect(body.partners).toBeDefined();
    expect(Array.isArray(body.partners)).toBe(true);
    expect(body.partners.length).toBeGreaterThan(0);

    for (const partner of body.partners) {
      expect(partner).toHaveProperty('id');
      expect(partner).toHaveProperty('name');
      expect(typeof partner.id).toBe('string');
      expect(typeof partner.name).toBe('string');
    }
  });
});
