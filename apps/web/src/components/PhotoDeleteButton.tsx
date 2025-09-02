// apps/web/src/components/PhotoDeleteButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function PhotoDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const apiKey = localStorage.getItem("bidcars_api_key") ?? "";
    if (!apiKey) {
      alert("Podaj x-api-key w panelu nad galerią.");
      return;
    }
    if (!confirm("Usunąć zdjęcie?")) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/photos/${id}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Delete failed");
      }
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Błąd usuwania");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="absolute right-1 top-1 rounded bg-black/60 text-white text-xs px-2 py-0.5 disabled:opacity-50"
      title="Usuń"
    >
      {busy ? "..." : "Usuń"}
    </button>
  );
}
