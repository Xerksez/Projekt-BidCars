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

    function connect() {
      socket = io(`${WS_BASE}/ws`, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        withCredentials: true, // jeśli kiedyś włączysz auth po cookie
      });

      socket.on("connect", () => {
        socket?.emit("auction.join", { auctionId });
      });

      socket.on("bid.created", () => router.refresh());
      socket.on("auction.extended", () => router.refresh());
      socket.on("auction.status", () => router.refresh());

      // opcjonalne logi/diagnostyka
      socket.on("connect_error", () => {});
      socket.on("reconnect_attempt", () => {});
      socket.on("reconnect", () => {});
    }

    connect();
    return () => {
      socket?.off();
      socket?.disconnect();
      socket = null;
    };
  }, [auctionId, router]);

  // Ten komponent tylko „mostkuje” realtime → SSR refresh
  return null;
}
