import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSendMail = vi.hoisted(() => vi.fn().mockResolvedValue({ messageId: 'test' }));

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: mockSendMail }) },
}));

// Import after mock so the module-level createTransport call uses our mock
import { sendBookingEmail } from '@/lib/mailer';

describe('sendBookingEmail', () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  const sampleData = {
    bookingNumber: 'HHG-VIN-1234-A1',
    serviceName: 'Khám Nhi',
    preferredDate: '2026-03-01',
    preferredTime: '09:00',
    branchAddress: '123 Test Street',
    partnerName: 'Vinmec',
    partnerId: 'vinmec',
  };

  it('calls sendMail with correct recipient', async () => {
    await sendBookingEmail('partner@example.com', sampleData);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'partner@example.com',
      })
    );
  });

  it('subject contains booking number', async () => {
    await sendBookingEmail('partner@example.com', sampleData);
    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.subject).toContain('HHG-VIN-1234-A1');
  });
});
