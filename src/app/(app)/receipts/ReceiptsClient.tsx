"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, fmtMoney, fmtDate, Badge } from "@/components/ui";

interface ReceiptRow {
  id: string;
  receiptNo: string;
  date: Date;
  contractNo: number;
  clientName: string;
  plateText: string | null;
  amount: number;
  method: string | null;
  type: "OPENING" | "PAYMENT";
  receivedFrom: string | null;
  taxInvoiceNo: string | null;
}

export default function ReceiptsClient({
  receipts,
  contractOptions,
  paymentMethods,
}: {
  receipts: ReceiptRow[];
  contractOptions: { contractNo: number; label: string }[];
  paymentMethods: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return receipts;
    const s = q.trim().toLowerCase();
    return receipts.filter(
      (r) =>
        r.receiptNo.toLowerCase().includes(s) ||
        String(r.contractNo).includes(s) ||
        r.clientName.toLowerCase().includes(s)
    );
  }, [receipts, q]);

  return (
    <div>
      <PageHeader
        title="سندات القبض"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
          >
            + سند جديد
          </button>
        }
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث برقم السند / العقد / العميل"
        className="w-full mb-4 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">رقم السند</th>
              <th className="py-2 px-3">التاريخ</th>
              <th className="py-2 px-3">العقد</th>
              <th className="py-2 px-3">العميل</th>
              <th className="py-2 px-3">اللوحة</th>
              <th className="py-2 px-3">المبلغ</th>
              <th className="py-2 px-3">الطريقة</th>
              <th className="py-2 px-3">النوع</th>
              <th className="py-2 px-3">الفاتورة الضريبية</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-[--color-blue]">{r.receiptNo}</td>
                <td className="py-2 px-3">{fmtDate(r.date)}</td>
                <td className="py-2 px-3">{r.contractNo}</td>
                <td className="py-2 px-3">{r.clientName}</td>
                <td className="py-2 px-3">{r.plateText || "—"}</td>
                <td className="py-2 px-3 font-semibold">{fmtMoney(r.amount)}</td>
                <td className="py-2 px-3">{r.method || "—"}</td>
                <td className="py-2 px-3">
                  <Badge tone={r.type === "OPENING" ? "slate" : "green"}>
                    {r.type === "OPENING" ? "افتتاحي" : "دفعة"}
                  </Badge>
                </td>
                <td className="py-2 px-3">{r.taxInvoiceNo || "—"}</td>
                <td className="py-2 px-3">
                  <Link href={`/receipts/${r.id}/print`} className="text-xs text-[--color-blue] hover:underline">
                    طباعة
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  لا توجد نتائج
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddReceiptModal
          contractOptions={contractOptions}
          paymentMethods={paymentMethods}
          onClose={() => setShowAdd(false)}
          onCreated={(id) => {
            setShowAdd(false);
            router.push(`/receipts/${id}/print`);
          }}
        />
      )}
    </div>
  );
}

function AddReceiptModal({
  contractOptions,
  paymentMethods,
  onClose,
  onCreated,
}: {
  contractOptions: { contractNo: number; label: string }[];
  paymentMethods: string[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [form, setForm] = useState({
    contractNo: "",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    method: paymentMethods[0] || "",
    bankRef: "",
    receivedFrom: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "تعذر إنشاء السند");
      setLoading(false);
      return;
    }
    onCreated(data.id);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">سند قبض جديد</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">اختر العقد (رقم أو اسم)</label>
            <input
              required
              list="contracts-list"
              value={form.contractNo}
              onChange={(e) => setForm({ ...form, contractNo: e.target.value.split(" ")[0] })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="مثال: 4"
            />
            <datalist id="contracts-list">
              {contractOptions.map((c) => (
                <option key={c.contractNo} value={String(c.contractNo)}>
                  {c.label}
                </option>
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">التاريخ</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">المبلغ</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">طريقة الدفع</label>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">المرجع البنكي / ملاحظات</label>
            <input
              value={form.bankRef}
              onChange={(e) => setForm({ ...form, bankRef: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">استلمنا من</label>
            <input
              value={form.receivedFrom}
              onChange={(e) => setForm({ ...form, receivedFrom: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[--color-navy] text-white py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "جارٍ الحفظ..." : "حفظ وطباعة"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
