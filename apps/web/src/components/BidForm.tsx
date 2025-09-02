"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

type User = { id: string; email: string; name?: string | null };
type Props = {
  auctionId: string;
  minAmount: number;
  users: User[];
};

export default function BidForm({ auctionId, minAmount, users }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(minAmount);
  const [userId, setUserId] = useState<string>(users[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), userId, auctionId }),
      });
      // ...

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          msg =
            (Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message) || msg;
        } catch {}
        alert(`Błąd: ${msg}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("Nie udało się złożyć oferty.");
    } finally {
      setLoading(false);
      setAmount(minAmount);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col sm:flex-row gap-2 items-stretch"
    >
      <select
        className="border rounded px-3 py-2 text-sm"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        required
        aria-label="Użytkownik"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name ?? u.email}
          </option>
        ))}
      </select>

      <input
        type="number"
        className="border rounded px-3 py-2 text-sm w-full"
        value={amount}
        min={minAmount}
        step={1}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder={`min ${minAmount}`}
        aria-label="Kwota"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-foreground text-background px-4 py-2 text-sm disabled:opacity-60"
      >
        {loading ? "Licytuję…" : "Licytuj"}
      </button>
    </form>
  );
}
