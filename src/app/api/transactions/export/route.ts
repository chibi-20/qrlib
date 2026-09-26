import { createClient } from "@/lib/supabase/server";
import type { TransactionWithRelations } from "@/lib/database.types";

function toCsvRow(values: (string | number | null)[]): string {
  return values
    .map((v) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, student:students(*), book:books(*)")
    .order("borrowed_at", { ascending: false })
    .returns<TransactionWithRelations[]>();

  const header = toCsvRow([
    "transaction_id",
    "student_no",
    "student_name",
    "grade_level",
    "section",
    "book_code",
    "book_title",
    "borrowed_at",
    "due_date",
    "returned_at",
    "status",
    "scan_duration_ms",
  ]);

  const rows = (data ?? []).map((t) =>
    toCsvRow([
      t.id,
      t.student.student_no,
      t.student.full_name,
      t.student.grade_level,
      t.student.section,
      t.book.book_code,
      t.book.title,
      t.borrowed_at,
      t.due_date,
      t.returned_at,
      t.status,
      t.scan_duration_ms,
    ]),
  );

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
