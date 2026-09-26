"use client";

import { useEffect, useRef, useState } from "react";
import { QrScanner } from "../qr-scanner";
import { createBorrowTransaction, lookupBookByQr, lookupStudentByQr } from "./actions";
import type { Book, Student } from "@/lib/database.types";

type Step = "student" | "book" | "confirm" | "done";

export function BorrowFlow() {
  const [step, setStep] = useState<Step>("student");
  const [student, setStudent] = useState<Student | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  function resetAll() {
    setStep("student");
    setStudent(null);
    setBook(null);
    setError(null);
    setScannerKey((k) => k + 1);
    startTimeRef.current = Date.now();
  }

  async function handleStudentScan(raw: string) {
    setError(null);
    const result = await lookupStudentByQr(raw);
    if (!result.ok) {
      setError(result.error);
      setScannerKey((k) => k + 1);
      return;
    }
    setStudent(result.data);
    setStep("book");
  }

  async function handleBookScan(raw: string) {
    setError(null);
    const result = await lookupBookByQr(raw);
    if (!result.ok) {
      setError(result.error);
      setScannerKey((k) => k + 1);
      return;
    }
    setBook(result.data);
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!student || !book) return;
    setPending(true);
    setError(null);
    const scanDurationMs = Date.now() - startTimeRef.current;
    const result = await createBorrowTransaction({
      studentId: student.id,
      bookId: book.id,
      scanDurationMs,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep("done");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <ol className="flex justify-between text-xs font-medium text-slate-400">
        {(["student", "book", "confirm"] as Step[]).map((s, i) => (
          <li
            key={s}
            className={
              step === s || (step === "done" && s === "confirm")
                ? "text-slate-900"
                : undefined
            }
          >
            {i + 1}. {s === "student" ? "Scan student" : s === "book" ? "Scan book" : "Confirm"}
          </li>
        ))}
      </ol>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {step === "student" && (
        <QrScanner key={scannerKey} label="Scan the student's QR ID" onScan={handleStudentScan} />
      )}

      {step === "book" && student && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <span className="font-medium text-slate-900">{student.full_name}</span>{" "}
            <span className="text-slate-500">
              · {student.grade_level} {student.section}
            </span>
          </div>
          <QrScanner key={scannerKey} label="Now scan the book's QR label" onScan={handleBookScan} />
        </div>
      )}

      {step === "confirm" && student && book && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm text-slate-500">Student</p>
            <p className="font-medium text-slate-900">{student.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Book</p>
            <p className="font-medium text-slate-900">{book.title}</p>
            <p className="text-xs text-slate-500">
              {book.available_copies} of {book.total_copies} copies available
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={handleConfirm}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Confirm borrow"}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "done" && student && book && (
        <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-lg font-semibold text-green-800">Borrow recorded</p>
          <p className="text-sm text-green-700">
            {student.full_name} borrowed &ldquo;{book.title}&rdquo;.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Scan next student
          </button>
        </div>
      )}
    </div>
  );
}
