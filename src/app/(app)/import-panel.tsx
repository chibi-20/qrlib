"use client";

import { useState, type FormEvent } from "react";
import type { ImportResult } from "@/lib/csv-import";

export function ImportPanel({
  action,
  sampleHref,
}: {
  action: (formData: FormData) => Promise<ImportResult>;
  sampleHref: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setPending(true);
    setResult(null);
    const formData = new FormData();
    formData.set("file", file);
    const res = await action(formData);
    setResult(res);
    setPending(false);
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          type="submit"
          disabled={!file || pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Importing…" : "Import"}
        </button>
        <a
          href={sampleHref}
          download
          className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
        >
          Download sample CSV
        </a>
      </form>

      {result && (
        <div className="space-y-2 rounded-md bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-900">
            Imported {result.imported} of {result.totalRows} row(s).
          </p>
          {result.errors.length > 0 && (
            <div>
              <p className="font-medium text-red-700">{result.errors.length} row(s) skipped:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-red-700">
                {result.errors.slice(0, 20).map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
              {result.errors.length > 20 && (
                <p className="mt-1 text-slate-500">…and {result.errors.length - 20} more.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
