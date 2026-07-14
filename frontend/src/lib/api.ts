'use client';

// Thin API client wrapping fetch. Attaches the JWT from localStorage and
// unwraps the `{ success, data }` envelope. Errors throw with the server message.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

const TOKEN_KEY = 'jp_access_token';

export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

interface ApiOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T = unknown>(
  path: string,
  { method = 'GET', body, auth = true, query }: ApiOptions = {},
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, json?.error?.details);
  }

  // Endpoints return either { success, data } or { success, data, meta } (paginated).
  if (json.meta !== undefined) return json as T; // paginated: caller reads .data + .meta
  return json.data as T;
}
