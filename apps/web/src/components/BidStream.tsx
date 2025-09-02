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
    const socket: Socket = io(`${WS_BASE}/ws`, { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("auction.join", { auctionId });
    });

    socket.on("auction.joined", () => {
      // można pokazać toast: "dołączono do aukcji"
    });

    socket.on("bid.created", () => {
      // nowy bid — odśwież SSR
      router.refresh();
    });

    socket.on("bid.created", () => {
      router.refresh();
    });

    socket.on("auction.extended", () => {
      // można dodać toast: "Aukcja przedłużona o X s"
      router.refresh();
    });

    socket.on('auction.status', () => {
        router.refresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [auctionId, router]);

  return null;
}
