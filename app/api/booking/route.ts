import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encryptBookingPII, hashPhone } from '@/lib/crypto';
import { validateConsentHash } from '@/lib/consent';
import { sendBookingEmail } from '@/lib/mailer';
import { BookingPayload } from '@/lib/types';
import partnersData from '@/data/partners.json';
import { Partner } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as BookingPayload;
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    // Validate consent
    if (
      !payload.consentVersion ||
      !payload.consentTextHash ||
      !validateConsentHash(payload.consentVersion, payload.consentTextHash)
    ) {
      return NextResponse.json(
        { error: 'Consent không hợp lệ. Vui lòng thử lại.' },
        { status: 400 }
      );
    }

    // Encrypt PII
    const encrypted = await encryptBookingPII(payload.phone, {
      patientName: payload.patientName,
      phone: payload.phone,
      conditionSummary: payload.conditionSummary,
      notes: payload.notes,
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 12);

    // Record consent
    await prisma.consent.create({
      data: {
        phoneHash: encrypted.phoneHash,
        version: payload.consentVersion,
        consentTextHash: payload.consentTextHash,
        ip,
      },
    });

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        phoneHash: encrypted.phoneHash,
        sessionId: payload.sessionId,
        patientNameEnc: encrypted.patientNameEnc,
        phoneEnc: encrypted.phoneEnc,
        conditionEnc: encrypted.conditionEnc,
        notesEnc: encrypted.notesEnc,
        serviceName: payload.serviceName,
        specialty: payload.serviceId || '',
        partnerId: payload.partnerId,
        partnerName: payload.partnerName,
        branchAddress: payload.branchAddress,
        preferredDate: payload.preferredDate,
        preferredTime: payload.preferredTime,
        encKeyId: encrypted.encKeyId,
        expiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorType: 'system',
        actorId: 'booking-api',
        action: 'consent_given',
        bookingId: booking.id,
        metadata: JSON.stringify({
          consentVersion: payload.consentVersion,
          partnerId: payload.partnerId,
        }),
        ip,
      },
    });

    // Send masked email to partner
    const partner = (partnersData as Partner[]).find(
      (p) => p.id === payload.partnerId
    );
    if (partner?.booking_email) {
      try {
        await sendBookingEmail(partner.booking_email, {
          bookingNumber: booking.bookingNumber,
          serviceName: payload.serviceName,
          preferredDate: payload.preferredDate,
          preferredTime: payload.preferredTime,
          branchAddress: payload.branchAddress,
          partnerName: payload.partnerName,
        });
      } catch (emailError) {
        console.warn('Email send failed (non-critical):', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
    });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
