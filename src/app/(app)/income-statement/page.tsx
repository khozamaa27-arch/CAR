import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { computeIncomeStatement, todayForCalc } from "@/lib/calc";
import { getPayrollMonthlyCostMap, getCompanyDocsMonthlyCost } from "@/lib/data";
import { PageHeader, Card, fmtMoney } from "@/components/ui";
import YearSelect from "./YearSelect";

export const dynamic = "force-dynamic";

export default async function IncomeStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const settings = await getSettings();
  const today = todayForCalc(settings);
  const year = yearParam ? Number(yearParam) : today.getFullYear();

  const [contracts, expenses, commitments, payrollMap, companyDocsMonthly] = await Promise.all([
    prisma.contract.findMany({ include: { client: true, car: true, receipts: true } }),
    prisma.expense.findMany(),
    prisma.commitment.findMany(),
    getPayrollMonthlyCostMap(),
    getCompanyDocsMonthlyCost(),
  ]);

  const rows = computeIncomeStatement(
    year,
    contracts,
    expenses,
    commitments,
    payrollMap,
    companyDocsMonthly,
    settings,
    today
  );

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = rows.reduce((s, r) => s + r.totalExpenses, 0);
  const totalNet = rows.reduce((s, r) => s + r.netProfit, 0);

  return (
    <div>
      <PageHeader title="قائمة الدخل الشهرية" actions={<YearSelect year={year} />} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="إجمالي الإيرادات" value={fmtMoney(totalRevenue)} tone="blue" />
        <Card title="إجمالي المصروفات" value={fmtMoney(totalExpenses)} tone="red" />
        <Card title="صافي الربح" value={fmtMoney(totalNet)} tone={totalNet >= 0 ? "green" : "red"} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-right text-slate-500 border-b bg-slate-50">
              <th className="py-2 px-3">الشهر</th>
              <th className="py-2 px-3">الإيرادات</th>
              <th className="py-2 px-3">مصروفات مباشرة</th>
              <th className="py-2 px-3">الالتزامات</th>
              <th className="py-2 px-3">الرواتب</th>
              <th className="py-2 px-3">مستندات الشركة</th>
              <th className="py-2 px-3">إجمالي المصروفات</th>
              <th className="py-2 px-3">صافي الربح</th>
              <th className="py-2 px-3">الهامش</th>
              <th className="py-2 px-3">التراكمي</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 font-medium">{r.label}</td>
                <td className="py-2 px-3">{fmtMoney(r.revenue)}</td>
                <td className="py-2 px-3">{fmtMoney(r.expenses)}</td>
                <td className="py-2 px-3">{fmtMoney(r.commitmentsCost)}</td>
                <td className="py-2 px-3">{fmtMoney(r.payrollCost)}</td>
                <td className="py-2 px-3">{fmtMoney(r.companyDocsCost)}</td>
                <td className="py-2 px-3">{fmtMoney(r.totalExpenses)}</td>
                <td className={`py-2 px-3 font-semibold ${r.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {fmtMoney(r.netProfit)}
                </td>
                <td className="py-2 px-3">{Math.round(r.margin * 100)}%</td>
                <td className="py-2 px-3">{fmtMoney(r.cumulative)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
