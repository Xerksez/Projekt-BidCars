"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export default function AuctionsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "endsAt");
  const [order, setOrder] = useState(sp.get("order") ?? "asc");
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [limit, setLimit] = useState(sp.get("limit") ?? "10");

  // sync z adresu gdy cofamy wstecz
  useEffect(() => {
    setStatus(sp.get("status") ?? "");
    setSort(sp.get("sort") ?? "endsAt");
    setOrder(sp.get("order") ?? "asc");
    setSearch(sp.get("search") ?? "");
    setLimit(sp.get("limit") ?? "10");
  }, [sp]);

  const apply = useCallback((page?: number) => {
    const params = new URLSearchParams(sp.toString());
    status ? params.set("status", status) : params.delete("status");
    search ? params.set("search", search) : params.delete("search");
    params.set("sort", sort);
    params.set("order", order);
    params.set("limit", limit);
    params.set("page", String(page ?? 1));
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, status, sort, order, search, limit, sp]);

  return (
    <div className="w-full rounded border p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
      <select className="border rounded px-2 py-1 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>
        <option value="">Wszystkie</option>
        <option value="UPCOMING">UPCOMING</option>
        <option value="LIVE">LIVE</option>
        <option value="ENDED">ENDED</option>
      </select>

      <input
        className="border rounded px-2 py-1 text-sm flex-1"
        placeholder="Szukaj po tytule lub VIN"
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
      />

      <select className="border rounded px-2 py-1 text-sm" value={sort} onChange={(e)=>setSort(e.target.value)}>
        <option value="endsAt">Kończy się</option>
        <option value="createdAt">Dodano</option>
        <option value="currentPrice">Cena</option>
      </select>

      <select className="border rounded px-2 py-1 text-sm" value={order} onChange={(e)=>setOrder(e.target.value)}>
        <option value="asc">↑ rosnąco</option>
        <option value="desc">↓ malejąco</option>
      </select>

      <select className="border rounded px-2 py-1 text-sm" value={limit} onChange={(e)=>setLimit(e.target.value)}>
        <option value="5">5/stronę</option>
        <option value="10">10/stronę</option>
        <option value="20">20/stronę</option>
      </select>

      <button onClick={()=>apply(1)} className="rounded bg-foreground text-background px-3 py-1 text-sm">
        Filtruj
      </button>
    </div>
  );
}
