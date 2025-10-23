// apps/web/src/lib/api-server.ts
import { headers } from "next/headers";

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * SSR fetch, który automatycznie przenosi nagłówek Cookie
 * z requestu do backendu. Bez cache'u (no-store).
 */
export async function apiFetchServer(path: string, init?: RequestInit) {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

export type Me = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
};

export async function getMeSSR(): Promise<Me | null> {
  const res = await apiFetchServer("/auth/me");
  if (!res.ok) return null;
  return (await res.json()) as Me;
}
