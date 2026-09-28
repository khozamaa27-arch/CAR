"use client";

import { useState } from "react";

export default function InvoiceNoField({ id, value }: { id: string; value: string | null }) {
  const [v, setV] = useState(value || "");
  const [saved, setSaved] = useState(true);

  async function save() {
    await fetch(`/api/receipts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taxInvoiceNo: v }),
    });
    setSaved(true);
  }

  return (
    <div className="no-print mt-3 flex items-center gap-2">
      <label className="text-xs text-slate-600">رقم الفاتورة الضريبية (بعد الإصدار من النظام)</label>
      <input
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          setSaved(false);
        }}
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
      />
      <button
        onClick={save}
        disabled={saved}
        className="text-xs rounded-md bg-[--color-blue] text-white px-3 py-1 disabled:opacity-40"
      >
        حفظ
      </button>
    </div>
  );
}
