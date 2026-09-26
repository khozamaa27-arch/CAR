import { prisma } from "@/lib/prisma";
import { getAllContractsCalc } from "@/lib/data";
import { computeClient } from "@/lib/calc";
import { PageHeader, Badge, fmtMoney } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { contracts } = await getAllContractsCalc();
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  const rows = clients.map((c) => computeClient(c, contracts)).sort((a, b) => b.balance - a.balance);

  const TONE: Record<string, string> = {
    "🔴 تصعيد": "red",
    "🟠 إنذار": "orange",
    "🟡 تذكير": "amber",
    "🔵 رصيد مقدم": "blue",
    "🟢 منتظم": "green",
  };

  return (
    <div>
      <PageHeader title="العملاء" />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">العميل</th>
              <th className="py-2 px-3">النوع</th>
              <th className="py-2 px-3">الجوال</th>
              <th className="py-2 px-3">عقود مفتوحة</th>
              <th className="py-2 px-3">الإيجار الشهري</th>
              <th className="py-2 px-3">المستحق</th>
              <th className="py-2 px-3">المسدد</th>
              <th className="py-2 px-3">الرصيد</th>
              <th className="py-2 px-3">أقصى تأخير</th>
              <th className="py-2 px-3">نسبة التحصيل</th>
              <th className="py-2 px-3">الحالة</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-medium">{c.name}</td>
                <td className="py-2 px-3">{c.type || "—"}</td>
                <td className="py-2 px-3" dir="ltr">{c.mobile || "—"}</td>
                <td className="py-2 px-3">{c.openContracts}</td>
                <td className="py-2 px-3">{fmtMoney(c.monthlyRent)}</td>
                <td className="py-2 px-3">{fmtMoney(c.due)}</td>
                <td className="py-2 px-3">{fmtMoney(c.paid)}</td>
                <td className="py-2 px-3 font-semibold">{fmtMoney(c.balance)}</td>
                <td className="py-2 px-3">{c.maxOverdueDays}</td>
                <td className="py-2 px-3">{Math.round(c.collectionRate * 100)}%</td>
                <td className="py-2 px-3">
                  <Badge tone={TONE[c.status] || "slate"}>{c.status}</Badge>
                </td>
                <td className="py-2 px-3">
                  <Link href={`/clients/${c.id}/statement`} className="text-xs text-[--color-blue] hover:underline">
                    مطالبة ←
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
