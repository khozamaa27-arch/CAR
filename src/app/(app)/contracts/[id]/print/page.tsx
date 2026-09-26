import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { computeContract } from "@/lib/calc";
import { fmtMoney, fmtDate } from "@/components/ui";
import PrintDocument from "@/components/PrintDocument";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function ContractPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settings = await getSettings();
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { client: true, car: true, receipts: true },
  });
  if (!contract) notFound();
  const calc = computeContract(contract, settings);

  return (
    <PrintDocument title={`عقد إيجار رقم ${calc.contractNo}`} settings={settings}>
      <PrintButton />
      <table className="w-full text-sm border-collapse mt-4">
        <tbody>
          <Row label="رقم العقد" value={String(calc.contractNo)} />
          <Row label="العميل" value={calc.clientName} />
          <Row label="السائق / المستخدم" value={calc.driverName || "—"} />
          <Row label="جوال التواصل" value={calc.mobile || "—"} />
          <Row label="رقم اللوحة" value={calc.plateText || "—"} />
          <Row label="مالك السيارة" value={calc.ownerText} />
          <Row label="تاريخ البدء" value={fmtDate(calc.startDate)} />
          <Row label="السعر اليومي (بدون ضريبة)" value={`${fmtMoney(calc.dailyPrice)} ريال`} />
          <Row label="حالة العقد" value={calc.statusLabel} />
          <Row label="عدد الأيام حتى تاريخ الاحتساب" value={String(calc.days)} />
          <Row label="المستحق شامل الضريبة" value={`${fmtMoney(calc.dueAmount)} ريال`} />
          <Row label="المسدد" value={`${fmtMoney(calc.paidAmount)} ريال`} />
          <Row label="المتبقي" value={`${fmtMoney(calc.balance)} ريال`} />
        </tbody>
      </table>

      <p className="mt-8 text-xs text-slate-500 leading-6">
        يقر الطرفان بالالتزام بشروط تأجير السيارة المذكورة أعلاه وسداد المستحقات في مواعيدها، وتخضع هذه
        الاتفاقية لأنظمة المملكة العربية السعودية.
      </p>

      <div className="grid grid-cols-2 gap-8 mt-16 text-sm">
        <div>
          <p className="border-t border-slate-400 pt-2 text-center">توقيع المؤجر (فرناس)</p>
        </div>
        <div>
          <p className="border-t border-slate-400 pt-2 text-center">توقيع المستأجر</p>
        </div>
      </div>
    </PrintDocument>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b">
      <td className="py-2 pl-4 text-slate-500 w-1/3">{label}</td>
      <td className="py-2 font-medium">{value}</td>
    </tr>
  );
}
