"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/database.types";
import type { ImportResult } from "@/lib/csv-import";

export async function createBook(formData: FormData) {
  const supabase = await createClient();
  const totalCopies = Math.max(1, Number(formData.get("total_copies") ?? 1));

  const { error } = await supabase.from("books").insert({
    book_code: String(formData.get("book_code") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim() || null,
    total_copies: totalCopies,
    available_copies: totalCopies,
  });

  if (error) {
    redirect(`/books?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/books");
  redirect("/books");
}

export async function updateBook(id: string, formData: FormData) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("books")
    .select("total_copies, available_copies")
    .eq("id", id)
    .maybeSingle<Pick<Book, "total_copies" | "available_copies">>();

  if (!existing) {
    redirect(`/books?error=${encodeURIComponent("Book not found")}`);
  }

  const newTotal = Math.max(1, Number(formData.get("total_copies") ?? existing.total_copies));
  const copiesOut = existing.total_copies - existing.available_copies;
  const newAvailable = Math.max(0, newTotal - copiesOut);

  const { error } = await supabase
    .from("books")
    .update({
      book_code: String(formData.get("book_code") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      author: String(formData.get("author") ?? "").trim() || null,
      total_copies: newTotal,
      available_copies: newAvailable,
    })
    .eq("id", id);

  if (error) {
    redirect(`/books/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/books");
  redirect("/books");
}

export async function deleteBook(id: string) {
  const supabase = await createClient();
  await supabase.from("books").delete().eq("id", id);
  revalidatePath("/books");
}

export async function importBooksCsv(formData: FormData): Promise<ImportResult> {
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
  const rowsByBookCode = new Map<
    string,
    { book_code: string; title: string; author: string | null; total_copies: number }
  >();

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 2;
    const bookCode = (raw.book_code ?? "").trim();
    const title = (raw.title ?? "").trim();
    const author = (raw.author ?? "").trim();
    const totalCopiesRaw = (raw.total_copies ?? "").trim();

    if (!bookCode || !title) {
      const missing = [!bookCode && "book_code", !title && "title"].filter(Boolean).join(", ");
      errors.push({ row: rowNumber, reason: `Missing ${missing}` });
      return;
    }

    let totalCopies = 1;
    if (totalCopiesRaw) {
      const parsedCopies = Number(totalCopiesRaw);
      if (!Number.isInteger(parsedCopies) || parsedCopies < 1) {
        errors.push({ row: rowNumber, reason: `Invalid total_copies "${totalCopiesRaw}"` });
        return;
      }
      totalCopies = parsedCopies;
    }

    if (rowsByBookCode.has(bookCode)) {
      errors.push({ row: rowNumber, reason: `Duplicate book_code "${bookCode}" in file (later row used)` });
    }
    rowsByBookCode.set(bookCode, { book_code: bookCode, title, author: author || null, total_copies: totalCopies });
  });

  let imported = 0;

  if (rowsByBookCode.size > 0) {
    const supabase = await createClient();
    const codes = Array.from(rowsByBookCode.keys());
    const { data: existingBooks } = await supabase
      .from("books")
      .select("book_code, total_copies, available_copies")
      .in("book_code", codes)
      .returns<Pick<Book, "book_code" | "total_copies" | "available_copies">[]>();

    const existingByCode = new Map((existingBooks ?? []).map((b) => [b.book_code, b]));

    const upsertRows = Array.from(rowsByBookCode.values()).map((row) => {
      const existing = existingByCode.get(row.book_code);
      if (!existing) {
        return { ...row, available_copies: row.total_copies };
      }
      const copiesOut = existing.total_copies - existing.available_copies;
      const available_copies = Math.max(0, row.total_copies - copiesOut);
      return { ...row, available_copies };
    });

    const { error, count } = await supabase
      .from("books")
      .upsert(upsertRows, { onConflict: "book_code", count: "exact" });

    if (error) {
      errors.push({ row: 0, reason: `Database error: ${error.message}` });
    } else {
      imported = count ?? upsertRows.length;
    }
  }

  revalidatePath("/books");
  return { totalRows: parsed.data.length, imported, errors };
}
