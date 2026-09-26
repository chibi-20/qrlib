"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

let idCounter = 0;

type Status = "idle" | "starting" | "running" | "error";

export function QrScanner({
  label,
  onScan,
}: {
  label: string;
  onScan: (value: string) => void;
}) {
  const [elementId] = useState(() => `qr-reader-${idCounter++}`);
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => scanner.clear());
      }
    };
  }, []);

  async function startCamera() {
    setStatus("starting");
    setErrorMsg(null);
    hasScannedRef.current = false;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(elementId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;
          scanner.pause(true);
          onScanRef.current(decodedText);
        },
        () => {
          // expected: fires every frame with no QR code in view
        },
      );
      setStatus("running");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div id={elementId} className="overflow-hidden rounded-lg bg-slate-100 [&_video]:rounded-lg" />

      {status !== "running" && (
        <button
          type="button"
          onClick={startCamera}
          disabled={status === "starting"}
          className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {status === "starting" ? "Requesting camera access…" : "Tap to start camera"}
        </button>
      )}

      {status === "error" && errorMsg && (
        <p className="text-xs text-red-600">
          Camera error: {errorMsg}. Make sure this site is allowed to use the camera in your
          browser&apos;s site settings, then try again — or use manual entry below.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = manualCode.trim();
          if (value) {
            setManualCode("");
            onScanRef.current(value);
          }
        }}
        className="flex gap-2"
      >
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Or type/paste the QR code value"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
