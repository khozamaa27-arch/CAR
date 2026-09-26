"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ContractCalc } from "@/lib/calc";
import { PageHeader, Badge, fmtMoney, fmtDate, WhatsAppButton } from "@/components/ui";

const FIN_TONE: Record<string, string> = { "متأخر": "red", "رصيد مقدم": "blue", "مسدد": "green" };

function financialBadge(status: string) {
  return <Badge tone={FIN_TONE[status] || "slate"}>{status}</Badge>;
}

export default function ContractsClient({
  contracts,
  canEdit,
  clientNames,
  plates,
}: {
  contracts: ContractCalc[];
  canEdit: boolean;
  clientNames: string[];
  plates: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<string>("مفتوح");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    let list = contracts;
    if (statusFilter !== "الكل") list = list.filter((c) => c.statusLabel === statusFilter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          String(c.contractNo).includes(s) ||
          c.clientName.toLowerCase().includes(s) ||
          (c.driverName || "").toLowerCase().includes(s) ||
          (c.mobile || "").includes(s) ||
          c.plateText.toLowerCase().includes(s)
      );
    }
    return [...list].sort((a, b) => b.priorityRank - a.priorityRank || b.overdueDays - a.overdueDays);
  }, [contracts, statusFilter, q]);

  async function closeContract(id: string) {
    if (!confirm("هل تريد إغلاق هذا العقد اليوم؟")) return;
    await fetch(`/api/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED", closeDate: new Date().toISOString() }),
    });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="العقود"
        actions={
          canEdit && (
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
            >
              + عقد جديد
            </button>
          )
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث برقم العقد / العميل / السائق / الجوال / اللوحة"
          className="flex-1 min-w-[240px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="الكل">كل الحالات</option>
          <option value="مفتوح">مفتوح</option>
          <option value="مغلق">مغلق</option>
          <option value="معلق">معلق</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">العقد</th>
              <th className="py-2 px-3">العميل</th>
              <th className="py-2 px-3">السائق</th>
              <th className="py-2 px-3">الجوال</th>
              <th className="py-2 px-3">اللوحة</th>
              <th className="py-2 px-3">البدء</th>
              <th className="py-2 px-3">السعر اليومي</th>
              <th className="py-2 px-3">الحالة</th>
              <th className="py-2 px-3">الأيام</th>
              <th className="py-2 px-3">المستحق</th>
              <th className="py-2 px-3">المسدد</th>
              <th className="py-2 px-3">المتبقي</th>
              <th className="py-2 px-3">الوضع</th>
              <th className="py-2 px-3">الأولوية</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-[--color-blue]">
                  <Link href={`/contracts/${c.id}/print`}>{c.contractNo}</Link>
                </td>
                <td className="py-2 px-3">{c.clientName}</td>
                <td className="py-2 px-3">{c.driverName || "—"}</td>
                <td className="py-2 px-3" dir="ltr">{c.mobile || "—"}</td>
                <td className="py-2 px-3">{c.plateText || "—"}</td>
                <td className="py-2 px-3">{fmtDate(c.startDate)}</td>
                <td className="py-2 px-3">{fmtMoney(c.dailyPrice)}</td>
                <td className="py-2 px-3">{c.statusLabel}</td>
                <td className="py-2 px-3">{c.days}</td>
                <td className="py-2 px-3">{fmtMoney(c.dueAmount)}</td>
                <td className="py-2 px-3">{fmtMoney(c.paidAmount)}</td>
                <td className="py-2 px-3 font-semibold">{fmtMoney(c.balance)}</td>
                <td className="py-2 px-3">{financialBadge(c.financialStatus)}</td>
                <td className="py-2 px-3">{c.priority}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <WhatsAppButton url={c.whatsappUrl} />
                    {canEdit && c.status === "OPEN" && (
                      <button
                        onClick={() => closeContract(c.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        إغلاق
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={15} className="py-8 text-center text-slate-400">
                  لا توجد نتائج
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddContractModal
          clientNames={clientNames}
          plates={plates}
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

function AddContractModal({
  clientNames,
  plates,
  onClose,
  onCreated,
}: {
  clientNames: string[];
  plates: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    clientName: "",
    driverName: "",
    mobile: "",
    plate: "",
    startDate: new Date().toISOString().slice(0, 10),
    dailyPrice: "",
    additions: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "تعذر إنشاء العقد");
      setLoading(false);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">عقد جديد</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">العميل</label>
            <input
              required
              list="clients-list"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <datalist id="clients-list">
              {clientNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">السائق / المستخدم</label>
              <input
                value={form.driverName}
                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الجوال</label>
              <input
                dir="ltr"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">رقم اللوحة</label>
            <input
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">تاريخ البدء</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">السعر اليومي</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.dailyPrice}
                onChange={(e) => setForm({ ...form, dailyPrice: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">إضافات</label>
              <input
                type="number"
                step="0.01"
                value={form.additions}
                onChange={(e) => setForm({ ...form, additions: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[--color-navy] text-white py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "جارٍ الحفظ..." : "حفظ العقد"}
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
