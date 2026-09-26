import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/database.types";
import { DurationChart, VolumeChart } from "./charts";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function windowStartIso(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const since = windowStartIso(WINDOW_DAYS);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("borrowed_at", since)
    .order("borrowed_at", { ascending: true })
    .returns<Transaction[]>();

  const rows = transactions ?? [];

  const byDay = new Map<string, { borrowed: number; returned: number }>();
  const durationByDay = new Map<string, { total: number; count: number }>();

  for (const t of rows) {
    const borrowKey = dayKey(t.borrowed_at);
    const entry = byDay.get(borrowKey) ?? { borrowed: 0, returned: 0 };
    entry.borrowed += 1;
    byDay.set(borrowKey, entry);

    if (t.returned_at) {
      const returnKey = dayKey(t.returned_at);
      const returnEntry = byDay.get(returnKey) ?? { borrowed: 0, returned: 0 };
      returnEntry.returned += 1;
      byDay.set(returnKey, returnEntry);
    }

    if (t.scan_duration_ms != null) {
      const d = durationByDay.get(borrowKey) ?? { total: 0, count: 0 };
      d.total += t.scan_duration_ms;
      d.count += 1;
      durationByDay.set(borrowKey, d);
    }
  }

  const volumeData = Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));
  const durationData = Array.from(durationByDay.entries()).map(([date, d]) => ({
    date,
    avgSeconds: Math.round(d.total / d.count / 1000),
  }));

  const totalBorrows = rows.length;
  const totalReturned = rows.filter((t) => t.status === "returned").length;
  const totalOverdue = rows.filter((t) => t.status === "overdue").length;
  const durations = rows.map((t) => t.scan_duration_ms).filter((v): v is number => v != null);
  const avgDurationSec = durations.length
    ? (durations.reduce((a, b) => a + b, 0) / durations.length / 1000).toFixed(1)
    : "—";
  const onTimeRate = totalReturned
    ? Math.round(
        (rows.filter((t) => t.status === "returned" && t.returned_at && t.returned_at <= `${t.due_date}T23:59:59`)
          .length /
          totalReturned) *
          100,
      )
    : null;

  const stats = [
    { label: "Transactions (30d)", value: totalBorrows },
    { label: "Returned", value: totalReturned },
    { label: "Overdue", value: totalOverdue },
    { label: "Avg. scan-to-confirm time", value: `${avgDurationSec}s` },
    { label: "On-time return rate", value: onTimeRate != null ? `${onTimeRate}%` : "—" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <a
          href="/api/transactions/export"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Export raw data (CSV)
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Borrow vs. return volume (last {WINDOW_DAYS} days)
        </h2>
        {volumeData.length > 0 ? (
          <div className="mt-4">
            <VolumeChart data={volumeData} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No transactions in this window yet.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Average scan-to-confirm time per day (seconds)
        </h2>
        {durationData.length > 0 ? (
          <div className="mt-4">
            <DurationChart data={durationData} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No timed transactions yet.</p>
        )}
      </section>
    </div>
  );
}
