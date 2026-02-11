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
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
export type MockModel = ReturnType<typeof createModelMock>;
