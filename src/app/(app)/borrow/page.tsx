import { BorrowFlow } from "./borrow-flow";

export default function BorrowPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Borrow a book</h1>
      <BorrowFlow />
    </div>
  );
}
