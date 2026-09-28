"use client";

import { useMemo, useState } from "react";
import { fmtMoney } from "@/components/ui";
import PrintDocument from "@/components/PrintDocument";
import PrintButton from "@/components/PrintButton";
import { tafqeetSAR } from "@/lib/tafqeet";

interface SettingsLite {
  companyName: string;
  address: string;
  crNumber: string;
  taxNumber: string;
  iban: string;
  bankName: string;
  vatRate: number;
}

export default function QuoteClient({ settings }: { settings: SettingsLite }) {
  const [clientName, setClientName] = useState("");
  const [carDesc, setCarDesc] = useState("");
  const [dailyPrice, setDailyPrice] = useState("");
  const [days, setDays] = useState("30");
  const [validDays, setValidDays] = useState("7");

  const subtotal = useMemo(() => (Number(dailyPrice) || 0) * (Number(days) || 0), [dailyPrice, days]);
  const vat = subtotal * settings.vatRate;
  const total = subtotal + vat;
  const today = new Date();
  const validUntil = new Date(today.getTime() + (Number(validDays) || 0) * 86400000);
  const quoteNo = `QT-${today.toISOString().slice(0, 10).replace(/-/g, "")}`;

  return (
    <div>
      <div className="no-print card p-5 mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">اسم العميل</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">وصف السيارة / الفئة</label>
          <input
            value={carDesc}
            onChange={(e) => setCarDesc(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="مثال: سيدان اقتصادية 2025"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">السعر اليومي (بدون ضريبة)</label>
          <input
            type="number"
            value={dailyPrice}
            onChange={(e) => setDailyPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">عدد الأيام</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">صلاحية العرض (أيام)</label>
          <input
            type="number"
            value={validDays}
            onChange={(e) => setValidDays(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <PrintDocument title="عرض سعر" settings={settings}>
        <PrintButton />
        <table className="w-full text-sm border-collapse mt-2">
          <tbody>
            <Row label="رقم العرض" value={quoteNo} />
            <Row label="التاريخ" value={new Intl.DateTimeFormat("ar-SA-u-ca-gregory").format(today)} />
            <Row label="ساري حتى" value={new Intl.DateTimeFormat("ar-SA-u-ca-gregory").format(validUntil)} />
            <Row label="العميل" value={clientName || "—"} />
            <Row label="السيارة / الفئة" value={carDesc || "—"} />
          </tbody>
        </table>

        <table className="w-full text-sm border-collapse mt-6">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="py-2 px-2 text-right">البيان</th>
              <th className="py-2 px-2 text-right">السعر اليومي</th>
              <th className="py-2 px-2 text-right">الأيام</th>
              <th className="py-2 px-2 text-right">الإجمالي قبل الضريبة</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 px-2">تأجير سيارة — {carDesc || "—"}</td>
              <td className="py-2 px-2">{fmtMoney(Number(dailyPrice) || 0)}</td>
              <td className="py-2 px-2">{days}</td>
              <td className="py-2 px-2">{fmtMoney(subtotal)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <table className="text-sm w-64">
            <tbody>
              <tr>
                <td className="py-1 text-slate-500">الإجمالي قبل الضريبة</td>
                <td className="py-1 text-left">{fmtMoney(subtotal)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">ضريبة القيمة المضافة</td>
                <td className="py-1 text-left">{fmtMoney(vat)}</td>
              </tr>
              <tr className="border-t font-bold text-[--color-navy]">
                <td className="py-2">الإجمالي شامل الضريبة</td>
                <td className="py-2 text-left">{fmtMoney(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">{tafqeetSAR(total)}</p>

        <p className="mt-8 text-xs text-slate-500 leading-6">
          هذا العرض غير ملزم للطرفين إلا بعد توقيع عقد إيجار رسمي، وهو ساري حتى التاريخ الموضح أعلاه.
        </p>
      </PrintDocument>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b">
      <td className="py-1.5 pl-4 text-slate-500 w-1/3">{label}</td>
      <td className="py-1.5 font-medium">{value}</td>
    </tr>
  );
}
