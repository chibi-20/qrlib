"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5QrcodeScanner } from "html5-qrcode";

let idCounter = 0;

export function QrScanner({
  label,
  onScan,
}: {
  label: string;
  onScan: (value: string) => void;
}) {
  const [elementId] = useState(() => `qr-reader-${idCounter++}`);
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const hasScannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let cancelled = false;
    hasScannedRef.current = false;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (cancelled) return;
      const scanner = new Html5QrcodeScanner(
        elementId,
        { fps: 10, qrbox: 220, rememberLastUsedCamera: true },
        false,
      );
      scannerRef.current = scanner;
      scanner.render(
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
    }).catch((err) => {
      setCameraError(err instanceof Error ? err.message : String(err));
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [elementId]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div id={elementId} className="overflow-hidden rounded-lg [&_video]:rounded-lg" />
      {cameraError && (
        <p className="text-xs text-red-600">
          Camera unavailable ({cameraError}). Use manual entry below.
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
