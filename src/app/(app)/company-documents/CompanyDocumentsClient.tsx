"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Badge, fmtMoney, fmtDate } from "@/components/ui";

interface Row {
  id: string;
  name: string;
  authority: string | null;
  number: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  renewalCycleMonths: number | null;
  fees: number | null;
  daysLeft: number | null;
  status: string;
  stopsTransportLicense: boolean;
  responsible: string | null;
  notes: string | null;
}

export default function CompanyDocumentsClient({
  rows,
  transportAtRisk,
}: {
  rows: Row[];
  transportAtRisk: boolean;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <PageHeader
        title="مستندات الشركة والتراخيص"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
          >
            + مستند جديد
          </button>
        }
      />

      {transportAtRisk && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
          ⛔ ترخيص تأجير السيارات معرّض للتعليق — يوجد مستند مرتبط منتهٍ.
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">المستند</th>
              <th className="py-2 px-3">الجهة</th>
              <th className="py-2 px-3">الرقم</th>
              <th className="py-2 px-3">الانتهاء</th>
              <th className="py-2 px-3">الرسوم</th>
              <th className="py-2 px-3">يوقف الترخيص؟</th>
              <th className="py-2 px-3">الحالة</th>
              <th className="py-2 px-3">المسؤول</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-medium">{d.name}</td>
                <td className="py-2 px-3">{d.authority || "—"}</td>
                <td className="py-2 px-3">{d.number || "—"}</td>
                <td className="py-2 px-3">
                  {fmtDate(d.expiryDate)}
                  {d.daysLeft !== null && (
                    <span className="text-xs text-slate-400 mr-1">
                      ({d.daysLeft < 0 ? `متأخر ${-d.daysLeft} يوم` : `بعد ${d.daysLeft} يوم`})
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">{d.fees ? fmtMoney(d.fees) : "—"}</td>
                <td className="py-2 px-3">{d.stopsTransportLicense ? "نعم" : "لا"}</td>
                <td className="py-2 px-3">
                  <Badge tone={d.status.includes("🔴") ? "red" : d.status.includes("🟠") ? "orange" : d.status.includes("🟡") ? "amber" : "green"}>
                    {d.status}
                  </Badge>
                </td>
                <td className="py-2 px-3">{d.responsible || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddDocModal
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

function AddDocModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    authority: "",
    number: "",
    issueDate: "",
    expiryDate: "",
    renewalCycleMonths: "12",
    fees: "",
    stopsTransportLicense: false,
    responsible: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/company-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">مستند جديد</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">المستند / الالتزام</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الجهة</label>
              <input
                value={form.authority}
                onChange={(e) => setForm({ ...form, authority: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الرقم</label>
              <input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">تاريخ الإصدار</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">تاريخ الانتهاء</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الرسوم</label>
              <input
                type="number"
                value={form.fees}
                onChange={(e) => setForm({ ...form, fees: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={form.stopsTransportLicense}
                onChange={(e) => setForm({ ...form, stopsTransportLicense: e.target.checked })}
              />
              <label className="text-xs font-medium text-slate-600">يوقف ترخيص النقل؟</label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">المسؤول</label>
            <input
              value={form.responsible}
              onChange={(e) => setForm({ ...form, responsible: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
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
