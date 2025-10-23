"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;

  // Używamy singletonu, żeby nie robić wielu połączeń przy nawigacji
  socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    withCredentials: true,      // cookie JWT po stronie WS (jeśli używasz)
    transports: ["websocket"],  // stabilnie i bez fallbacków na polling
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Proste logi (wyłącz jeśli nie chcesz)
  socket.on("connect", () => console.debug("[ws] connected", socket?.id));
  socket.on("disconnect", (reason) => console.debug("[ws] disconnected", reason));
  socket.on("connect_error", (err) => console.warn("[ws] connect_error", err.message));

  return socket;
}
