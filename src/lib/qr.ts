import QRCode from "qrcode";

export async function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

// QR payloads are prefixed by type so the scanner can tell a student ID
// apart from a book code, and reject unrelated QR codes cleanly.
export function encodeStudentCode(studentNo: string): string {
  return `LIBQR:STUDENT:${studentNo}`;
}

export function encodeBookCode(bookCode: string): string {
  return `LIBQR:BOOK:${bookCode}`;
}

export type DecodedQr =
  | { type: "student"; code: string }
  | { type: "book"; code: string };

export function decodeQr(raw: string): DecodedQr | null {
  const match = raw.trim().match(/^LIBQR:(STUDENT|BOOK):(.+)$/);
  if (!match) return null;
  const [, type, code] = match;
  return type === "STUDENT" ? { type: "student", code } : { type: "book", code };
}
