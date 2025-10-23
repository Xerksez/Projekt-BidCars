"use client";

import { useState, FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setLoading(true);
    console.log("[RegisterPage] submit", { email, name });

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Register failed");
      }

      console.log("[RegisterPage] register OK → dispatch login");
      // auto-login (backend już ustawia cookie)
      window.dispatchEvent(new Event("auth:login"));
      window.location.href = "/";
      return;
    } catch (e: any) {
      console.error("[RegisterPage] error:", e);
      setErr(e?.message ?? "Rejestracja nie powiodła się");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Rejestracja</h1>

      {err && (
        <div className="mb-3 rounded border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {err}
        </div>
      )}
      {ok && (
        <div className="mb-3 rounded border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          Konto utworzone. Przekierowuję...
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Imię (opcjonalnie)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-zinc-700 rounded-md bg-zinc-900 px-3 py-2"
        />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-zinc-700 rounded-md bg-zinc-900 px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-zinc-700 rounded-md bg-zinc-900 px-3 py-2"
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 disabled:opacity-60"
        >
          {loading ? "Rejestruję..." : "Zarejestruj"}
        </button>
      </form>

      <p className="text-sm mt-3 text-neutral-400">
        Masz już konto?{" "}
        <Link
          href="/login"
          className="underline text-indigo-400 hover:text-indigo-300"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
