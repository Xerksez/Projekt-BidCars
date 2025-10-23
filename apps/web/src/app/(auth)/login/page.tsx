"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    console.log("[LoginPage] submit", { email, password });

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Login failed (${res.status})`);
      }

      console.log("[LoginPage] login success → dispatch event & redirect");
      window.dispatchEvent(new Event("auth:login"));
      // twardy reload na stronę główną
      window.location.href = "/";
      return;
    } catch (e: any) {
      console.error("[LoginPage] login error:", e);
      setErr(e?.message || "Błąd logowania");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold mb-4">Logowanie</h1>

      {err && (
        <div className="mb-3 text-sm text-red-300 bg-red-900/30 border border-red-800 rounded p-2">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border border-neutral-700 rounded px-3 py-2 bg-neutral-900"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <input
          className="w-full border border-neutral-700 rounded px-3 py-2 bg-neutral-900"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60"
        >
          {loading ? "Logowanie..." : "Zaloguj"}
        </button>
      </form>

      <p className="text-sm mt-3 text-neutral-400">
        Nie masz konta?{" "}
        <Link href="/register" className="underline text-indigo-400 hover:text-indigo-300">
          Zarejestruj się
        </Link>
      </p>
    </div>
  );
}
