"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export default function AuctionsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "endsAt");
  const [order, setOrder] = useState(sp.get("order") ?? "asc");
  const [limit, setLimit] = useState(sp.get("limit") ?? "10");
  const [showEnded, setShowEnded] = useState(sp.get("showEnded") === "true");

  useEffect(() => {
    setSearch(sp.get("search") ?? "");
    setSort(sp.get("sort") ?? "endsAt");
    setOrder(sp.get("order") ?? "asc");
    setLimit(sp.get("limit") ?? "10");
    setShowEnded(sp.get("showEnded") === "true");
  }, [sp]);

  const apply = useCallback(
    (page?: number) => {
      const params = new URLSearchParams(sp.toString());
      search ? params.set("search", search) : params.delete("search");
      params.set("sort", sort);
      params.set("order", order);
      params.set("limit", limit);
      params.set("page", String(page ?? 1));

      if (showEnded) params.set("showEnded", "true");
      else params.delete("showEnded");

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, search, sort, order, limit, showEnded, sp]
  );

  return (
    <div className="w-full rounded border p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
      <input
        className="border rounded px-2 py-1 text-sm flex-1"
        placeholder="Szukaj po tytule lub VIN"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showEnded}
          onChange={(e) => setShowEnded(e.target.checked)}
        />
        Pokaż zakończone
      </label>

      <select
        className="border rounded px-2 py-1 text-sm"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="endsAt">Kończy się</option>
        <option value="createdAt">Dodano</option>
        <option value="currentPrice">Cena</option>
      </select>

      <select
        className="border rounded px-2 py-1 text-sm"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
      >
        <option value="asc">↑ rosnąco</option>
        <option value="desc">↓ malejąco</option>
      </select>

      <select
        className="border rounded px-2 py-1 text-sm"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
      >
        <option value="5">5/stronę</option>
        <option value="10">10/stronę</option>
        <option value="20">20/stronę</option>
      </select>

      <button
        onClick={() => apply(1)}
        className="rounded bg-foreground text-background px-3 py-1 text-sm"
      >
        Filtruj
      </button>
    </div>
  );
}
