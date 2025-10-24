"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "SCHEDULED" | "LIVE" | "ENDED";

type Props = {
  startsAt: string; // ISO
  endsAt: string; // ISO
  onEnd?: () => void;
  onPhaseChange?: (phase: Phase) => void; // ⬅️ NOWE
};

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (d > 0)
    return `${d}d ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

export default function Countdown({
  startsAt,
  endsAt,
  onEnd,
  onPhaseChange,
}: Props) {
  const [now, setNow] = useState(Date.now());
  const start = useMemo(() => new Date(startsAt).getTime(), [startsAt]);
  const end = useMemo(() => new Date(endsAt).getTime(), [endsAt]);

  const before = now < start;
  const live = now >= start && now < end;
  const ended = now >= end;

  const phase: Phase = ended ? "ENDED" : live ? "LIVE" : "SCHEDULED";
  const prevPhase = useRef<Phase>(phase);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase !== prevPhase.current) {
      onPhaseChange?.(phase); // ⬅️ trigger na zmianę fazy
      prevPhase.current = phase;
    }
  }, [phase, onPhaseChange]);

  useEffect(() => {
    if (ended && onEnd) onEnd();
  }, [ended, onEnd]);

  return (
    <div className="rounded border p-3 text-sm flex items-center gap-2">
      {before && (
        <>
          <span className="opacity-70">Start za:</span>
          <strong>{fmt(start - now)}</strong>
        </>
      )}
      {live && (
        <>
          <span className="opacity-70">Do końca:</span>
          <strong>{fmt(end - now)}</strong>
        </>
      )}
      {ended && <strong>Aukcja zakończona</strong>}
    </div>
  );
}
