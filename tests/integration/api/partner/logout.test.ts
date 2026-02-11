import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest } from '../../../helpers/mock-request';

import { POST } from '@/app/api/partner/logout/route';

describe('POST /api/partner/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success', async () => {
    const request = createRequest('POST', 'http://localhost:3000/api/partner/logout');
    const response = await POST();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('clears partner_session cookie by setting maxAge=0', async () => {
    const request = createRequest('POST', 'http://localhost:3000/api/partner/logout');
    const response = await POST();

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('partner_session=');
    expect(setCookie).toContain('Max-Age=0');
  });
});
