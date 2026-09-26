"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/database.types";

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
