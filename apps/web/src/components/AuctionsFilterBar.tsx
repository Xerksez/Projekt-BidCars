"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Mode = "active" | "archive";

export default function AuctionsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // ====== stan z URL ======
  const initialMode: Mode = useMemo(
    () => (sp.get("status") === "ENDED" ? "archive" : "active"),
    [sp]
  );

  const [mode, setMode] = useState<Mode>(initialMode);
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "endsAt");
  const [order, setOrder] = useState(sp.get("order") ?? "asc");
  const [limit, setLimit] = useState(sp.get("limit") ?? "15");
  const [open, setOpen] = useState(false);

  // sync podczas nawigacji „wstecz”
  useEffect(() => {
    setMode(sp.get("status") === "ENDED" ? "archive" : "active");
    setSearch(sp.get("search") ?? "");
    setSort(sp.get("sort") ?? "endsAt");
    setOrder(sp.get("order") ?? "asc");
    setLimit(sp.get("limit") ?? "15");
  }, [sp]);

  // build params na bazie bieżącego stanu + dowolnych override
  const buildParams = useCallback(
    (overrides?: Partial<Record<string, string>>) => {
      const params = new URLSearchParams(sp.toString());

      const nextMode = (overrides?.mode as Mode) ?? mode;
      const q = overrides?.search ?? search;
      const so = overrides?.sort ?? sort;
      const or = overrides?.order ?? order;
      const li = overrides?.limit ?? limit;

      // tryb: aktywne = LIVE+SCHEDULED, archiwum = ENDED
      if (nextMode === "archive") {
        params.set("status", "ENDED");
        params.delete("excludeEnded");
      } else {
        params.delete("status");
        params.set("excludeEnded", "1");
      }

      if (q) params.set("search", q);
      else params.delete("search");

      params.set("sort", so || "endsAt");
      params.set("order", or || "asc");
      params.set("limit", li || "15");
      params.set("page", "1"); // każda zmiana = wracamy na 1

      return params;
    },
    [sp, mode, search, sort, order, limit]
  );

  const apply = useCallback(
    (overrides?: Partial<Record<string, string>>) => {
      const params = buildParams(overrides);
      router.push(`${pathname}?${params.toString()}`);
    },
    [buildParams, pathname, router]
  );

  // ENTER w polu szukania
  const onSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        apply(); // bieżące wartości stanu
      }
    },
    [apply]
  );

  // Toggle Aktualne/Archiwum — ten sam wygląd, ale teraz od razu odświeża listę
  const onToggleMode = useCallback(() => {
    const nextMode: Mode = mode === "active" ? "archive" : "active";
    setMode(nextMode);
    apply({ mode: nextMode }); // ⟵ kluczowa zmiana: push od razu
  }, [mode, apply]);

  return (
    <div className="w-full">
      {/* Pasek: przełącznik trybu + input + ikona filtrów */}
      <div className="flex items-stretch gap-2">
        {/* Przełącznik Aktualne/Archiwum (WYGLĄD BEZ ZMIAN) */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleMode}
            className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm hover:bg-zinc-800"
            title={
              mode === "active"
                ? "Pokaż archiwum (ENDED)"
                : "Pokaż aktualne (LIVE+SCHEDULED)"
            }
          >
            {mode === "active" ? "Aktualne" : "Archiwum"}
          </button>
        </div>

        {/* Input wyszukiwania — Enter = filtruj */}
        <div className="relative flex-1">
          <input
            className="w-full border border-zinc-700 rounded-xl px-4 py-2 pr-10 text-sm bg-zinc-900 text-zinc-100 placeholder:text-zinc-400"
            placeholder="Wyszukaj po marce, modelu, numerze oferty lub VIN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            🔎
          </span>
        </div>

        {/* Przycisk otwierający panel filtrów (WYGLĄD BEZ ZMIAN) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm hover:bg-zinc-800"
          aria-expanded={open}
          aria-controls="filters-popover"
          title="Filtry"
        >
          Filtry
        </button>
      </div>

      {/* Panel filtrów (WYGLĄD BEZ ZMIAN) */}
      {open && (
        <div
          id="filters-popover"
          className="mt-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 p-3 shadow-xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              <div className="mb-1 opacity-80">Sortuj wg</div>
              <select
                className="w-full border border-zinc-700 rounded-lg px-3 py-2 bg-zinc-800"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="endsAt">Data zakończenia</option>
                <option value="createdAt">Data dodania</option>
                <option value="currentPrice">Cena</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="mb-1 opacity-80">Kierunek</div>
              <select
                className="w-full border border-zinc-700 rounded-lg px-3 py-2 bg-zinc-800"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              >
                <option value="asc">↑ rosnąco</option>
                <option value="desc">↓ malejąco</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="mb-1 opacity-80">Na stronę</div>
              <select
                className="w-full border border-zinc-700 rounded-lg px-3 py-2 bg-zinc-800"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={() => {
                apply(); // użyje bieżących stanów
                setOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
            >
              Zastosuj filtry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
