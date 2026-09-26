import { createClient } from "@/lib/supabase/server";
import type { TransactionWithRelations, TransactionStatus } from "@/lib/database.types";

const STATUS_STYLES: Record<TransactionStatus, string> = {
  borrowed: "bg-blue-50 text-blue-700",
  returned: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-700",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*, student:students(*), book:books(*)")
    .order("borrowed_at", { ascending: false })
    .limit(200);

  if (status === "borrowed" || status === "returned" || status === "overdue") {
    query = query.eq("status", status);
  }

  const { data: transactions } = await query.returns<TransactionWithRelations[]>();

  const filters: { label: string; value?: string }[] = [
    { label: "All", value: undefined },
    { label: "Borrowed", value: "borrowed" },
    { label: "Returned", value: "returned" },
    { label: "Overdue", value: "overdue" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
        <a
          href="/api/transactions/export"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Export CSV
        </a>
      </div>

      <div className="flex gap-2">
        {filters.map((f) => (
          <a
            key={f.label}
            href={f.value ? `/transactions?status=${f.value}` : "/transactions"}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              status === f.value || (!status && !f.value)
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Book</th>
              <th className="px-4 py-3 font-medium">Borrowed</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Returned</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Scan time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(transactions ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-slate-900">{t.student.full_name}</td>
                <td className="px-4 py-3 text-slate-700">{t.book.title}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(t.borrowed_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(t.due_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {t.returned_at ? new Date(t.returned_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[t.status]}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {t.scan_duration_ms != null ? `${(t.scan_duration_ms / 1000).toFixed(1)}s` : "—"}
                </td>
              </tr>
            ))}
            {(transactions ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
