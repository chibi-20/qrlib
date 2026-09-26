import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/database.types";
import { encodeStudentCode, generateQrDataUrl } from "@/lib/qr";
import { PrintButton } from "@/app/(app)/print-button";

export default async function PrintAllStudentQrPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("full_name")
    .returns<Student[]>();

  const cards = await Promise.all(
    (students ?? []).map(async (student) => ({
      student,
      qrDataUrl: await generateQrDataUrl(encodeStudentCode(student.student_no)),
    })),
  );

  return (
    <div className="space-y-4">
      <div className="print:hidden flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Print all student QR IDs</h1>
        <PrintButton />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {cards.map(({ student, qrDataUrl }) => (
          <div
            key={student.id}
            className="rounded-lg border border-slate-200 bg-white p-4 text-center break-inside-avoid"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={student.full_name} className="mx-auto w-32" />
            <p className="mt-2 text-sm font-semibold text-slate-900">{student.full_name}</p>
            <p className="text-xs text-slate-500">
              {student.grade_level} · {student.section}
            </p>
            <p className="font-mono text-[10px] text-slate-400">{student.student_no}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
