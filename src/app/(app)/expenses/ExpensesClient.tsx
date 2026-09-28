"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, fmtMoney, fmtDate } from "@/components/ui";

interface ExpenseRow {
  id: string;
  date: Date;
  plate: string;
  type: string;
  vendor: string | null;
  invoiceNo: string | null;
  amountBeforeTax: number;
  taxable: boolean;
  vat: number;
  total: number;
  chargeTo: string;
}

export default function ExpensesClient({
  expenses,
  plates,
  expenseTypes,
  chargeToOptions,
}: {
  expenses: ExpenseRow[];
  plates: string[];
  expenseTypes: string[];
  chargeToOptions: string[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const total = expenses.reduce((s, e) => s + e.total, 0);

  return (
    <div>
      <PageHeader
        title="المصروفات"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
          >
            + مصروف جديد
          </button>
        }
      />

      <div className="card p-4 mb-4 flex justify-between items-center">
        <span className="text-sm text-slate-500">إجمالي المصروفات (شامل الضريبة)</span>
        <span className="text-xl font-bold text-[--color-navy]">{fmtMoney(total)}</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">التاريخ</th>
              <th className="py-2 px-3">اللوحة</th>
              <th className="py-2 px-3">النوع</th>
              <th className="py-2 px-3">المورد</th>
              <th className="py-2 px-3">قبل الضريبة</th>
              <th className="py-2 px-3">الضريبة</th>
              <th className="py-2 px-3">الإجمالي</th>
              <th className="py-2 px-3">يُحمّل على</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3">{fmtDate(e.date)}</td>
                <td className="py-2 px-3">{e.plate}</td>
                <td className="py-2 px-3">{e.type}</td>
                <td className="py-2 px-3">{e.vendor || "—"}</td>
                <td className="py-2 px-3">{fmtMoney(e.amountBeforeTax)}</td>
                <td className="py-2 px-3">{fmtMoney(e.vat)}</td>
                <td className="py-2 px-3 font-semibold">{fmtMoney(e.total)}</td>
                <td className="py-2 px-3">{e.chargeTo}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  لا توجد مصروفات مسجّلة بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddExpenseModal
          plates={plates}
          expenseTypes={expenseTypes}
          chargeToOptions={chargeToOptions}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AddExpenseModal({
  plates,
  expenseTypes,
  chargeToOptions,
  onClose,
  onCreated,
}: {
  plates: string[];
  expenseTypes: string[];
  chargeToOptions: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    plate: "",
    type: expenseTypes[0] || "",
    vendor: "",
    invoiceNo: "",
    amountBeforeTax: "",
    taxable: true,
    chargeTo: chargeToOptions[0] || "فرناس",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "تعذر حفظ المصروف");
      setLoading(false);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">مصروف جديد</h2>
        <form onSubmit={submit} className="space-y-3">
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
              <label className="block text-xs font-medium text-slate-600 mb-1">رقم اللوحة</label>
              <input
                required
                list="plates-list"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <datalist id="plates-list">
                {plates.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">نوع المصروف</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {expenseTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">المورد</label>
              <input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">رقم الفاتورة</label>
              <input
                value={form.invoiceNo}
                onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">المبلغ قبل الضريبة</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amountBeforeTax}
                onChange={(e) => setForm({ ...form, amountBeforeTax: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">خاضع للضريبة؟</label>
              <select
                value={form.taxable ? "yes" : "no"}
                onChange={(e) => setForm({ ...form, taxable: e.target.value === "yes" })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">يُحمّل على</label>
            <select
              value={form.chargeTo}
              onChange={(e) => setForm({ ...form, chargeTo: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {chargeToOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[--color-navy] text-white py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "جارٍ الحفظ..." : "حفظ"}
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
