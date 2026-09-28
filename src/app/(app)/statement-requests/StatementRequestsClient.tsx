"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, fmtDate } from "@/components/ui";

interface ReqRow {
  id: string;
  requestNo: string;
  toEmployee: string;
  selectionMethod: string;
  date: Date;
  replyBy: Date | null;
  count: number;
}

export default function StatementRequestsClient({
  requests,
  employees,
  methods,
  clientNames,
}: {
  requests: ReqRow[];
  employees: string[];
  methods: string[];
  clientNames: string[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <PageHeader
        title="طلب إفادة ومتابعة عقود"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[--color-blue] text-white px-4 py-2 text-sm font-semibold hover:bg-[--color-navy] transition-colors"
          >
            + طلب جديد
          </button>
        }
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">رقم الطلب</th>
              <th className="py-2 px-3">موجّه إلى</th>
              <th className="py-2 px-3">طريقة الاختيار</th>
              <th className="py-2 px-3">عدد العقود</th>
              <th className="py-2 px-3">التاريخ</th>
              <th className="py-2 px-3">الرد قبل</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-[--color-blue]">{r.requestNo}</td>
                <td className="py-2 px-3">{r.toEmployee}</td>
                <td className="py-2 px-3">{r.selectionMethod}</td>
                <td className="py-2 px-3">{r.count}</td>
                <td className="py-2 px-3">{fmtDate(r.date)}</td>
                <td className="py-2 px-3">{fmtDate(r.replyBy)}</td>
                <td className="py-2 px-3">
                  <Link href={`/statement-requests/${r.id}/print`} className="text-xs text-[--color-blue] hover:underline">
                    عرض / طباعة
                  </Link>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  لا توجد طلبات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddRequestModal
          employees={employees}
          methods={methods}
          clientNames={clientNames}
          onClose={() => setShowAdd(false)}
          onCreated={(id) => {
            setShowAdd(false);
            router.push(`/statement-requests/${id}/print`);
          }}
        />
      )}
    </div>
  );
}

function AddRequestModal({
  employees,
  methods,
  clientNames,
  onClose,
  onCreated,
}: {
  employees: string[];
  methods: string[];
  clientNames: string[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [toEmployee, setToEmployee] = useState(employees[0] || "");
  const [selectionMethod, setSelectionMethod] = useState(methods[0] || "كل المتأخرين");
  const [clientName, setClientName] = useState("");
  const [contractNos, setContractNos] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/statement-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toEmployee,
        selectionMethod,
        clientName,
        contractNos: contractNos.split(/[,\s]+/).filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "تعذر إنشاء الطلب");
      setLoading(false);
      return;
    }
    onCreated(data.id);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-[--color-navy] mb-4">طلب إفادة جديد</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">موجّه إلى</label>
            <select
              value={toEmployee}
              onChange={(e) => setToEmployee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {employees.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">طريقة الاختيار</label>
            <select
              value={selectionMethod}
              onChange={(e) => setSelectionMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {selectionMethod === "كل عقود عميل" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">العميل</label>
              <input
                list="clients-list"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <datalist id="clients-list">
                {clientNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          )}
          {selectionMethod === "أرقام محددة (القائمة الجانبية)" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">أرقام العقود (مفصولة بفاصلة)</label>
              <input
                value={contractNos}
                onChange={(e) => setContractNos(e.target.value)}
                placeholder="4, 6, 8"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[--color-navy] text-white py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "جارٍ الإنشاء..." : "إنشاء الطلب"}
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
