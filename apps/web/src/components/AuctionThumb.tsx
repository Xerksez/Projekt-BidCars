"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Skeleton from "@/components/ui/Skeleton";

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

/** Pokazuje pierwsze zdjęcie aukcji (o ile istnieje). */
export default function AuctionThumb({
  auctionId,
  alt,
  coverUrl, // ✅ NEW (opcjonalny skrót – jeśli mamy URL z listy)
}: {
  auctionId: string;
  alt: string;
  coverUrl?: string | null;
}) {
  // jeśli dostaliśmy coverUrl — od razu ustawiamy i nie ładujemy z API
  const [url, setUrl] = useState<string | null>(coverUrl ?? null);
  const [loading, setLoading] = useState<boolean>(!coverUrl);

  useEffect(() => {
    // jeśli mamy coverUrl, omijamy fetch
    if (coverUrl) return;

    let abort = false;
    (async () => {
      try {
        const res = await fetch(`${API}/photos/auction/${auctionId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const list: Array<{ url: string }> = await res.json();
        if (!abort) setUrl(list?.[0]?.url ?? null);
      } catch {
        /* ignore */
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [auctionId, coverUrl]);

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-md bg-neutral-800">
      {loading ? (
        <Skeleton className="absolute inset-0" />
      ) : url ? (
        <Image
          src={url.startsWith("http") ? url : `${API}${url}`}
          alt={alt}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full grid place-items-center text-xs text-neutral-400">
          brak zdjęcia
        </div>
      )}
    </div>
  );
}
