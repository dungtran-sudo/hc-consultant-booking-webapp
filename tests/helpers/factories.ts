let counter = 0;

export function resetCounter() {
  counter = 0;
}

export function makeBooking(overrides?: Record<string, unknown>) {
  counter++;
  return {
    id: `booking-${counter}`,
    bookingNumber: `HHG-TST-1234-A${counter}`,
    phoneHash: 'a'.repeat(64),
    sessionId: `session-${counter}`,
    patientNameEnc: `enc-name-${counter}`,
    phoneEnc: `enc-phone-${counter}`,
    conditionEnc: `enc-cond-${counter}`,
    notesEnc: `enc-notes-${counter}`,
    serviceName: 'Khám Nhi',
    specialty: 'nhi',
    partnerId: 'vinmec',
    partnerName: 'Vinmec',
    branchAddress: '123 Test Street',
    preferredDate: '2026-03-01',
    preferredTime: '09:00',
    encKeyId: `key-${counter}`,
    status: 'pending',
    isDeleted: false,
    createdAt: new Date('2026-02-10'),
    expiresAt: new Date('2027-02-10'),
    confirmedAt: null,
    completedAt: null,
    bookedByStaffId: null,
    bookedByStaffName: null,
    ...overrides,
  };
}

export function makeStaff(overrides?: Record<string, unknown>) {
  counter++;
  return {
    id: `staff-${counter}`,
    name: `staff${counter}`,
    email: `staff${counter}@test.com`,
    role: 'cs',
    passwordHash: 'fakesalt:fakehash',
    isActive: true,
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
    ...overrides,
  };
}

export function makeConsentToken(overrides?: Record<string, unknown>) {
  counter++;
  return {
    id: `ct-${counter}`,
    token: `token${counter}${'a'.repeat(60)}`,
    phoneHash: 'b'.repeat(64),
    partnerId: 'vinmec',
    partnerName: 'Vinmec',
    serviceName: 'Khám Nhi',
    dataDescription: 'Họ tên, SĐT, tình trạng sức khỏe',
    staffId: 'staff-1',
    staffName: 'TestStaff',
    status: 'pending',
    patientIp: null,
    patientUserAgent: null,
    deviceFingerprint: null,
    otpCode: null,
    otpSentAt: null,
    otpVerifiedAt: null,
    bookingId: null,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    createdAt: new Date('2026-02-10'),
    acceptedAt: null,
    ...overrides,
  };
}

export function makeAuditLog(overrides?: Record<string, unknown>) {
  counter++;
  return {
    id: `audit-${counter}`,
    actorType: 'admin',
    actorId: 'admin',
    action: 'test_action',
    bookingId: null,
    metadata: null,
    ip: '127.0.0.1',
    createdAt: new Date('2026-02-10'),
    ...overrides,
  };
}

export function makeEncryptionKey(overrides?: Record<string, unknown>) {
  counter++;
  return {
    id: `ek-${counter}`,
    phoneHash: 'c'.repeat(64),
    keyMaterial: 'encrypted-key-material',
    createdAt: new Date('2026-02-10'),
    isRevoked: false,
    ...overrides,
  };
}

export function makePartner(overrides?: Record<string, unknown>) {
  counter++;
  return {
    id: `partner-${counter}`,
    name: `Partner ${counter}`,
    type: 'hospital',
    website: '',
    bookingEmail: '',
    phone: '',
    city: 'TP.HCM',
    district: '',
    address: '123 Test St',
    specialties: ['nhi'],
    notes: '',
    passwordHash: null,
    isActive: true,
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
    branches: [],
    services: [],
    ...overrides,
  };
}

export function makeApiUsageLog(overrides?: Record<string, unknown>) {
  counter++;
  return {
    id: `usage-${counter}`,
    promptTokens: 2500,
    completionTokens: 3000,
    totalTokens: 5500,
    estimatedCostUsd: 0.03625,
    model: 'gpt-4o',
    specialty: 'nhi',
    sessionId: `session-${counter}`,
    durationMs: 1500,
    createdAt: new Date('2026-02-10'),
    ...overrides,
  };
}

export function makeConsent(overrides?: Record<string, unknown>) {
  counter++;
  return {
    id: `consent-${counter}`,
    phoneHash: 'a'.repeat(64),
    version: 'v1',
    consentTextHash: 'd'.repeat(64),
    ip: '127.0.0.1',
    createdAt: new Date('2026-02-10'),
    ...overrides,
  };
}
