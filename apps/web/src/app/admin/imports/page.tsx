import { cookies } from "next/headers";
import { Suspense } from "react";
import ImportForm from "./ImportForm";

/** SSR: pobiera zalogowanego usera z API, przekazując cookie */
async function getMe() {
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const res = await fetch(`${API}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    id: string;
    email: string;
    role?: string;
    name?: string | null;
  };
}

export default async function AdminImportsPage() {
  const me = await getMe();

  if (!me) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Panel importów</h1>
        <p className="text-sm opacity-80">
          Musisz być zalogowany, aby zobaczyć tę stronę.{" "}
          <a href="/login" className="underline underline-offset-4">
            Zaloguj się
          </a>
          .
        </p>
      </div>
    );
  }

  if ((me.role ?? "USER") !== "ADMIN") {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Panel importów</h1>
        <p className="text-sm opacity-80">
          Ta sekcja jest dostępna tylko dla administratorów.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Importy (mock / dry-run)</h1>
        <a href="/" className="text-sm underline underline-offset-4">
          ← Powrót
        </a>
      </div>

      <div className="rounded border p-4">
        <p className="text-sm opacity-80 mb-3">
          Uruchom import aktywnych aukcji z paginacją. Domyślnie korzystaj z{" "}
          <b>mock</b> i <b>dry-run</b>— nie zużyjesz limitu w API vendora ani
          nie zapiszesz danych do bazy.
        </p>
        <Suspense>
          <ImportForm />
        </Suspense>
      </div>
    </div>
  );
}
