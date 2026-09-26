"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LookupResult } from "../borrow/actions";
import type { Student, Transaction } from "@/lib/database.types";

export type OpenBorrow = Transaction & { student: Student };

export async function listOpenBorrowsForBook(bookId: string): Promise<OpenBorrow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, student:students(*)")
    .eq("book_id", bookId)
    .in("status", ["borrowed", "overdue"])
    .order("borrowed_at", { ascending: true })
    .returns<OpenBorrow[]>();

  return data ?? [];
}

export async function completeReturn(
  transactionId: string,
  scanDurationMs: number,
): Promise<LookupResult<{ id: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .update({
      status: "returned",
      returned_at: new Date().toISOString(),
      scan_duration_ms: scanDurationMs,
    })
    .eq("id", transactionId)
    .in("status", ["borrowed", "overdue"])
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "This item was already returned." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/books");
  return { ok: true, data };
}
