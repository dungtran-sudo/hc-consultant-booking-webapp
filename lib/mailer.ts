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
    subject: `[Đặt lịch mới] ${payload.serviceName} - ${payload.patientName} - ${payload.preferredDate}`,
    html: `
      <h2>Thông tin đặt lịch mới</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <tr><td><strong>Mã phiên</strong></td><td>${payload.sessionId}</td></tr>
        <tr><td><strong>Tên bệnh nhân</strong></td><td>${payload.patientName}</td></tr>
        <tr><td><strong>Số điện thoại</strong></td><td>${payload.phone}</td></tr>
        <tr><td><strong>Tóm tắt tình trạng</strong></td><td>${payload.conditionSummary}</td></tr>
        <tr><td><strong>Dịch vụ</strong></td><td>${payload.serviceName}</td></tr>
        <tr><td><strong>Đối tác</strong></td><td>${payload.partnerName}</td></tr>
        <tr><td><strong>Chi nhánh</strong></td><td>${payload.branchAddress}</td></tr>
        <tr><td><strong>Ngày mong muốn</strong></td><td>${payload.preferredDate}</td></tr>
        <tr><td><strong>Giờ mong muốn</strong></td><td>${payload.preferredTime}</td></tr>
        <tr><td><strong>Ghi chú</strong></td><td>${payload.notes || 'Không có'}</td></tr>
      </table>
    `,
  });
}
