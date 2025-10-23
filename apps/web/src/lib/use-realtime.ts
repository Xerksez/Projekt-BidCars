"use client";

import { useEffect } from "react";
import { getSocket } from "./realtime";

type Handlers = {
  onBidCreated?: (payload: any) => void;
  onAuctionExtended?: (payload: any) => void;
};

export function useRealtimeAuction(auctionId: string, handlers: Handlers = {}) {
  useEffect(() => {
    const s = getSocket();

    // Dołącz do pokoju aukcji — dopasuj do backendu
    s.emit("joinAuctionRoom", { auctionId });

    if (handlers.onBidCreated) s.on("bidCreated", handlers.onBidCreated);
    if (handlers.onAuctionExtended) s.on("auctionExtended", handlers.onAuctionExtended);

    return () => {
      if (handlers.onBidCreated) s.off("bidCreated", handlers.onBidCreated);
      if (handlers.onAuctionExtended) s.off("auctionExtended", handlers.onAuctionExtended);
      s.emit("leaveAuctionRoom", { auctionId });
    };
  }, [auctionId]);
}
