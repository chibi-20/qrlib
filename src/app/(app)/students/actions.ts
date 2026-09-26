"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
