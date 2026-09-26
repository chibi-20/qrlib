import Link from "next/link";
import { ImportPanel } from "../../import-panel";
import { importStudentsCsv } from "../actions";

const COLUMNS = [
  { name: "student_no", required: true, description: "Unique student ID number, encoded in the QR code", example: "STU-1001" },
  { name: "full_name", required: true, description: "Student's full name", example: "Juan Dela Cruz" },
  { name: "grade_level", required: true, description: "Grade level", example: "Grade 11" },
  { name: "section", required: true, description: "Section / strand", example: "STEM-A" },
];

export default function ImportStudentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Import students from CSV</h1>
        <Link href="/students" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Back to students
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">CSV format</h2>
        <p className="mt-1 text-sm text-slate-500">
          The first row must be a header row with these exact column names (case and spacing are
          flexible — e.g. &ldquo;Student No&rdquo; also works). Importing a{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">student_no</code> that already
          exists updates that student&apos;s record instead of creating a duplicate.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Column</th>
                <th className="px-3 py-2 font-medium">Required</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COLUMNS.map((col) => (
                <tr key={col.name}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{col.name}</td>
                  <td className="px-3 py-2 text-slate-600">{col.required ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-slate-600">{col.description}</td>
                  <td className="px-3 py-2 text-slate-500">{col.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ImportPanel action={importStudentsCsv} sampleHref="/samples/students-sample.csv" />
    </div>
  );
}
