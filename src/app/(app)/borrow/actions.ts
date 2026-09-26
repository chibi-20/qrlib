"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decodeQr } from "@/lib/qr";
import type { Book, Student } from "@/lib/database.types";

export type LookupResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function lookupStudentByQr(raw: string): Promise<LookupResult<Student>> {
  const decoded = decodeQr(raw);
  if (!decoded || decoded.type !== "student") {
    return { ok: false, error: "That doesn't look like a student QR ID." };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("student_no", decoded.code)
    .maybeSingle<Student>();

  if (!data) return { ok: false, error: `No student found for code ${decoded.code}.` };
  return { ok: true, data };
}

export async function lookupBookByQr(raw: string): Promise<LookupResult<Book>> {
  const decoded = decodeQr(raw);
  if (!decoded || decoded.type !== "book") {
    return { ok: false, error: "That doesn't look like a book QR label." };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("*")
    .eq("book_code", decoded.code)
    .maybeSingle<Book>();

  if (!data) return { ok: false, error: `No book found for code ${decoded.code}.` };
  return { ok: true, data };
}

export async function createBorrowTransaction(input: {
  studentId: string;
  bookId: string;
  scanDurationMs: number;
  dueInDays?: number;
}): Promise<LookupResult<{ id: string }>> {
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("available_copies")
    .eq("id", input.bookId)
    .maybeSingle<{ available_copies: number }>();

  if (!book || book.available_copies < 1) {
    return { ok: false, error: "No copies of this book are currently available." };
  }

  const { data: user } = await supabase.auth.getUser();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (input.dueInDays ?? 7));

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      student_id: input.studentId,
      book_id: input.bookId,
      due_date: dueDate.toISOString().slice(0, 10),
      scan_duration_ms: input.scanDurationMs,
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to record borrow transaction." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/books");
  return { ok: true, data };
}
