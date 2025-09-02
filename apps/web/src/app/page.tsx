import Image from "next/image";
import Link from "next/link";
import AuctionsFilterBar from "@/components/AuctionsFilterBar";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getAuctions(query: string) {
  const res = await fetch(`${API}/auctions?${query}`, { cache: "no-store" });
  return res.json();
}

export default async function Home({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const query = new URLSearchParams();
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (typeof v === "string") query.set(k, v);
    }
  }
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
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />
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
                    <Link className="underline underline-offset-4" href={`/auction/${a.id}`}>
                      {a.title}
                    </Link>
                  </div>
                  <div className="text-xs opacity-70">VIN: {a.vin ?? "—"}</div>
                  <div className="text-xs opacity-70">
                    {new Date(a.startsAt).toLocaleString()} → {new Date(a.endsAt).toLocaleString()}
                  </div>
                  <div className="text-sm mt-1">Cena bieżąca: ${a.currentPrice}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Paginacja */}
        <Pagination page={page} pages={pages} />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a className="flex items-center gap-2 hover:underline hover:underline-offset-4" href="https://nextjs.org/learn" target="_blank" rel="noopener noreferrer">
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
      </footer>
    </div>
  );
}

function Pagination({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);

  // Generujemy linki z zachowaniem istniejących parametrów
  const qs = (p: number) => {
    const usp = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
    usp.set("page", String(p));
    return `?${usp.toString()}`;
  };

  return (
    <div className="flex gap-2 items-center">
      <a href={qs(prev)} className="px-3 py-1 border rounded text-sm">← Poprzednia</a>
      <span className="text-sm opacity-70">{page} / {pages}</span>
      <a href={qs(next)} className="px-3 py-1 border rounded text-sm">Następna →</a>
    </div>
  );
}
