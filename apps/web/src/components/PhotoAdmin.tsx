// apps/web/src/components/PhotoAdmin.tsx
"use client";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function PhotoAdmin({ auctionId }: { auctionId: string }) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const k = localStorage.getItem("bidcars_api_key");
    if (k) setApiKey(k);
  }, []);

  function saveKey(v: string) {
    setApiKey(v);
    localStorage.setItem("bidcars_api_key", v);
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (!apiKey) {
      alert("Podaj x-api-key (admin)!");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const res = await fetch(`${API}/photos/auction/${auctionId}`, {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: fd,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Upload failed");
      }
      setFile(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message ?? "Błąd uploadu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border p-4 space-y-3">
      <div className="text-sm font-semibold">Zarządzanie zdjęciami (admin)</div>

      <label className="block text-sm">
        <span className="opacity-70">x-api-key</span>
        <input
          type="password"
          className="mt-1 w-full border rounded px-2 py-1"
          value={apiKey}
          onChange={(e) => saveKey(e.target.value)}
          placeholder="Wklej ADMIN_API_KEY"
        />
      </label>

      <form onSubmit={onUpload} className="flex flex-col gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="submit"
          disabled={busy || !file}
          className="self-start rounded bg-foreground text-background px-3 py-1 text-sm disabled:opacity-50"
        >
          {busy ? "Wysyłanie..." : "Wyślij zdjęcie"}
        </button>
      </form>
    </div>
  );
}
