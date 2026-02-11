import { NextResponse } from 'next/server';
import { loadPartners } from '@/lib/partners';
import { getPortalPartnerIds } from '@/lib/partner-auth';

export async function GET() {
  const partners = loadPartners();
  const portalIds = getPortalPartnerIds();
  const portalPartners = partners
    .filter((p) => portalIds.includes(p.id))
    .map((p) => ({ id: p.id, name: p.name }));
  return NextResponse.json({ partners: portalPartners });
}
