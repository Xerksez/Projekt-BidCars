// apps/web/src/lib/api.ts
export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "1";

function dbg(...args: any[]) {
  if (DEBUG) console.debug("[api]", ...args);
}

/** fetch z domyślnymi opcjami (credentials!) + LOGI */
export async function apiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${API}${input}`;
  dbg("→", init.method ?? "GET", url, init);

  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  dbg("←", res.status, res.statusText, url);
  return res;
}

export async function apiJson<T = unknown>(input: string, init?: RequestInit) {
  const res = await apiFetch(input, init);
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {}
    const msg =
      (body && typeof (body as any).message === "string"
        ? (body as any).message
        : res.statusText) || "API error";
    console.error("[apiJson] FAIL", input, res.status, body);
    throw new Error(msg);
  }
  const data = (await res.json()) as T;
  dbg("[apiJson] OK", input, data);
  return data;
}
