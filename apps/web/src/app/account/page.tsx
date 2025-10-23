import { cookies } from "next/headers";
import { API } from "@/lib/api";

type Me = { id: string; email: string; name?: string | null; role?: string };

async function getMe(): Promise<Me | null> {
  // cookies() jest teraz async – trzeba await
  const cookieStore = await cookies();

  // Zbuduj poprawny header Cookie do requestu serwerowego
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${API}/auth/me`, {
    headers: { Cookie: cookieHeader },
    // SSR, bez kejszowania:
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;
  return (await res.json()) as Me;
}
console.log("[Account] server component rendered");
export default async function AccountPage() {
  const me = await getMe();
  if (!me) {
    // prosty redirect bez middleware
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Moje konto</h1>
        <p className="text-sm text-neutral-300">
          Nie jesteś zalogowany.{" "}
          <a href="/login" className="underline">
            Zaloguj się
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Moje konto</h1>
      <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
        <div>
          <b>E-mail:</b> {me.email}
        </div>
        <div>
          <b>Imię:</b> {me.name ?? "—"}
        </div>
        <div>
          <b>Rola:</b> {me.role ?? "user"}
        </div>
      </div>
    </div>
  );
}
