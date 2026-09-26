import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { tafqeetSAR } from "@/lib/tafqeet";
import { fmtMoney, fmtDate } from "@/components/ui";
import PrintDocument from "@/components/PrintDocument";
import PrintButton from "@/components/PrintButton";
import InvoiceNoField from "./InvoiceNoField";

export const dynamic = "force-dynamic";

export default async function ReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settings = await getSettings();
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { contract: { include: { client: true } } },
  });
  if (!receipt) notFound();

  return (
    <PrintDocument title={`سند قبض ${receipt.receiptNo}`} settings={settings}>
      <PrintButton />
      <table className="w-full text-sm border-collapse mt-4">
        <tbody>
          <Row label="رقم السند" value={receipt.receiptNo} />
          <Row label="التاريخ" value={fmtDate(receipt.date)} />
          <Row label="رقم العقد" value={String(receipt.contract.contractNo)} />
          <Row label="استلمنا من" value={receipt.receivedFrom || receipt.contract.client.name} />
          <Row label="اللوحة" value={receipt.contract.plateText || "—"} />
        </tbody>
      </table>

      <div className="mt-6 border-2 rounded-lg p-4" style={{ borderColor: "#0646B5" }}>
        <p className="text-xs text-slate-500 mb-1">المبلغ</p>
        <p className="text-2xl font-bold text-[--color-navy]">{fmtMoney(receipt.amount)} ريال سعودي</p>
        <p className="text-sm text-slate-600 mt-2">{tafqeetSAR(receipt.amount)}</p>
      </div>

      <table className="w-full text-sm border-collapse mt-4">
        <tbody>
          <Row label="طريقة الدفع" value={receipt.method || "—"} />
          <Row label="المرجع البنكي / ملاحظات" value={receipt.bankRef || "—"} />
        </tbody>
      </table>

      <InvoiceNoField id={receipt.id} value={receipt.taxInvoiceNo} />

      <p className="mt-6 text-[11px] text-slate-400">
        تصدر الفاتورة الضريبية لهذا السند من نظامنا المرتبط بهيئة الزكاة والضريبة والجمارك فور تسجيل رقمها.
      </p>

      <div className="grid grid-cols-2 gap-8 mt-16 text-sm">
        <div>
          <p className="border-t border-slate-400 pt-2 text-center">توقيع المستلم</p>
        </div>
        <div>
          <p className="border-t border-slate-400 pt-2 text-center">ختم الشركة</p>
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
