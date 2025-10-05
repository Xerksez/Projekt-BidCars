"use client";

import Link from "next/link";
import AuctionThumb from "./AuctionThumb";

type Auction = {
  id: string;
  title: string;
  vin: string | null;
  startsAt: string;
  endsAt: string;
  currentPrice: number;
  status?: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
};

const fmt = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function badgeClass(status?: Auction["status"]) {
  switch (status) {
    case "LIVE":
      return "bg-emerald-900/40 text-emerald-200 border-emerald-700";
    case "SCHEDULED":
      return "bg-amber-900/30 text-amber-200 border-amber-700";
    case "ENDED":
      return "bg-neutral-800 text-neutral-300 border-neutral-700";
    case "CANCELLED":
      return "bg-rose-900/40 text-rose-200 border-rose-700";
    default:
      return "bg-neutral-800 text-neutral-300 border-neutral-700";
  }
}

export default function AuctionCard({ a }: { a?: Auction }) {
  if (!a || !a.id) return null; // 🔒 twarda osłona

  const safeTitle = a.title ?? "—";
  const safeStatus = a.status ?? "SCHEDULED";

  return (
    <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 transition p-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <AuctionThumb auctionId={a.id} alt={a.title} coverUrl={(a as any).coverUrl} />
        </div>

        <div className="col-span-3 sm:col-span-2 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/auction/${a.id}`}
              className="font-medium underline underline-offset-4"
            >
              {safeTitle}
            </Link>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass(
                safeStatus
              )}`}
              title={safeStatus}
            >
              {safeStatus}
            </span>
          </div>

          <div className="text-xs text-neutral-300">VIN: {a.vin ?? "—"}</div>
          <div className="text-xs text-neutral-300">
            {new Date(a.startsAt).toLocaleString()} →{" "}
            {new Date(a.endsAt).toLocaleString()}
          </div>

          <div className="text-sm mt-1">
            Cena bieżąca: <b>{fmt.format(a.currentPrice ?? 0)}</b>
          </div>
        </div>
      </div>
    </li>
  );
}
