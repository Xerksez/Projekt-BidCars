"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { usePathname } from "next/navigation";

type Me = { id: string; email: string; name?: string | null; role?: string };

export default function AuthButtons() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      console.log("[AuthButtons] fetching /auth/me …");
      const res = await fetch(`${API}/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`me ${res.status}`);
      const data = (await res.json()) as Me;
      console.log("[AuthButtons] got me:", data);
      setMe(data);
    } catch (e) {
      console.warn("[AuthButtons] no session", e);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchMe();

    const onLogin = () => {
      console.log("[AuthButtons] auth:login received -> refetch & reload header");
      setLoading(true);
      fetchMe();
    };
    window.addEventListener("auth:login", onLogin);

    return () => window.removeEventListener("auth:login", onLogin);
  }, []);

  // Na stronach /login i /register nie pokazujemy przycisków w headerze
  if (isSimulationPage(pathname)) return null;

  if (loading) {
    return <div className="h-8 w-24 rounded-md bg-neutral-800 animate-pulse" />;
  }

  if (!me) {
    return (
      <div className="flex gap-2">
        <Link href="/login" className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm hover:bg-zinc-800">
          Zaloguj
        </Link>
        <Link href="/register" className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
          Zarejestruj
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-300">{me.name ?? me.email}</span>
      <Link href="/account" className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm hover:bg-zinc-800">
        Moje konto
      </Link>
      <button
        onClick={async () => {
          console.log("[AuthButtons] logout…");
          await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
          window.location.href = "/"; // full reload, cookie zniknie
        }}
        className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm hover:bg-zinc-800"
      >
        Wyloguj
      </button>
    </div>
  );
}

function isSimulationPage(pathname?: string) {
  if (!pathname) return false;
  return pathname === "/login" || pathname === "/register";
}
