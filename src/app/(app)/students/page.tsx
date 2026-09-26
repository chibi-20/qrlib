import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/database.types";
import { createStudent, deleteStudent } from "./actions";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Student[]>();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Students</h1>
        <Link
          href="/students/print"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Print all QR IDs
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Add student</h2>
        <form action={createStudent} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            name="student_no"
            placeholder="Student No. (e.g. STU-0005)"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="full_name"
            placeholder="Full name"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="grade_level"
            placeholder="Grade level"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="section"
            placeholder="Section"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="col-span-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:col-span-1"
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
              <th className="px-4 py-3 font-medium">Student No.</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(students ?? []).map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">
                  {student.student_no}
                </td>
                <td className="px-4 py-3 text-slate-900">{student.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{student.grade_level}</td>
                <td className="px-4 py-3 text-slate-600">{student.section}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/students/${student.id}/qr`}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      QR
                    </Link>
                    <Link
                      href={`/students/${student.id}/edit`}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </Link>
                    <form action={deleteStudent.bind(null, student.id)}>
                      <button type="submit" className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(students ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No students yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
