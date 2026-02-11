import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearAllCookies, setStaffCookie } from '../../../helpers/cookie-helpers';
import { createRequest } from '../../../helpers/mock-request';

import { GET } from '@/app/api/staff/me/route';

describe('GET /api/staff/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCookies();
  });

  it('returns 401 without staff session cookie', async () => {
    const request = createRequest('GET', 'http://localhost:3000/api/staff/me');
    const response = await GET();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns staff info when authenticated', async () => {
    setStaffCookie('staff-42', 'DrNguyen', 'admin');

    const request = createRequest('GET', 'http://localhost:3000/api/staff/me');
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.staffId).toBe('staff-42');
    expect(body.name).toBe('DrNguyen');
    expect(body.role).toBe('admin');
  });
});
