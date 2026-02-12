import { vi } from 'vitest';

function createModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
    aggregate: vi.fn(),
  };
}

export function createMockPrisma() {
  return {
    booking: createModelMock(),
    consent: createModelMock(),
    consentToken: createModelMock(),
    staff: createModelMock(),
    encryptionKey: createModelMock(),
    auditLog: createModelMock(),
    deletionRequest: createModelMock(),
    partner: createModelMock(),
    apiUsageLog: createModelMock(),
    rateLimit: createModelMock(),
    $queryRaw: vi.fn(),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
export type MockModel = ReturnType<typeof createModelMock>;
