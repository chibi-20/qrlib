import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/database.types";
import { encodeBookCode, generateQrDataUrl } from "@/lib/qr";
import { PrintButton } from "@/app/(app)/print-button";

export default async function PrintAllBookQrPage() {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .order("title")
    .returns<Book[]>();

  const labels = await Promise.all(
    (books ?? []).map(async (book) => ({
      book,
      qrDataUrl: await generateQrDataUrl(encodeBookCode(book.book_code)),
    })),
  );

  return (
    <div className="space-y-4">
      <div className="print:hidden flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Print all book QR labels</h1>
        <PrintButton />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {labels.map(({ book, qrDataUrl }) => (
          <div
            key={book.id}
            className="rounded-lg border border-slate-200 bg-white p-4 text-center break-inside-avoid"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={book.title} className="mx-auto w-32" />
            <p className="mt-2 text-sm font-semibold text-slate-900">{book.title}</p>
            <p className="text-xs text-slate-500">{book.author ?? "Unknown author"}</p>
            <p className="font-mono text-[10px] text-slate-400">{book.book_code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
