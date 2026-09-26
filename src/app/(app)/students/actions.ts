"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import type { ImportResult } from "@/lib/csv-import";

const REQUIRED_COLUMNS = ["student_no", "full_name", "grade_level", "section"] as const;

export async function createStudent(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("students").insert({
    student_no: String(formData.get("student_no") ?? "").trim(),
    full_name: String(formData.get("full_name") ?? "").trim(),
    grade_level: String(formData.get("grade_level") ?? "").trim(),
    section: String(formData.get("section") ?? "").trim(),
  });

  if (error) {
    redirect(`/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
  redirect("/students");
}

export async function updateStudent(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({
      student_no: String(formData.get("student_no") ?? "").trim(),
      full_name: String(formData.get("full_name") ?? "").trim(),
      grade_level: String(formData.get("grade_level") ?? "").trim(),
      section: String(formData.get("section") ?? "").trim(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/students/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
  redirect("/students");
}

export async function deleteStudent(id: string) {
  const supabase = await createClient();
  await supabase.from("students").delete().eq("id", id);
  revalidatePath("/students");
}

export async function importStudentsCsv(formData: FormData): Promise<ImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { totalRows: 0, imported: 0, errors: [{ row: 0, reason: "No file uploaded." }] };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const errors: { row: number; reason: string }[] = [];
  const rowsByStudentNo = new Map<string, { student_no: string; full_name: string; grade_level: string; section: string }>();

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 2; // account for header row, 1-indexed
    const studentNo = (raw.student_no ?? "").trim();
    const fullName = (raw.full_name ?? "").trim();
    const gradeLevel = (raw.grade_level ?? "").trim();
    const section = (raw.section ?? "").trim();

    const missing = REQUIRED_COLUMNS.filter(
      (col) => !{ student_no: studentNo, full_name: fullName, grade_level: gradeLevel, section }[col],
    );
    if (missing.length > 0) {
      errors.push({ row: rowNumber, reason: `Missing ${missing.join(", ")}` });
      return;
    }

    if (rowsByStudentNo.has(studentNo)) {
      errors.push({ row: rowNumber, reason: `Duplicate student_no "${studentNo}" in file (later row used)` });
    }
    rowsByStudentNo.set(studentNo, {
      student_no: studentNo,
      full_name: fullName,
      grade_level: gradeLevel,
      section,
    });
  });

  const rows = Array.from(rowsByStudentNo.values());
  let imported = 0;

  if (rows.length > 0) {
    const supabase = await createClient();
    const { error, count } = await supabase
      .from("students")
      .upsert(rows, { onConflict: "student_no", count: "exact" });

    if (error) {
      errors.push({ row: 0, reason: `Database error: ${error.message}` });
    } else {
      imported = count ?? rows.length;
    }
  }

  revalidatePath("/students");
  return { totalRows: parsed.data.length, imported, errors };
}
