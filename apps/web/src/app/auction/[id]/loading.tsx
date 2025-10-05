import Skeleton from "@/components/ui/Skeleton";

export default function AuctionLoading() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* LiveStatus */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>

      {/* PhotoAdmin */}
      <div className="rounded border border-neutral-800 p-4 bg-neutral-900">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Galeria */}
      <div className="rounded border border-neutral-800 p-4 bg-neutral-900">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full" />
          ))}
        </div>
      </div>

      {/* Dane aukcji */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded border border-neutral-800 p-4 bg-neutral-900"
          >
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>

      {/* Bid form / info */}
      <div className="rounded border border-neutral-800 p-4 bg-neutral-900">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-10 w-48 rounded" />
          <Skeleton className="h-10 flex-1 rounded" />
          <Skeleton className="h-10 w-28 rounded" />
        </div>
        <Skeleton className="h-3 w-56 mt-3" />
      </div>

      {/* Lista ofert */}
      <div className="rounded border border-neutral-800 p-4 bg-neutral-900">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
