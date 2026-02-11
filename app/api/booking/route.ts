import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encryptBookingPII } from '@/lib/crypto';
import { generateBookingNumber } from '@/lib/booking-number';
import { validateConsentHash } from '@/lib/consent';
import { sendBookingEmail } from '@/lib/mailer';
import { BookingPayload } from '@/lib/types';
import { getSessionStaff } from '@/lib/staff-auth';
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

    // Check staff session
    const staff = await getSessionStaff();

    // Generate custom booking number
    const bookingNumber = await generateBookingNumber(payload.partnerName, payload.phone);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
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
        status: 'pending',
        expiresAt,
        bookedByStaffId: staff?.staffId || null,
        bookedByStaffName: staff?.staffName || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorType: staff ? 'staff' : 'system',
        actorId: staff ? staff.staffName : 'booking-api',
        action: 'consent_given',
        bookingId: booking.id,
        metadata: JSON.stringify({
          consentVersion: payload.consentVersion,
          partnerId: payload.partnerId,
        }),
        ip,
      },
    });

    // Link consent token to booking if provided
    if (payload.consentTokenId) {
      await prisma.consentToken.update({
        where: { id: payload.consentTokenId },
        data: { bookingId: booking.id },
      }).catch(() => {
        // Non-critical: log but don't fail the booking
        console.warn('Failed to link consent token to booking');
      });
    }

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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Booking API error:', msg, error);
    return NextResponse.json(
      { error: `Lỗi đặt lịch: ${msg}` },
      { status: 500 }
    );
  }
}
