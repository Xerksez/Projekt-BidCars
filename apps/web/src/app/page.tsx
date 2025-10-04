// apps/web/src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import AuctionsFilterBar from "@/components/AuctionsFilterBar";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getAuctions(search: string) {
  const url = new URL("/auctions", API);
  url.search = search;
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Home({
  searchParams,
}: {
  // 👇 Next 15: searchParams to Promise — trzeba await
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  // zbuduj query z obsługą string i string[]
  const query = new URLSearchParams();
  if (sp) {
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") query.set(k, v);
      else if (Array.isArray(v)) v.forEach((val) => query.append(k, val));
    }
  }
  // domyślne parametry
  if (!query.has("page")) query.set("page", "1");
  if (!query.has("limit")) query.set("limit", "10");
  if (!query.has("sort")) query.set("sort", "endsAt");
  if (!query.has("order")) query.set("order", "asc");

  const data = await getAuctions(query.toString());
  const items = data.items ?? [];
  const page = Number(data.page ?? 1);
  const pages = Number(data.pages ?? 1);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 w-full">
      <main className="flex flex-col gap-6 row-start-2 items-center sm:items-start w-full max-w-3xl">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h2 className="text-xl font-semibold">Aukcje</h2>

        <AuctionsFilterBar />

        <div className="w-full rounded border p-4">
          {items.length === 0 ? (
            <p className="text-sm opacity-70">Brak wyników.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((a: any) => (
                <li key={a.id} className="border rounded p-3">
                  <div className="font-medium">
                    <Link
                      className="underline underline-offset-4"
                      href={`/auction/${a.id}`}
                    >
                      {a.title}
                    </Link>
                  </div>
                  <div className="text-xs opacity-70">VIN: {a.vin ?? "—"}</div>
                  <div className="text-xs opacity-70">
                    {new Date(a.startsAt).toLocaleString()} →{" "}
                    {new Date(a.endsAt).toLocaleString()}
                  </div>
                  <div className="text-sm mt-1">
                    Cena bieżąca: ${a.currentPrice}
                  </div>
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border
              ${
                a.status === "LIVE"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : a.status === "SCHEDULED"
                    ? "bg-amber-100 text-amber-700 border-amber-300"
                    : "bg-gray-200 text-gray-700 border-gray-300"
              }`}
                  >
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Paginacja */}
        <Pagination page={page} pages={pages} sp={sp} />
      </main>
    </div>
  );
}

function Pagination({
  page,
  pages,
  sp,
}: {
  page: number;
  pages: number;
  sp: Record<string, string | string[] | undefined>;
}) {
  if (pages <= 1) return null;

  // bazowy zestaw parametrów (bez użycia window — działa w RSC)
  const base = new URLSearchParams();
  for (const [k, v] of Object.entries(sp ?? {})) {
    if (typeof v === "string") base.set(k, v);
    else if (Array.isArray(v)) v.forEach((val) => base.append(k, val));
  }

  const linkFor = (p: number) => {
    const q = new URLSearchParams(base);
    q.set("page", String(p));
    return `/?${q.toString()}`;
  };

  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);

  return (
    <div className="flex gap-2 items-center">
      <Link href={linkFor(prev)} className="px-3 py-1 border rounded text-sm">
        ← Poprzednia
      </Link>
      <span className="text-sm opacity-70">
        {page} / {pages}
      </span>
      <Link href={linkFor(next)} className="px-3 py-1 border rounded text-sm">
        Następna →
      </Link>
    </div>
  );
}
