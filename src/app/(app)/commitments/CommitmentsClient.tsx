"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Badge, fmtMoney, WhatsAppButton } from "@/components/ui";
import { whatsappLink } from "@/lib/calc";

interface Row {
  id: string;
  item: string;
  category: string;
  vendor: string | null;
  periodicity: string;
  paymentAmount: number | null;
  paidSoFar: number;
  monthlyCost: number;
  responsible: string | null;
  responsiblePhone: string | null;
  status: string;
  notes: string | null;
}

export default function CommitmentsClient({ rows, categories }: { rows: Row[]; categories: string[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const totalMonthly = rows.reduce((s, r) => s + r.monthlyCost, 0);

  return (
    <div>
      <PageHeader
        title="الالتزامات الدورية"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
          >
            + التزام جديد
          </button>
        }
      />

      <div className="card p-4 mb-4 flex justify-between items-center">
        <span className="text-sm text-slate-500">إجمالي التكلفة الشهرية للالتزامات</span>
        <span className="text-xl font-bold text-[--color-navy]">{fmtMoney(totalMonthly)}</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">البند</th>
              <th className="py-2 px-3">الفئة</th>
              <th className="py-2 px-3">الجهة</th>
              <th className="py-2 px-3">الدورية</th>
              <th className="py-2 px-3">قيمة الدفعة</th>
              <th className="py-2 px-3">التكلفة الشهرية</th>
              <th className="py-2 px-3">المسؤول</th>
              <th className="py-2 px-3">الحالة</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const wa = whatsappLink(r.responsiblePhone, `فرناس: متابعة التزام "${r.item}"`);
              return (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium">{r.item}</td>
                  <td className="py-2 px-3">{r.category}</td>
                  <td className="py-2 px-3">{r.vendor || "—"}</td>
                  <td className="py-2 px-3">{r.periodicity}</td>
                  <td className="py-2 px-3">{r.paymentAmount ? fmtMoney(r.paymentAmount) : "—"}</td>
                  <td className="py-2 px-3">{fmtMoney(r.monthlyCost)}</td>
                  <td className="py-2 px-3">{r.responsible || "—"}</td>
                  <td className="py-2 px-3">
                    <Badge tone={r.status.includes("🟡") ? "amber" : "green"}>{r.status}</Badge>
                  </td>
                  <td className="py-2 px-3">
                    <WhatsAppButton url={wa} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddCommitmentModal
          categories={categories}
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

function AddCommitmentModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    item: "",
    category: categories[0] || "أخرى",
    vendor: "",
    periodicity: "شهري",
    paymentAmount: "",
    responsible: "",
    responsiblePhone: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/commitments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">التزام جديد</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">البند</label>
            <input
              required
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">الفئة</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الجهة / المؤجر</label>
              <input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الدورية</label>
              <select
                value={form.periodicity}
                onChange={(e) => setForm({ ...form, periodicity: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="شهري">شهري</option>
                <option value="ربع سنوي">ربع سنوي</option>
                <option value="نصف سنوي">نصف سنوي</option>
                <option value="سنوي">سنوي</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">قيمة الدفعة</label>
            <input
              type="number"
              step="0.01"
              value={form.paymentAmount}
              onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">المسؤول</label>
              <input
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">جوال المسؤول</label>
              <input
                dir="ltr"
                value={form.responsiblePhone}
                onChange={(e) => setForm({ ...form, responsiblePhone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
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
