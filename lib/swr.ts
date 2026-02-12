/** Default fetcher for cookie-authenticated endpoints */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Lỗi khi tải dữ liệu') as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/** Fetcher factory for Bearer-token-authenticated endpoints (admin) */
export function adminFetcher(secret: string) {
  return async <T = unknown>(url: string): Promise<T> => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      const error = new Error('Lỗi khi tải dữ liệu') as Error & { status: number };
      error.status = res.status;
      throw error;
    }
    return res.json();
  };
}
