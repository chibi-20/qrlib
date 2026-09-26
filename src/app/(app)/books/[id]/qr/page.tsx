import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/database.types";
import { encodeBookCode, generateQrDataUrl } from "@/lib/qr";
import { PrintButton } from "@/app/(app)/print-button";

export default async function BookQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle<Book>();

  if (!book) notFound();

  const qrDataUrl = await generateQrDataUrl(encodeBookCode(book.book_code));

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div className="print:hidden flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Book QR label</h1>
        <PrintButton />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR code for ${book.title}`} className="mx-auto" />
        <p className="mt-3 text-lg font-semibold text-slate-900">{book.title}</p>
        <p className="text-sm text-slate-500">{book.author ?? "Unknown author"}</p>
        <p className="mt-1 font-mono text-xs text-slate-400">{book.book_code}</p>
      </div>
    </div>
  );
}
