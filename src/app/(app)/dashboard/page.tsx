import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import {
  getAllContractsCalc,
  getAllCarsCalc,
  getPayrollMonthlyCostMap,
  getCompanyDocsMonthlyCost,
} from "@/lib/data";
import { computeDashboard, computeIncomeStatement, todayForCalc } from "@/lib/calc";
import { Card, PageHeader, Badge, fmtMoney, fmtDate, WhatsAppButton } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const settings = await getSettings();
  const today = todayForCalc(settings);
  const { contracts, raw } = await getAllContractsCalc();
  const { cars } = await getAllCarsCalc();
  const [companyDocs, employees, expenses, commitments] = await Promise.all([
    prisma.companyDocument.findMany(),
    prisma.employee.findMany(),
    prisma.expense.findMany(),
    prisma.commitment.findMany(),
  ]);
  const payrollMap = await getPayrollMonthlyCostMap();
  const companyDocsMonthly = await getCompanyDocsMonthlyCost();

  const incomeStatement = computeIncomeStatement(
    today.getFullYear(),
    raw,
    expenses,
    commitments,
    payrollMap,
    companyDocsMonthly,
    settings,
    today
  );

  const dash = computeDashboard(
    contracts,
    cars,
    companyDocs,
    employees,
    settings.monthlyTargetManual,
    incomeStatement,
    today
  );

  const expiringDocs = companyDocs
    .filter((d) => d.expiryDate && (d.expiryDate.getTime() - today.getTime()) / 86400000 <= 30)
    .sort((a, b) => (a.expiryDate!.getTime() - b.expiryDate!.getTime()));

  return (
    <div>
      <PageHeader
        title="لوحة الإدارة"
        actions={
          <span className="text-xs text-slate-500">
            شركة فرناس المستقبل المحدودة · {settings.branch} · تاريخ الاحتساب {fmtDate(today)}
          </span>
        }
      />

      {dash.transportLicenseAtRisk && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
          ⛔ تنبيه: يوجد مستند منتهٍ يوقف ترخيص هيئة النقل — راجع مستندات الشركة فوراً.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="العقود المفتوحة" value={dash.openContractsCount} />
        <Card title="الهدف الشهري (شامل الضريبة)" value={fmtMoney(dash.monthlyTarget)} />
        <Card title="المحصّل هذا الشهر" value={fmtMoney(dash.collectedThisMonth)} tone="blue" />
        <Card
          title="نسبة تحقيق الهدف"
          value={`${Math.round(dash.targetAchievementRate * 100)}%`}
          tone={dash.targetAchievementRate >= 1 ? "green" : "amber"}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="إجمالي المتأخرات على العملاء" value={fmtMoney(dash.totalOverdue)} tone="red" />
        <Card title="عقود متأخرة" value={dash.overdueContractsCount} tone="amber" />
        <Card title="أرصدة مقدمة لصالح العملاء" value={fmtMoney(dash.advanceBalances)} tone="blue" />
        <Card title="صافي الذمم" value={fmtMoney(dash.netReceivables)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="الأسطول" value={dash.fleetTotal} sub={`مؤجرة ${dash.fleetRented} · جاهزة ${dash.fleetReady} · صيانة ${dash.fleetMaintenance}`} />
        <Card title="صافي ربح الشهر" value={fmtMoney(dash.netProfitMonth)} tone={dash.netProfitMonth >= 0 ? "green" : "red"} />
        <Card title="صافي الربح منذ بداية السنة" value={fmtMoney(dash.netProfitYTD)} tone={dash.netProfitYTD >= 0 ? "green" : "red"} />
        <Card title="مستندات وإقامات قريبة الانتهاء" value={dash.expiringDocsCount + dash.expiringIqamasCount} tone="amber" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-bold text-[--color-navy] mb-3">أعلى 10 متأخرين</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-slate-500 border-b">
                  <th className="py-2 px-2">العقد</th>
                  <th className="py-2 px-2">العميل</th>
                  <th className="py-2 px-2">المتأخر</th>
                  <th className="py-2 px-2">أيام</th>
                  <th className="py-2 px-2">الأولوية</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {dash.top10Overdue.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-2">
                      <Link href={`/contracts?q=${c.contractNo}`} className="text-[--color-blue] font-medium">
                        {c.contractNo}
                      </Link>
                    </td>
                    <td className="py-2 px-2">{c.clientName}</td>
                    <td className="py-2 px-2 font-semibold text-red-600">{fmtMoney(c.balance)}</td>
                    <td className="py-2 px-2">{c.overdueDays}</td>
                    <td className="py-2 px-2">{c.priority}</td>
                    <td className="py-2 px-2"><WhatsAppButton url={c.whatsappUrl} /></td>
                  </tr>
                ))}
                {dash.top10Overdue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      لا توجد عقود متأخرة 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-bold text-[--color-navy] mb-3">مستندات وإقامات تقترب من الانتهاء</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-slate-500 border-b">
                  <th className="py-2 px-2">المستند</th>
                  <th className="py-2 px-2">الانتهاء</th>
                  <th className="py-2 px-2">يوقف الترخيص؟</th>
                </tr>
              </thead>
              <tbody>
                {expiringDocs.slice(0, 10).map((doc) => {
                  const days = Math.round((doc.expiryDate!.getTime() - today.getTime()) / 86400000);
                  return (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 px-2">{doc.name}</td>
                      <td className="py-2 px-2">
                        {fmtDate(doc.expiryDate)}{" "}
                        <Badge tone={days < 0 ? "red" : days <= 30 ? "amber" : "green"}>
                          {days < 0 ? `منتهٍ منذ ${-days} يوم` : `بعد ${days} يوم`}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">{doc.stopsTransportLicense ? "نعم" : "لا"}</td>
                    </tr>
                  );
                })}
                {expiringDocs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      لا توجد مستندات قريبة الانتهاء
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
