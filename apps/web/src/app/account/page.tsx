import { apiFetchServer, Me } from "@/lib/api-server";

async function getMe(): Promise<Me | null> {
  const res = await apiFetchServer("/auth/me");
  if (!res.ok) return null;
  return (await res.json()) as Me;
}

export default async function AccountPage() {
  const me = await getMe();

  if (!me) {
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
