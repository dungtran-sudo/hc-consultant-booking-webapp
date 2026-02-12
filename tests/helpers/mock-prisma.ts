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
  const mock = {
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
    $transaction: vi.fn(),
  };
  // Default: execute interactive transaction callback with mock as tx
  mock.$transaction.mockImplementation(async (fn: unknown) => {
    if (typeof fn === 'function') return fn(mock);
    return Promise.all(fn as Promise<unknown>[]);
  });
  return mock;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
export type MockModel = ReturnType<typeof createModelMock>;
