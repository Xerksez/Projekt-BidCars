// apps/web/src/app/api/import/run/route.ts
import { NextRequest } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
  if (!ADMIN_API_KEY) {
    console.error("[proxy] Missing ADMIN_API_KEY");
    return new Response(JSON.stringify({ error: "Missing ADMIN_API_KEY" }), {
      status: 500,
    });
  }
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = `${API}/import/active-lots/run${qs ? `?${qs}` : ""}`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ADMIN_API_KEY,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    // pobierz surowy tekst i przekaż dalej 1:1 (status 200/201/4xx/5xx)
    const text = await upstream.text();

    // spróbuj zachować typ content-type (jeśli jest), inaczej json
    const ct =
      upstream.headers.get("content-type") || "application/json; charset=utf-8";
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": ct },
    });
  } catch (err) {
    console.error("[proxy] fetch upstream failed:", err);
    return new Response(JSON.stringify({ error: "Proxy fetch failed" }), {
      status: 502,
    });
  }
}
