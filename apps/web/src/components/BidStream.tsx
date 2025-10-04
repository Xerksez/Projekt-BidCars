"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

export default function BidStream({ auctionId }: { auctionId: string }) {
  const router = useRouter();

  useEffect(() => {
    let socket: Socket | null = null;
    let retries = 0;
    const maxRetries = 5;

    const connect = () => {
      socket = io(`${WS_BASE}/ws`, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on("connect", () => {
        retries = 0;
        socket!.emit("auction.join", { auctionId });
      });

      socket.on("disconnect", () => {
        // nic – socket.io samo zreconnectuje wg opcji
      });

      // -- zdarzenia domenowe --
      const refresh = () => router.refresh();
      socket.on("bid.created", refresh);
      socket.on("auction.extended", refresh);
      socket.on("auction.status", refresh);

      // czyszczenie przy unmount
      return () => {
        if (!socket) return;
        socket.off("bid.created");
        socket.off("auction.extended");
        socket.off("auction.status");
        socket.disconnect();
        socket = null;
      };
    };

    const cleanup = connect();

    // dodatkowy refresh po powrocie do karty
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cleanup?.();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [auctionId, router]);

  return null;
}
