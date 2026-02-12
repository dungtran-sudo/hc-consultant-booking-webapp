import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encryptBookingPII } from '@/lib/crypto';
import { generateBookingNumber } from '@/lib/booking-number';
import { validateConsentHash } from '@/lib/consent';
import { sendBookingEmail } from '@/lib/mailer';
import { BookingPayload } from '@/lib/types';
import { getSessionStaff } from '@/lib/staff-auth';
import { sanitizeText } from '@/lib/sanitize';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('booking');

export async function POST(request: Request) {
  try {
    // Rate limit: 20 requests per hour per IP
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`booking:${ip}`, 20, 60 * 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl, 20);
    }

    const rawPayload = (await request.json()) as BookingPayload;
    // Sanitize text inputs
    const payload: BookingPayload = {
      ...rawPayload,
      patientName: sanitizeText(rawPayload.patientName || ''),
      conditionSummary: sanitizeText(rawPayload.conditionSummary || ''),
      notes: sanitizeText(rawPayload.notes || ''),
      serviceName: sanitizeText(rawPayload.serviceName || ''),
    };

    // Validate phone number (Vietnamese: 10 digits starting with 0)
    const phoneDigits = (payload.phone || '').replace(/[\s\-\.]/g, '');
    if (!/^0\d{9}$/.test(phoneDigits)) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ.' },
        { status: 400 }
      );
    }

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

    // If consent token provided, verify it's valid and not expired
    if (payload.consentTokenId) {
      const consentToken = await prisma.consentToken.findUnique({
        where: { id: payload.consentTokenId },
        select: { status: true, expiresAt: true },
      });

      if (!consentToken || consentToken.status !== 'accepted') {
        return NextResponse.json(
          { error: 'Consent token không hợp lệ hoặc chưa được chấp nhận.' },
          { status: 400 }
        );
      }

      if (new Date() > consentToken.expiresAt) {
        return NextResponse.json(
          { error: 'Consent token đã hết hạn. Vui lòng tạo lại.' },
          { status: 400 }
        );
      }
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
        log.warn('Failed to link consent token to booking');
      });
    }

    // Send masked email to partner
    const partner = await prisma.partner.findUnique({
      where: { id: payload.partnerId },
      select: { bookingEmail: true },
    });
    if (partner?.bookingEmail) {
      try {
        await sendBookingEmail(partner.bookingEmail, {
          bookingNumber: booking.bookingNumber,
          serviceName: payload.serviceName,
          preferredDate: payload.preferredDate,
          preferredTime: payload.preferredTime,
          branchAddress: payload.branchAddress,
          partnerName: payload.partnerName,
          partnerId: payload.partnerId,
        });
      } catch (emailError) {
        log.warn('Email send failed (non-critical)', { error: String(emailError) });
      }
    }

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
    });
  } catch (error) {
    log.error('Booking API error', error);
    return NextResponse.json(
      { error: 'Lỗi đặt lịch. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
