"use client";

import { useEffect, useRef, useState } from "react";
import { QrScanner } from "../qr-scanner";
import { decodeQr } from "@/lib/qr";
import { lookupBookByQr } from "../borrow/actions";
import { completeReturn, listOpenBorrowsForBook } from "./actions";
import type { OpenBorrow } from "./actions";
import type { Book } from "@/lib/database.types";

type Step = "book" | "pick" | "confirm" | "done";

export function ReturnFlow() {
  const [step, setStep] = useState<Step>("book");
  const [book, setBook] = useState<Book | null>(null);
  const [openBorrows, setOpenBorrows] = useState<OpenBorrow[]>([]);
  const [selected, setSelected] = useState<OpenBorrow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  function resetAll() {
    setStep("book");
    setBook(null);
    setOpenBorrows([]);
    setSelected(null);
    setError(null);
    setScannerKey((k) => k + 1);
    startTimeRef.current = Date.now();
  }

  async function handleBookScan(raw: string) {
    setError(null);
    const result = await lookupBookByQr(raw);
    if (!result.ok) {
      setError(result.error);
      setScannerKey((k) => k + 1);
      return;
    }
    const borrows = await listOpenBorrowsForBook(result.data.id);
    if (borrows.length === 0) {
      setError(`No copies of "${result.data.title}" are currently borrowed.`);
      setScannerKey((k) => k + 1);
      return;
    }
    setBook(result.data);
    setOpenBorrows(borrows);
    if (borrows.length === 1) {
      setSelected(borrows[0]);
      setStep("confirm");
    } else {
      setStep("pick");
    }
  }

  function handleStudentMatchScan(raw: string) {
    const decoded = decodeQr(raw);
    if (!decoded || decoded.type !== "student") {
      setError("That doesn't look like a student QR ID.");
      setScannerKey((k) => k + 1);
      return;
    }
    const match = openBorrows.find((b) => b.student.student_no === decoded.code);
    if (!match) {
      setError("That student doesn't currently have this book borrowed.");
      setScannerKey((k) => k + 1);
      return;
    }
    setSelected(match);
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!selected) return;
    setPending(true);
    setError(null);
    const scanDurationMs = Date.now() - startTimeRef.current;
    const result = await completeReturn(selected.id, scanDurationMs);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep("done");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {step === "book" && (
        <QrScanner key={scannerKey} label="Scan the book's QR label" onScan={handleBookScan} />
      )}

      {step === "pick" && book && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <span className="font-medium text-slate-900">{book.title}</span>{" "}
            <span className="text-slate-500">has {openBorrows.length} copies currently out</span>
          </div>
          <QrScanner
            key={scannerKey}
            label="Scan the student's QR ID to match automatically (optional)"
            onScan={handleStudentMatchScan}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Or pick manually:</p>
            {openBorrows.map((borrow) => (
              <button
                key={borrow.id}
                type="button"
                onClick={() => {
                  setSelected(borrow);
                  setStep("confirm");
                }}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="font-medium text-slate-900">{borrow.student.full_name}</span>{" "}
                  <span className="text-slate-500">
                    · {borrow.student.grade_level} {borrow.student.section}
                  </span>
                </span>
                <span className="text-xs text-slate-400">
                  due {new Date(borrow.due_date).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "confirm" && book && selected && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm text-slate-500">Book</p>
            <p className="font-medium text-slate-900">{book.title}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Borrowed by</p>
            <p className="font-medium text-slate-900">{selected.student.full_name}</p>
            <p className="text-xs text-slate-500">
              Borrowed {new Date(selected.borrowed_at).toLocaleDateString()} · due{" "}
              {new Date(selected.due_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={handleConfirm}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Confirm return"}
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

      {step === "done" && book && selected && (
        <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-lg font-semibold text-green-800">Return recorded</p>
          <p className="text-sm text-green-700">
            {selected.student.full_name} returned &ldquo;{book.title}&rdquo;.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Scan next book
          </button>
        </div>
      )}
    </div>
  );
}
