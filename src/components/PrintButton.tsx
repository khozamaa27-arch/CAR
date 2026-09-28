"use client";

export default function PrintButton() {
  return (
    <div className="no-print flex justify-end mb-2">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
      >
        🖨️ طباعة / حفظ PDF
      </button>
    </div>
  );
}
