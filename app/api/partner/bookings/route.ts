import { NextResponse } from 'next/server';
import { getSessionPartnerId, getPartnerName } from '@/lib/partner-auth';
import { readBookingsByPartner } from '@/lib/sheets';

export async function GET() {
  const partnerId = await getSessionPartnerId();

  if (!partnerId) {
    return NextResponse.json(
      { error: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }

  try {
    const bookings = await readBookingsByPartner(partnerId);
    const partnerName = getPartnerName(partnerId);
    return NextResponse.json({ bookings, partnerName });
  } catch (error) {
    console.error('Error reading bookings:', error);
    return NextResponse.json(
      { error: 'Lỗi khi đọc dữ liệu' },
      { status: 500 }
    );
  }
}
