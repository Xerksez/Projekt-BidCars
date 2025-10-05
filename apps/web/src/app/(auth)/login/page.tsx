'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      r.push('/account');
      r.refresh();
    } catch (e: any) {
      setErr(e?.message || 'Błąd logowania');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Logowanie</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2 bg-neutral-900 text-neutral-100"
               placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2 bg-neutral-900 text-neutral-100"
               type="password" placeholder="Hasło" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="text-sm text-red-400">{err}</div>}
        <button disabled={loading} className="px-3 py-2 rounded bg-indigo-600 text-white">
          {loading ? 'Logowanie…' : 'Zaloguj'}
        </button>
      </form>
    </div>
  );
}
