import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TransactionWithRelations } from "@/lib/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: studentCount },
    { count: bookCount },
    { count: activeBorrowCount },
    { count: overdueCount },
    { count: todayCount },
    { data: recent },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .in("status", ["borrowed", "overdue"]),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("status", "overdue"),
    supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("borrowed_at", todayStart.toISOString()),
    supabase
      .from("transactions")
      .select("*, student:students(*), book:books(*)")
      .order("borrowed_at", { ascending: false })
      .limit(8)
      .returns<TransactionWithRelations[]>(),
  ]);

  const cards = [
    { label: "Students", value: studentCount ?? 0, href: "/students" },
    { label: "Book titles", value: bookCount ?? 0, href: "/books" },
    { label: "Active borrows", value: activeBorrowCount ?? 0, href: "/transactions?status=borrowed" },
    { label: "Overdue", value: overdueCount ?? 0, href: "/transactions?status=overdue" },
    { label: "Transactions today", value: todayCount ?? 0, href: "/transactions" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/borrow"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Borrow
          </Link>
          <Link
            href="/return"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Return
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300"
          >
            <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recent ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-slate-900">{t.student.full_name}</td>
                  <td className="px-4 py-3 text-slate-700">{t.book.title}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(t.borrowed_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.status}</td>
                </tr>
              ))}
              {(recent ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No activity yet. Add some students and books to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
