"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, fmtMoney } from "@/components/ui";

interface Row {
  id: string;
  empNo: string;
  name: string;
  basicSalary: number;
  overtimeHours: number;
  incentives: number;
  absenceDeduction: number;
  advances: number;
  penalties: number;
  grossPay: number;
  employeeGosi: number;
  employerGosi: number;
  overtimePay: number;
  totalEarned: number;
  totalDeductions: number;
  netPay: number;
}

export default function PayrollClient({ month, rows }: { month: string; rows: Row[] }) {
  const router = useRouter();
  const [monthValue, setMonthValue] = useState(month.slice(0, 7));
  const [generating, setGenerating] = useState(false);

  const totalNet = rows.reduce((s, r) => s + r.netPay, 0);
  const totalCost = rows.reduce((s, r) => s + r.netPay + r.employeeGosi + r.employerGosi, 0);

  function changeMonth(v: string) {
    setMonthValue(v);
    router.push(`/payroll?month=${v}-01`);
  }

  async function generate() {
    setGenerating(true);
    await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: `${monthValue}-01` }),
    });
    setGenerating(false);
    router.refresh();
  }

  async function updateField(id: string, field: string, value: string) {
    await fetch(`/api/payroll/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="مسير الرواتب الشهري"
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={monthValue}
              onChange={(e) => changeMonth(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={generate}
              disabled={generating}
              className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] disabled:opacity-60"
            >
              {generating ? "جارٍ..." : "توليد رواتب الشهر"}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4 flex justify-between items-center">
          <span className="text-sm text-slate-500">إجمالي صافي الرواتب</span>
          <span className="text-xl font-bold text-[--color-navy]">{fmtMoney(totalNet)}</span>
        </div>
        <div className="card p-4 flex justify-between items-center">
          <span className="text-sm text-slate-500">التكلفة الكاملة (شاملة التأمينات)</span>
          <span className="text-xl font-bold text-[--color-navy]">{fmtMoney(totalCost)}</span>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">الرقم الوظيفي</th>
              <th className="py-2 px-3">الاسم</th>
              <th className="py-2 px-3">الأساسي</th>
              <th className="py-2 px-3">ساعات إضافي</th>
              <th className="py-2 px-3">أجر الإضافي</th>
              <th className="py-2 px-3">حوافز</th>
              <th className="py-2 px-3">خصم غياب</th>
              <th className="py-2 px-3">سلف</th>
              <th className="py-2 px-3">جزاءات</th>
              <th className="py-2 px-3">تأمينات الموظف</th>
              <th className="py-2 px-3">صافي الراتب</th>
              <th className="py-2 px-3">تأمينات المنشأة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold">{r.empNo}</td>
                <td className="py-2 px-3">{r.name}</td>
                <td className="py-2 px-3">{fmtMoney(r.basicSalary)}</td>
                <td className="py-2 px-3">
                  <EditableCell
                    value={r.overtimeHours}
                    onSave={(v) => updateField(r.id, "overtimeHours", v)}
                  />
                </td>
                <td className="py-2 px-3">{fmtMoney(r.overtimePay)}</td>
                <td className="py-2 px-3">
                  <EditableCell value={r.incentives} onSave={(v) => updateField(r.id, "incentives", v)} />
                </td>
                <td className="py-2 px-3">
                  <EditableCell
                    value={r.absenceDeduction}
                    onSave={(v) => updateField(r.id, "absenceDeduction", v)}
                  />
                </td>
                <td className="py-2 px-3">
                  <EditableCell value={r.advances} onSave={(v) => updateField(r.id, "advances", v)} />
                </td>
                <td className="py-2 px-3">
                  <EditableCell value={r.penalties} onSave={(v) => updateField(r.id, "penalties", v)} />
                </td>
                <td className="py-2 px-3">{fmtMoney(r.employeeGosi)}</td>
                <td className="py-2 px-3 font-semibold">{fmtMoney(r.netPay)}</td>
                <td className="py-2 px-3">{fmtMoney(r.employerGosi)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400">
                  لا يوجد مسير رواتب لهذا الشهر — اضغط &quot;توليد رواتب الشهر&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditableCell({ value, onSave }: { value: number; onSave: (v: string) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <input
      type="number"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== String(value) && onSave(v)}
      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
    />
  );
}
