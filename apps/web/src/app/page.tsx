import Image from "next/image";

async function getAuctions() {
  const res = await fetch("http://localhost:3001/auctions", { cache: "no-store" });
  return res.json();
}

export default async function Home() {
  const auctions = await getAuctions();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-3xl">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <h2 className="text-xl font-semibold">Aukcje (z API)</h2>
        <div className="w-full rounded border p-4">
          {auctions.length === 0 ? (
            <p className="text-sm opacity-70">Brak aukcji. Dodaj pierwszą przez POST /auctions.</p>
          ) : (
            <ul className="space-y-2">
              {auctions.map((a: any) => (
                <li key={a.id} className="border rounded p-3">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs opacity-70">VIN: {a.vin ?? '—'}</div>
                  <div className="text-xs opacity-70">
                    {new Date(a.startsAt).toLocaleString()} → {new Date(a.endsAt).toLocaleString()}
                  </div>
                  <div className="text-sm mt-1">Cena bieżąca: ${a.currentPrice}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">Save and see your changes instantly.</li>
        </ol>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
