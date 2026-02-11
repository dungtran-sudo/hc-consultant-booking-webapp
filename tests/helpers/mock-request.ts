export function createRequest(
  method: string,
  url: string,
  options?: {
    body?: unknown;
    headers?: Record<string, string>;
  }
): Request {
  const headers = new Headers(options?.headers || {});

  const init: RequestInit = { method, headers };
  if (options?.body && method !== 'GET') {
    init.body = JSON.stringify(options.body);
    headers.set('Content-Type', 'application/json');
  }

  return new Request(url, init);
}

export function createAdminRequest(
  method: string,
  url: string,
  options?: { body?: unknown; headers?: Record<string, string> }
): Request {
  return createRequest(method, url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${process.env.ADMIN_SECRET}`,
    },
  });
}

export function createCronRequest(url: string): Request {
  return createRequest('GET', url, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
}
