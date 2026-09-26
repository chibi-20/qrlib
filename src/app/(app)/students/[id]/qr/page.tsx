import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/database.types";
import { encodeStudentCode, generateQrDataUrl } from "@/lib/qr";
import { PrintButton } from "@/app/(app)/print-button";

export default async function StudentQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle<Student>();

  if (!student) notFound();

  const qrDataUrl = await generateQrDataUrl(encodeStudentCode(student.student_no));

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div className="print:hidden flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Student QR ID</h1>
        <PrintButton />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR code for ${student.full_name}`} className="mx-auto" />
        <p className="mt-3 text-lg font-semibold text-slate-900">{student.full_name}</p>
        <p className="text-sm text-slate-500">
          {student.grade_level} · {student.section}
        </p>
        <p className="mt-1 font-mono text-xs text-slate-400">{student.student_no}</p>
      </div>
    </div>
  );
}
