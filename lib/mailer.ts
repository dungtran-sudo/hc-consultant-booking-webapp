import nodemailer from 'nodemailer';
import { BookingPayload } from './types';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendBookingEmail(
  partnerEmail: string,
  payload: BookingPayload
): Promise<void> {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: partnerEmail,
    subject: `[Hello Bác Sĩ - Đặt lịch mới] ${payload.serviceName} - ${payload.patientName} - ${payload.preferredDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Đặt lịch từ Hello Bác Sĩ</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e40af; font-size: 16px; margin-top: 0;">Thông tin đặt lịch mới</h2>
          <table border="0" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280; width: 160px;"><strong>Mã phiên</strong></td>
              <td>${payload.sessionId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Tên bệnh nhân</strong></td>
              <td>${payload.patientName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Số điện thoại</strong></td>
              <td>${payload.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Tóm tắt tình trạng</strong></td>
              <td>${payload.conditionSummary}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Dịch vụ</strong></td>
              <td>${payload.serviceName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Đối tác</strong></td>
              <td>${payload.partnerName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Chi nhánh</strong></td>
              <td>${payload.branchAddress}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Ngày mong muốn</strong></td>
              <td>${payload.preferredDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="color: #6b7280;"><strong>Giờ mong muốn</strong></td>
              <td>${payload.preferredTime}</td>
            </tr>
            <tr>
              <td style="color: #6b7280;"><strong>Ghi chú</strong></td>
              <td>${payload.notes || 'Không có'}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
            Email này được gửi tự động từ hệ thống Hello Bác Sĩ
          </p>
        </div>
      </div>
    `,
  });
}
