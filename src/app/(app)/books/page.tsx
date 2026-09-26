import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/database.types";
import { createBook, deleteBook } from "./actions";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Book[]>();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Books</h1>
        <Link
          href="/books/print"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Print all QR labels
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Add book</h2>
        <form action={createBook} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
          <input
            name="book_code"
            placeholder="Book code (e.g. BK-0005)"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="title"
            placeholder="Title"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="author"
            placeholder="Author"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="total_copies"
            type="number"
            min={1}
            defaultValue={1}
            placeholder="Copies"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add
          </button>
        </form>
        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(books ?? []).map((book) => (
              <tr key={book.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{book.book_code}</td>
                <td className="px-4 py-3 text-slate-900">{book.title}</td>
                <td className="px-4 py-3 text-slate-600">{book.author ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {book.available_copies} / {book.total_copies}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/books/${book.id}/qr`} className="text-slate-600 hover:text-slate-900">
                      QR
                    </Link>
                    <Link
                      href={`/books/${book.id}/edit`}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </Link>
                    <form action={deleteBook.bind(null, book.id)}>
                      <button type="submit" className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(books ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No books yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
