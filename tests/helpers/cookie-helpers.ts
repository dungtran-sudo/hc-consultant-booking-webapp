import { createSessionToken } from '@/lib/partner-auth';
import { createStaffSessionToken } from '@/lib/staff-auth';

function getCookieStore(): Map<string, { name: string; value: string }> {
  return (globalThis as Record<string, unknown>).__cookieStore as Map<string, { name: string; value: string }>;
}

export function setPartnerCookie(partnerId: string) {
  const token = createSessionToken(partnerId);
  getCookieStore().set('partner_session', { name: 'partner_session', value: token });
}

export function setStaffCookie(staffId: string, name: string, role: string) {
  const token = createStaffSessionToken(staffId, name, role);
  getCookieStore().set('staff_session', { name: 'staff_session', value: token });
}

export function clearAllCookies() {
  getCookieStore().clear();
}
