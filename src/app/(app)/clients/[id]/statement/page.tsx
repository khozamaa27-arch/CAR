import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getAllContractsCalc } from "@/lib/data";
import { computeClient, todayForCalc, whatsappLink } from "@/lib/calc";
import { addDays, format } from "date-fns";
import { fmtMoney, fmtDate } from "@/components/ui";
import PrintDocument from "@/components/PrintDocument";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function ClientStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settings = await getSettings();
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const { contracts } = await getAllContractsCalc();
  const calc = computeClient(client, contracts);
  const mine = contracts.filter((c) => c.clientName === client.name && c.status !== "CLOSED");

  const today = todayForCalc(settings);
  const claimNo = `CLM-${format(today, "yyMMdd")}-${String(client.id).slice(-2)}`;
  const dueDate = addDays(today, settings.claimGraceDays);

  const waText = `السادة / ${client.name} المحترمين،\nمرفق كشف الحساب والمطالبة رقم ${claimNo} بتاريخ ${format(
    today,
    "yyyy/MM/dd"
  )}.\nالمبلغ المطلوب: ${fmtMoney(calc.balance)} ريال شامل الضريبة، نأمل السداد قبل ${format(
    dueDate,
    "yyyy/MM/dd"
  )}.\nIBAN: ${settings.iban} — ${settings.bankName}\nمع التحية — ${settings.companyName}`;

  const wa = whatsappLink(client.mobile, waText);

  return (
    <PrintDocument title="مطالبة مالية وكشف حساب" settings={settings}>
      <div className="no-print flex justify-end gap-2 mb-2">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-500 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-600"
          >
            💬 إرسال عبر واتساب
          </a>
        )}
      </div>
      <PrintButton />

      <table className="w-full text-sm border-collapse mt-2">
        <tbody>
          <Row label="العميل" value={client.name} />
          <Row label="الرقم الضريبي" value={client.taxNumber || "—"} />
          <Row label="رقم المطالبة" value={claimNo} />
          <Row label="التاريخ" value={fmtDate(today)} />
          <Row label="تاريخ الاستحقاق" value={fmtDate(dueDate)} />
        </tbody>
      </table>

      <table className="w-full text-sm border-collapse mt-6">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="py-2 px-2 text-right">العقد</th>
            <th className="py-2 px-2 text-right">اللوحة</th>
            <th className="py-2 px-2 text-right">المستحق</th>
            <th className="py-2 px-2 text-right">المسدد</th>
            <th className="py-2 px-2 text-right">الرصيد</th>
          </tr>
        </thead>
        <tbody>
          {mine.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2 px-2">{c.contractNo}</td>
              <td className="py-2 px-2">{c.plateText || "—"}</td>
              <td className="py-2 px-2">{fmtMoney(c.dueAmount)}</td>
              <td className="py-2 px-2">{fmtMoney(c.paidAmount)}</td>
              <td className="py-2 px-2 font-semibold">{fmtMoney(c.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 border-2 rounded-lg p-4 text-center" style={{ borderColor: "#0646B5" }}>
          <p className="text-xs text-slate-500">إجمالي المبلغ المطلوب</p>
          <p className="text-2xl font-bold text-[--color-navy]">{fmtMoney(calc.balance)} ريال</p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-7 whitespace-pre-line">{waText}</p>
    </PrintDocument>
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
