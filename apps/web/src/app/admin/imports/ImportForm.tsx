"use client";

import { useState, useMemo } from "react";

type RunResponse =
  | {
      dryRun: true;
      mock: boolean;
      startPage: number;
      per_page: number;
      maxPages: number;
      totalFetched: number;
      totalSaved: number;
      pages: { page: number; count: number; saved: number }[];
    }
  | {
      dryRun: false;
      count: number;
      saved: number;
      items: { id: string; vin: string | null; sourceId: string | null }[];
    };

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function NumberInput({
  label,
  value,
  onChange,
  min = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="opacity-80">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || min))}
        className="rounded border bg-transparent px-3 py-2"
      />
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export default function ImportForm() {
  const [mock, setMock] = useState(true);
  const [dryRun, setDryRun] = useState(true);
  const [startPage, setStartPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [maxPages, setMaxPages] = useState(2);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResponse | null>(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("dryRun", dryRun ? "1" : "0");
    params.set("mock", mock ? "1" : "0");
    params.set("startPage", String(startPage));
    params.set("perPage", String(perPage));
    params.set("maxPages", String(maxPages));
    return params.toString();
  }, [dryRun, mock, startPage, perPage, maxPages]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/import/run?${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

      setResult(JSON.parse(text));
    } catch (err: any) {
      setError(err.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 flex gap-4">
          <Checkbox label="mock (plik)" checked={mock} onChange={setMock} />
          <Checkbox
            label="dryRun (bez zapisu)"
            checked={dryRun}
            onChange={setDryRun}
          />
        </div>

        <NumberInput
          label="startPage"
          value={startPage}
          onChange={setStartPage}
        />
        <NumberInput label="perPage" value={perPage} onChange={setPerPage} />
        <NumberInput label="maxPages" value={maxPages} onChange={setMaxPages} />

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-white/10 hover:bg-white/20 px-4 py-2 text-sm"
          >
            {loading ? "Uruchamiam…" : "Uruchom import"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded border border-red-400 bg-red-50/10 p-3 text-sm text-red-300">
          <div className="font-semibold mb-1">Błąd</div>
          <pre className="whitespace-pre-wrap break-words">{error}</pre>
        </div>
      )}

      {result && (
        <div className="rounded border p-3 space-y-3 text-sm">
          <div>
            <b>totalFetched:</b>{" "}
            {"totalFetched" in result ? result.totalFetched : result.count}
          </div>
          <div>
            <b>totalSaved:</b>{" "}
            {"totalSaved" in result ? result.totalSaved : result.saved}
          </div>
          <details>
            <summary>Pełny JSON</summary>
            <pre className="mt-2 overflow-auto max-h-80">
              {prettyJson(result)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
