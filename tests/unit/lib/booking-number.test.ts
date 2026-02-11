import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrisma, MockPrisma } from '@/tests/helpers/mock-prisma';

let mockPrisma: MockPrisma;

vi.mock('@/lib/db', () => ({
  get prisma() {
    return mockPrisma;
  },
}));

// Import after mock setup so the module picks up the mock
import { generateBookingNumber } from '@/lib/booking-number';

describe('generateBookingNumber', () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockPrisma.booking.findMany.mockResolvedValue([]);
  });

  it('returns HHG-XXX-NNNN-SS format', async () => {
    const result = await generateBookingNumber('Vinmec', '0901234567');
    // Format: HHG-{3 alpha}-{4 digits}-{suffix}
    expect(result).toMatch(/^HHG-[A-Z]{3}-\d{4}-[A-Z][1-9]$/);
  });

  it('strips Vietnamese diacritics from partner name', async () => {
    const result = await generateBookingNumber('Phương Châu', '0901234567');
    // "Phương Châu" -> strip diacritics -> "Phuong Chau" -> remove non-alpha -> "PhuongChau" -> uppercase -> "PHUONGCHAU" -> first 3 -> "PHU"
    expect(result).toMatch(/^HHG-PHU-/);
  });

  it('pads short partner names with X', async () => {
    const result = await generateBookingNumber('AB', '0901234567');
    // "AB" -> uppercase -> "AB" -> padEnd(3, 'X') -> "ABX"
    expect(result).toMatch(/^HHG-ABX-/);
  });

  it('uses last 4 digits of phone', async () => {
    const result = await generateBookingNumber('Vinmec', '0901234567');
    expect(result).toContain('-4567-');
  });

  it('first booking gets suffix A1', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);
    const result = await generateBookingNumber('Vinmec', '0901234567');
    expect(result).toMatch(/-A1$/);
  });

  it('skips existing numbers', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      { bookingNumber: 'HHG-VIN-4567-A1' },
    ]);
    const result = await generateBookingNumber('Vinmec', '0901234567');
    // A1 is taken, so it should be A2
    expect(result).toMatch(/-A2$/);
  });
});
