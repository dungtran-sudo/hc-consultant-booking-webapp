import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface MaskedBookingEmail {
  bookingNumber: string;
  serviceName: string;
  preferredDate: string;
  preferredTime: string;
  branchAddress: string;
  partnerName: string;
}

export async function sendBookingEmail(
  partnerEmail: string,
  data: MaskedBookingEmail
): Promise<void> {
  const portalUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: partnerEmail,
    subject: `[Hello Bác Sĩ] Đặt lịch mới #${data.bookingNumber} - ${data.serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Đặt lịch mới từ Hello Bác Sĩ</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <table border="0" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280; width: 160px;"><strong>Mã đặt lịch</strong></td>
              <td><strong>${data.bookingNumber}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Dịch vụ</strong></td>
              <td>${data.serviceName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Chi nhánh</strong></td>
              <td>${data.branchAddress}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Ngày mong muốn</strong></td>
              <td>${data.preferredDate?.split('-').reverse().join('/')}</td>
            </tr>
            <tr>
              <td style="color: #6b7280;"><strong>Giờ mong muốn</strong></td>
              <td>${data.preferredTime}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="${portalUrl}/partner/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Xem chi tiết trên Portal
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
            Vui lòng đăng nhập Portal Đối Tác để xem thông tin bệnh nhân.<br />
            Email này được gửi tự động từ hệ thống Hello Bác Sĩ.
          </p>
        </div>
      </div>
    `,
  });
}
