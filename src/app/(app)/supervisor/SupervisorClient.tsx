"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContractCalc } from "@/lib/calc";
import { PageHeader, Card, fmtMoney, fmtDate, WhatsAppButton } from "@/components/ui";

export default function SupervisorClient({
  contracts,
  counts,
  followUpResults,
}: {
  contracts: ContractCalc[];
  counts: { escalation: number; warning: number; reminder: number; missingData: number };
  followUpResults: string[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="صفحة المشرف — قائمة المتابعة اليومية" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="🔴 تصعيد" value={counts.escalation} tone="red" />
        <Card title="🟠 إنذار" value={counts.warning} tone="amber" />
        <Card title="🟡 تذكير" value={counts.reminder} tone="amber" />
        <Card title="بيانات ناقصة" value={counts.missingData} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">الأولوية</th>
              <th className="py-2 px-3">السائق</th>
              <th className="py-2 px-3">العميل</th>
              <th className="py-2 px-3">الجوال</th>
              <th className="py-2 px-3">اللوحة</th>
              <th className="py-2 px-3">مدفوع حتى</th>
              <th className="py-2 px-3">أيام غير مسددة</th>
              <th className="py-2 px-3">المطلوب</th>
              <th className="py-2 px-3">ملاحظات المتابعة</th>
              <th className="py-2 px-3">آخر متابعة</th>
              <th className="py-2 px-3">النتيجة</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3">{c.priority}</td>
                <td className="py-2 px-3">{c.driverName || "—"}</td>
                <td className="py-2 px-3">{c.clientName}</td>
                <td className="py-2 px-3" dir="ltr">{c.mobile || "—"}</td>
                <td className="py-2 px-3">{c.plateText || "—"}</td>
                <td className="py-2 px-3">{fmtDate(c.paidUntilDate)}</td>
                <td className="py-2 px-3">{c.overdueDays}</td>
                <td className="py-2 px-3 font-semibold">{c.balance > 0 ? fmtMoney(c.balance) : "—"}</td>
                <td className="py-2 px-3 max-w-[180px] truncate">{c.followUpNotes || "—"}</td>
                <td className="py-2 px-3">{fmtDate(c.lastFollowUpDate)}</td>
                <td className="py-2 px-3">{c.followUpResult || "—"}</td>
                <td className="py-2 px-3 flex items-center gap-1.5">
                  <WhatsAppButton url={c.whatsappUrl} />
                  <button
                    onClick={() => setEditingId(c.id)}
                    className="text-xs text-[--color-blue] hover:underline"
                  >
                    تحديث
                  </button>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400">
                  لا توجد عقود للمتابعة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <FollowUpModal
          id={editingId}
          followUpResults={followUpResults}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function FollowUpModal({
  id,
  followUpResults,
  onClose,
  onSaved,
}: {
  id: string;
  followUpResults: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(followUpResults[0] || "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await fetch(`/api/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpNotes: notes, followUpResult: result }),
    });
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">تسجيل نتيجة المتابعة</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">النتيجة</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {followUpResults.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ملاحظات المتابعة</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={save}
              disabled={loading}
              className="flex-1 rounded-lg bg-[--color-navy] text-white py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "جارٍ الحفظ..." : "حفظ"}
            </button>
            <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
