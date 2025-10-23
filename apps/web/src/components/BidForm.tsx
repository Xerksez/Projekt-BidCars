"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type Props = {
  auctionId: string;
  minAmount: number;
  disabled?: boolean;
  isAuthed?: boolean;
};

export default function BidForm({
  auctionId,
  minAmount,
  disabled,
  isAuthed,
}: Props) {
  const [amount, setAmount] = useState<number>(minAmount);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);

    if (!isAuthed) {
      setErr("Musisz być zalogowany, aby licytować.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/bids", {
        method: "POST",
        body: JSON.stringify({ auctionId, amount }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Nie udało się złożyć oferty");
      }
      setOk(true);
      // opcjonalnie odśwież bieżącą stronę / stream:
      window.dispatchEvent(
        new CustomEvent("bid:created", { detail: { auctionId, amount } })
      );
    } catch (e: any) {
      setErr(e?.message ?? "Błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!isAuthed && (
        <div className="mb-3 text-sm text-amber-300 bg-amber-900/30 border border-amber-800 rounded p-2">
          Aby licytować,{" "}
          <Link
            href={`/login?next=/auction/${auctionId}`}
            className="underline"
          >
            zaloguj się
          </Link>
          .
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          type="number"
          min={minAmount}
          step={100}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-40 border border-neutral-700 rounded px-3 py-2 bg-neutral-900"
          disabled={disabled || loading}
        />
        <button
          type="submit"
          disabled={disabled || loading}
          className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60"
        >
          {loading ? "Licytuję…" : "Zalicytuj"}
        </button>
      </form>

      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
      {ok && <p className="mt-2 text-sm text-emerald-300">Oferta złożona ✅</p>}
      {disabled && (
        <p className="mt-2 text-xs opacity-70">
          Licytacja niedostępna (aukcja nie-LIVE).
        </p>
      )}
    </div>
  );
}
