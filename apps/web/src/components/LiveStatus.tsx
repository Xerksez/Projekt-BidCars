'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Countdown from './Countdown';

type Props = {
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status?: string;  // opcjonalnie, jeśli chcesz to wyświetlać obok
};

export default function LiveStatus({ startsAt, endsAt, status }: Props) {
  const router = useRouter();

  // Kolory badge wg fazy wyliczone po stronie klienta
  const phase = useMemo(() => {
    const now = Date.now();
    const s = new Date(startsAt).getTime();
    const e = new Date(endsAt).getTime();
    if (now < s) return 'UPCOMING';
    if (now >= e) return 'ENDED';
    return 'LIVE';
  }, [startsAt, endsAt]);

  const badgeClass =
    phase === 'LIVE'
      ? 'bg-green-100 text-green-700 border-green-300'
      : phase === 'UPCOMING'
      ? 'bg-amber-100 text-amber-700 border-amber-300'
      : 'bg-gray-200 text-gray-700 border-gray-300';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
          {phase}
        </span>
        {status && (
          <span className="text-xs opacity-70">
            ({status})
          </span>
        )}
      </div>

      <Countdown
        startsAt={startsAt}
        endsAt={endsAt}
        onPhaseChange={(p) => {
          // Auto-refresh gdy przejście UPCOMING→LIVE i LIVE→ENDED
          if (p === 'LIVE' || p === 'ENDED') router.refresh();
        }}
      />
    </div>
  );
}
