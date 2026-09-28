"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Badge, fmtMoney, WhatsAppButton } from "@/components/ui";

interface Row {
  id: string;
  empNo: string;
  name: string;
  jobTitle: string | null;
  nationality: string | null;
  mobile: string | null;
  basicSalary: number;
  hireDate: Date | null;
  yearsOfService: number;
  gratuity: number;
  leaveDays: number;
  nearestExpiryLabel: string;
  nearestExpiryDays: number | null;
  docStatus: string;
  status: string;
  whatsappUrl: string | null;
}

export default function EmployeesClient({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <PageHeader
        title="الموظفون"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
          >
            + موظف جديد
          </button>
        }
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">الرقم الوظيفي</th>
              <th className="py-2 px-3">الاسم</th>
              <th className="py-2 px-3">الوظيفة</th>
              <th className="py-2 px-3">الجنسية</th>
              <th className="py-2 px-3">الراتب الأساسي</th>
              <th className="py-2 px-3">سنوات الخدمة</th>
              <th className="py-2 px-3">مكافأة نهاية الخدمة</th>
              <th className="py-2 px-3">أيام الإجازة</th>
              <th className="py-2 px-3">أقرب انتهاء وثيقة</th>
              <th className="py-2 px-3">حالة الوثائق</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold">{e.empNo}</td>
                <td className="py-2 px-3">{e.name}</td>
                <td className="py-2 px-3">{e.jobTitle || "—"}</td>
                <td className="py-2 px-3">{e.nationality || "—"}</td>
                <td className="py-2 px-3">{fmtMoney(e.basicSalary)}</td>
                <td className="py-2 px-3">{e.yearsOfService}</td>
                <td className="py-2 px-3">{fmtMoney(e.gratuity)}</td>
                <td className="py-2 px-3">{e.leaveDays}</td>
                <td className="py-2 px-3">
                  {e.nearestExpiryLabel ? `${e.nearestExpiryLabel} (${e.nearestExpiryDays} يوم)` : "—"}
                </td>
                <td className="py-2 px-3">
                  <Badge tone={e.docStatus.includes("🔴") ? "red" : e.docStatus.includes("🟠") ? "orange" : e.docStatus.includes("🟡") ? "amber" : "green"}>
                    {e.docStatus}
                  </Badge>
                </td>
                <td className="py-2 px-3">
                  <WhatsAppButton url={e.whatsappUrl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddEmployeeModal
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

function AddEmployeeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    jobTitle: "",
    nationality: "غير سعودي",
    mobile: "",
    hireDate: "",
    basicSalary: "",
    housingAllowance: "",
    transportAllowance: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">موظف جديد</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">الاسم</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الوظيفة</label>
              <input
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الجنسية</label>
              <select
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="سعودي">سعودي</option>
                <option value="غير سعودي">غير سعودي</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الجوال</label>
              <input
                dir="ltr"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">تاريخ الالتحاق</label>
              <input
                type="date"
                value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الأساسي</label>
              <input
                type="number"
                value={form.basicSalary}
                onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">بدل السكن</label>
              <input
                type="number"
                value={form.housingAllowance}
                onChange={(e) => setForm({ ...form, housingAllowance: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">بدل النقل</label>
              <input
                type="number"
                value={form.transportAllowance}
                onChange={(e) => setForm({ ...form, transportAllowance: e.target.value })}
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
