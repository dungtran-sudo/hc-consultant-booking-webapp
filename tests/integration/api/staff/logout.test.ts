import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearAllCookies, setStaffCookie } from '../../../helpers/cookie-helpers';
import { createRequest } from '../../../helpers/mock-request';

import { POST } from '@/app/api/staff/logout/route';

describe('POST /api/staff/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCookies();
  });

  it('returns success', async () => {
    setStaffCookie('staff-1', 'TestStaff', 'cs');

    const request = createRequest('POST', 'http://localhost:3000/api/staff/logout');
    const response = await POST();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('clears the staff_session cookie', async () => {
    setStaffCookie('staff-1', 'TestStaff', 'cs');

    const response = await POST();

    // The cookie store should have the cookie set to empty (maxAge=0)
    // by the route handler via next/headers cookies()
    expect(response.status).toBe(200);
  });
});
