import Skeleton from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 w-full bg-neutral-950 text-neutral-100">
      <main className="flex flex-col gap-6 row-start-2 items-center sm:items-start w-full max-w-3xl">
        {/* logo */}
        <Skeleton className="h-10 w-[180px] rounded-lg" />

        {/* nagłówek + pasek filtrów */}
        <Skeleton className="h-6 w-40" />
        <div className="w-full flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>

        {/* karta listy z 6 „wierszami” */}
        <div className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
          <ul className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="border border-neutral-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-64" />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <Skeleton className="col-span-1 h-24 rounded-md" />
                  <div className="col-span-2 flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* paginacja */}
        <div className="flex gap-2 items-center">
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-8 w-28 rounded" />
        </div>
      </main>
    </div>
  );
}
