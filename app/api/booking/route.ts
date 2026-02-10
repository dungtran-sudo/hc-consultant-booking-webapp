import { NextResponse } from 'next/server';
import { appendBookingRow } from '@/lib/sheets';
import { sendBookingEmail } from '@/lib/mailer';
import { BookingPayload } from '@/lib/types';
import partnersData from '@/data/partners.json';
import { Partner } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as BookingPayload;

    // Write to Google Sheet
    try {
      await appendBookingRow(payload);
    } catch (sheetError: unknown) {
      const msg = sheetError instanceof Error ? sheetError.message : String(sheetError);
      console.error('Google Sheets error:', msg, sheetError);
      return NextResponse.json(
        { error: `Lỗi khi lưu thông tin đặt lịch: ${msg}` },
        { status: 500 }
      );
    }

    // Send email to partner
    const partner = (partnersData as Partner[]).find(
      (p) => p.id === payload.partnerId
    );
    if (partner?.booking_email) {
      try {
        await sendBookingEmail(partner.booking_email, payload);
      } catch (emailError) {
        console.warn('Email send failed (non-critical):', emailError);
      }
    } else {
      console.warn(
        `No booking email for partner ${payload.partnerId}, skipping email.`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
