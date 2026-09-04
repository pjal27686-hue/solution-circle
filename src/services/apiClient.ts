/**
 * Single entry point for all data access.
 *
 * When VITE_API_BASE_URL is set, requests go to the Cloudflare Worker backend
 * in `backend/` (same REST contract). Otherwise the in-memory mock adapter in
 * `services/mockAdapter.ts` answers, so the demo runs with seeded data.
 */
import { handleMockRequest } from "./mockAdapter";

const BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

export const usingMockBackend = BASE_URL === "";

export interface ApiError extends Error {
  status: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: { total?: number; source: "mock" | "worker" };
}

export type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function api<T>(
  path: string,
  options: { method?: Method; body?: unknown; token?: string } = {},
): Promise<T> {
  const method = options.method ?? "GET";

  if (!BASE_URL) {
    const result = await handleMockRequest<T>(method, path, options.body);
    return result;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const payload = (await response.json().catch(() => null)) as
    | (ApiEnvelope<T> & { error?: string })
    | null;

  if (!response.ok) {
    const error = new Error(payload?.error ?? `Request failed (${response.status})`) as ApiError;
    error.status = response.status;
    throw error;
  }
  return (payload?.data ?? (payload as unknown)) as T;
}
