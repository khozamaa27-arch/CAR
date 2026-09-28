"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CarCalc } from "@/lib/calc";
import { PageHeader, Badge, fmtMoney } from "@/components/ui";

const STATUS_TONE: Record<string, string> = {
  "مؤجرة": "blue",
  "جاهزة": "green",
  "صيانة": "amber",
  "متوقفة": "slate",
};

export default function CarsClient({
  cars,
  owners,
  statuses,
}: {
  cars: CarCalc[];
  owners: string[];
  statuses: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return cars;
    const s = q.trim().toLowerCase();
    return cars.filter(
      (c) =>
        c.plate.toLowerCase().includes(s) ||
        (c.brand || "").toLowerCase().includes(s) ||
        (c.currentClient || "").toLowerCase().includes(s)
    );
  }, [cars, q]);

  return (
    <div>
      <PageHeader
        title="السيارات"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
          >
            + سيارة جديدة
          </button>
        }
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث باللوحة / الماركة / العميل الحالي"
        className="w-full mb-4 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">اللوحة</th>
              <th className="py-2 px-3">الماركة / الطراز</th>
              <th className="py-2 px-3">المالك</th>
              <th className="py-2 px-3">اليومي</th>
              <th className="py-2 px-3">الحالة</th>
              <th className="py-2 px-3">العميل الحالي</th>
              <th className="py-2 px-3">الإيراد</th>
              <th className="py-2 px-3">المحصّل</th>
              <th className="py-2 px-3">المصروفات</th>
              <th className="py-2 px-3">صافي الربح</th>
              <th className="py-2 px-3">الوثائق</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold">{c.plate}</td>
                <td className="py-2 px-3">{[c.brand, c.model].filter(Boolean).join(" ") || "—"}</td>
                <td className="py-2 px-3">{c.owner || "—"}</td>
                <td className="py-2 px-3">{fmtMoney(c.dailyPrice)}</td>
                <td className="py-2 px-3">
                  <Badge tone={STATUS_TONE[c.actualStatus] || "slate"}>{c.actualStatus}</Badge>
                </td>
                <td className="py-2 px-3">{c.currentClient || "—"}</td>
                <td className="py-2 px-3">{fmtMoney(c.revenue)}</td>
                <td className="py-2 px-3">{fmtMoney(c.collected)}</td>
                <td className="py-2 px-3">{fmtMoney(c.expenses)}</td>
                <td className="py-2 px-3 font-semibold">{fmtMoney(c.netProfit)}</td>
                <td className="py-2 px-3">
                  <Badge tone={c.docAlert.includes("🔴") ? "red" : c.docAlert.includes("🟠") ? "orange" : c.docAlert.includes("🟡") ? "amber" : "green"}>
                    {c.docAlert}
                  </Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  لا توجد نتائج
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddCarModal
          owners={owners}
          statuses={statuses}
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

function AddCarModal({
  owners,
  statuses,
  onClose,
  onCreated,
}: {
  owners: string[];
  statuses: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    plate: "",
    brand: "",
    model: "",
    year: "",
    owner: owners[0] || "",
    dailyPrice: "",
    manualStatus: statuses[0] || "جاهزة",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "تعذر إنشاء السيارة");
      setLoading(false);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">سيارة جديدة</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">رقم اللوحة</label>
              <input
                required
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">المالك</label>
              <select
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {owners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الماركة</label>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الطراز</label>
              <input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الموديل</label>
              <input
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">السعر اليومي</label>
              <input
                type="number"
                step="0.01"
                value={form.dailyPrice}
                onChange={(e) => setForm({ ...form, dailyPrice: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الحالة اليدوية</label>
              <select
                value={form.manualStatus}
                onChange={(e) => setForm({ ...form, manualStatus: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
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
