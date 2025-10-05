// apps/web/src/app/page.tsx
import Image from "next/image";
import AuctionsFilterBar from "@/components/AuctionsFilterBar";
import AuctionCard from "@/components/AuctionCard";

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

export default async function Home({
  searchParams,
}: {
  // Next 15: searchParams musi być awaitowane
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const pick = (v: unknown, def: string): string =>
    typeof v === "string" && v.length > 0 ? v : def;

  // Domyślnie: LIVE + SCHEDULED; ENDED tylko po wybraniu w URL
  const status = typeof sp.status === "string" ? sp.status : "";
  const excludeEnded = status === "ENDED" ? "0" : pick(sp.excludeEnded, "1");
  const search = pick(sp.search, "");
  const sort = pick(sp.sort, "endsAt");
  const order = pick(sp.order, "asc");
  const limit = pick(sp.limit, "15"); // ← domyślnie 15
  const page = pick(sp.page, "1");

  const usp = new URLSearchParams();
  if (search) usp.set("search", search);
  if (status === "ENDED") {
    usp.set("status", "ENDED");
  } else {
    usp.set("excludeEnded", excludeEnded);
  }
  usp.set("sort", sort);
  usp.set("order", order);
  usp.set("limit", limit);
  usp.set("page", page);

  let data: {
    items: any[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null = null;
  let loadError: string | null = null;

  try {
    data = await getAuctions(usp.toString());
  } catch (e: any) {
    loadError = e?.message ?? "Nieznany błąd API";
  }

  const items = data?.items ?? [];
  const pageNum = Number(data?.page ?? 1);
  const pages = Number(data?.pages ?? 1);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 w-full bg-neutral-950 text-neutral-100">
      <main className="flex flex-col gap-6 row-start-2 items-center sm:items-start w-full max-w-3xl">
        <Image
          className="opacity-90"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <h2 className="text-2xl font-semibold text-neutral-100">Aukcje</h2>

        <AuctionsFilterBar />

        {loadError && (
          <div className="w-full rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
            <div className="font-semibold mb-1">
              Nie udało się pobrać listy aukcji
            </div>
            <div className="break-all">{loadError}</div>
          </div>
        )}

        {!loadError && (
          <div className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-300">Brak wyników.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((a: any, i: number) => (
                  <AuctionCard key={a?.id ?? i} a={a} />
                ))}
              </ul>
            )}
          </div>
        )}

        {!loadError && <Pagination page={pageNum} pages={pages} />}
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-neutral-300">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
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

  const qs = (p: number) => {
    const usp = new URLSearchParams(
      typeof window === "undefined" ? "" : window.location.search
    );
    usp.set("page", String(p));
    return `?${usp.toString()}`;
  };

  return (
    <div className="flex gap-2 items-center">
      <a
        href={qs(prev)}
        className="px-3 py-1 border border-neutral-700 rounded text-sm bg-neutral-900 hover:bg-neutral-800"
      >
        ← Poprzednia
      </a>
      <span className="text-sm text-neutral-300">
        {page} / {pages}
      </span>
      <a
        href={qs(next)}
        className="px-3 py-1 border border-neutral-700 rounded text-sm bg-neutral-900 hover:bg-neutral-800"
      >
        Następna →
      </a>
    </div>
  );
}
