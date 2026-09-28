import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getAllContractsCalc } from "@/lib/data";
import { whatsappLink } from "@/lib/calc";
import { fmtMoney, fmtDate } from "@/components/ui";
import PrintDocument from "@/components/PrintDocument";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function StatementRequestPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settings = await getSettings();
  const sr = await prisma.statementRequest.findUnique({ where: { id } });
  if (!sr) notFound();

  const { contracts } = await getAllContractsCalc();
  const nos: number[] = JSON.parse(sr.contractNosJson);
  const items = nos
    .map((no) => contracts.find((c) => c.contractNo === no))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const totalOverdue = items.reduce((s, c) => s + Math.max(0, c.balance), 0);
  const employeeMobile = items[0]?.mobile; // احتياطي فقط، الأصل جوال الموظف من الإعدادات
  const message = `الأخ / ${sr.toEmployee} — نرجو الإفادة عن العقود التالية (${items.length} عقداً، إجمالي المتأخر ${fmtMoney(
    totalOverdue
  )} ريال): هل سدد العميل؟ هل أُغلق العقد؟ هل تم التواصل؟ وما الإجراء المتخذ؟ مع الرد قبل ${fmtDate(sr.replyBy)}.`;

  const wa = whatsappLink(employeeMobile, message);

  return (
    <PrintDocument title={`طلب إفادة ${sr.requestNo}`} settings={settings}>
      <div className="no-print flex justify-end gap-2 mb-2">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-500 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-600"
          >
            💬 فتح واتساب الموظف
          </a>
        )}
      </div>
      <PrintButton />

      <table className="w-full text-sm border-collapse mt-2">
        <tbody>
          <Row label="موجّه إلى" value={sr.toEmployee} />
          <Row label="طريقة الاختيار" value={sr.selectionMethod} />
          <Row label="التاريخ" value={fmtDate(sr.date)} />
          <Row label="الرد قبل" value={fmtDate(sr.replyBy)} />
        </tbody>
      </table>

      <p className="mt-6 text-sm leading-7">{message}</p>

      <table className="w-full text-sm border-collapse mt-6">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="py-2 px-2 text-right">#</th>
            <th className="py-2 px-2 text-right">العقد</th>
            <th className="py-2 px-2 text-right">العميل</th>
            <th className="py-2 px-2 text-right">اللوحة</th>
            <th className="py-2 px-2 text-right">المتأخر</th>
            <th className="py-2 px-2 text-right">هل سدد؟</th>
            <th className="py-2 px-2 text-right">هل أُغلق؟</th>
            <th className="py-2 px-2 text-right">الإجراء</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c, i) => (
            <tr key={c.id} className="border-b">
              <td className="py-2 px-2">{i + 1}</td>
              <td className="py-2 px-2">{c.contractNo}</td>
              <td className="py-2 px-2">
                {c.clientName} {c.driverName && c.driverName !== c.clientName ? `/ ${c.driverName}` : ""}
              </td>
              <td className="py-2 px-2">{c.plateText || "—"}</td>
              <td className="py-2 px-2 font-semibold">{fmtMoney(c.balance)}</td>
              <td className="py-2 px-2">☐</td>
              <td className="py-2 px-2">☐</td>
              <td className="py-2 px-2"></td>
            </tr>
          ))}
        </tbody>
      </table>
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
