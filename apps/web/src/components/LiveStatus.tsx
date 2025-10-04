'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Countdown from './Countdown';

type BackendStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | undefined;

type Props = {
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status?: BackendStatus;
};

export default function LiveStatus({ startsAt, endsAt, status }: Props) {
  const router = useRouter();

  // Klient liczy fazę po czasie
  const clientPhase: 'SCHEDULED' | 'LIVE' | 'ENDED' = useMemo(() => {
    const now = Date.now();
    const s = new Date(startsAt).getTime();
    const e = new Date(endsAt).getTime();
    if (now < s) return 'SCHEDULED';
    if (now >= e) return 'ENDED';
    return 'LIVE';
  }, [startsAt, endsAt]);

  // CANCELLED z backendu zawsze wygrywa
  const phase: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' =
    status === 'CANCELLED' ? 'CANCELLED' : clientPhase;

  const badgeClass =
    phase === 'LIVE'
      ? 'bg-green-100 text-green-700 border-green-300'
      : phase === 'SCHEDULED'
      ? 'bg-amber-100 text-amber-700 border-amber-300'
      : phase === 'CANCELLED'
      ? 'bg-red-100 text-red-700 border-red-300 line-through'
      : 'bg-gray-200 text-gray-700 border-gray-300';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
          {phase}
        </span>
      </div>

      {/* Odliczanie tylko gdy NIE jest anulowana */}
      {phase !== 'CANCELLED' && (
        <Countdown
          startsAt={startsAt}
          endsAt={endsAt}
          onPhaseChange={(p) => {
            // Auto-refresh przy wejściu w LIVE i przy końcu
            if (p === 'LIVE' || p === 'ENDED') router.refresh();
          }}
        />
      )}
    </div>
  );
}
