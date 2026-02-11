import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, createAdminRequest } from '../../../helpers/mock-request';

const mockReadFileSync = vi.fn();
const mockWriteFileSync = vi.fn();

vi.mock('fs', () => ({
  default: {
    readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
    writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  },
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
}));

import { GET, POST } from '@/app/api/admin/form-config/route';

describe('GET /api/admin/form-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns form config from file', async () => {
    const mockConfig = { services: ['Kham Nhi', 'Kham Noi'], partners: [] };
    mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.services).toEqual(mockConfig.services);
    expect(mockReadFileSync).toHaveBeenCalledOnce();
  });
});

describe('POST /api/admin/form-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without admin auth', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/admin/form-config', {
      body: { services: [] },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });
});
