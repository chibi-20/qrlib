import { ReturnFlow } from "./return-flow";

export default function ReturnPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Return a book</h1>
      <ReturnFlow />
    </div>
  );
}
