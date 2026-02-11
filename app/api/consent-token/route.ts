import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionStaff } from '@/lib/staff-auth';
import { hashPhone } from '@/lib/crypto';
import { generateConsentToken, getConsentUrl } from '@/lib/consent-token';

export async function POST(request: Request) {
  const staff = await getSessionStaff();

  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { phone, partnerId, partnerName, serviceName } = await request.json();

    if (!phone || !partnerId || !partnerName || !serviceName) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const token = generateConsentToken();
    const phoneHash = hashPhone(phone);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const dataDescription = `Họ tên, số điện thoại, tình trạng sức khỏe, và ghi chú tư vấn sẽ được chia sẻ với ${partnerName} để hỗ trợ đặt lịch khám.`;

    const consentToken = await prisma.consentToken.create({
      data: {
        token,
        phoneHash,
        partnerId,
        partnerName,
        serviceName,
        dataDescription,
        staffId: staff.staffId,
        staffName: staff.staffName,
        expiresAt,
      },
    });

    const url = getConsentUrl(token);

    return NextResponse.json({
      tokenId: consentToken.id,
      token,
      url,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Create consent token error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
