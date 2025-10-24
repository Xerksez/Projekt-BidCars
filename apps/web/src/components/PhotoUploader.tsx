"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function PhotoUploader({ auctionId }: { auctionId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const MAX_MB = 5; // zgodne z backendem (multer + MaxFileSizeValidator 5MB)
  const ACCEPT_RE = /^image\/(jpeg|png|webp|gif|bmp|svg\+xml)$/i;

  function addLog(s: string) {
    setLog((prev) => [s, ...prev].slice(0, 6));
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;

    const filtered = picked.filter((f) => {
      if (!ACCEPT_RE.test(f.type)) {
        addLog(
          `⚠️ Pominięto ${f.name} – nieobsługiwany typ (${f.type || "brak"})`
        );
        return false;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        addLog(`⚠️ Pominięto ${f.name} – plik > ${MAX_MB}MB`);
        return false;
      }
      return true;
    });

    if (filtered.length) {
      setFiles((prev) => [...prev, ...filtered]);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files ?? []);
    if (!dropped.length) return;

    const filtered = dropped.filter((f) => {
      if (!ACCEPT_RE.test(f.type)) {
        addLog(
          `⚠️ Pominięto ${f.name} – nieobsługiwany typ (${f.type || "brak"})`
        );
        return false;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        addLog(`⚠️ Pominięto ${f.name} – plik > ${MAX_MB}MB`);
        return false;
      }
      return true;
    });

    if (filtered.length) {
      setFiles((prev) => [...prev, ...filtered]);
    }
  }

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    // 🔹 Backend oczekuje auctionId w URL, NIE w form-data:
    const res = await fetch(
      `${API}/photos/auction/${encodeURIComponent(auctionId)}`,
      {
        method: "POST",
        credentials: "include", // wyśle JWT z cookie (AdminOrApiKeyGuard → rola ADMIN wystarczy)
        body: fd,
      }
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Upload failed (${res.status}) ${txt || res.statusText}`);
    }
    return res.json();
  }

  async function start() {
    if (!files.length || busy) return;
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        addLog(`⤴️ Wysyłanie ${f.name}…`);
        await uploadOne(f);
        addLog(`✅ OK: ${f.name}`);
      }
      setFiles([]);
      // 🔹 Nie przekazujemy callbacków z Server → Client. Odświeżamy SSR lokalnie:
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`❌ Błąd: ${msg}`);
      alert("Nie udało się wgrać części/całości plików. Sprawdź log powyżej.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border p-4 space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed rounded p-6 text-center cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <div className="font-medium">
          Przeciągnij & upuść zdjęcia albo kliknij, aby wybrać
        </div>
        <div className="text-sm opacity-70 mt-1">
          Obsługiwane: JPG/PNG/WebP/GIF/BMP/SVG, do {MAX_MB} MB/szt.
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onPick}
        />
      </div>

      {files.length > 0 && (
        <div className="text-sm">
          <div className="font-medium mb-2">Kolejka ({files.length}):</div>
          <ul className="list-disc pl-5 space-y-1">
            {files.map((f, i) => (
              <li key={i}>
                {f.name} ({Math.round(f.size / 1024)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={start}
          disabled={busy || files.length === 0}
          className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? "Wysyłanie…" : "Wyślij"}
        </button>
        <button
          onClick={() => setFiles([])}
          disabled={busy || files.length === 0}
          className="px-3 py-2 rounded border border-neutral-700"
        >
          Wyczyść
        </button>
      </div>

      {log.length > 0 && (
        <div className="text-xs opacity-70 space-y-1">
          {log.map((l, i) => (
            <div key={i}>• {l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
