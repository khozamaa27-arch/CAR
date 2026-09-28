import { prisma } from "@/lib/prisma";
import { computePayroll } from "@/lib/calc";
import { startOfMonth } from "date-fns";
import PayrollClient from "./PayrollClient";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = startOfMonth(monthParam ? new Date(monthParam) : new Date());

  const payrolls = await prisma.payroll.findMany({
    where: { month },
    include: { employee: true },
    orderBy: { employee: { empNo: "asc" } },
  });

  const rows = payrolls.map((p) => {
    const calc = computePayroll({
      basicSalary: p.employee.basicSalary,
      housingAllowance: p.employee.housingAllowance,
      transportAllowance: p.employee.transportAllowance,
      otherAllowances: p.employee.otherAllowances,
      isSaudi: p.employee.isSaudi,
      overtimeHours: p.overtimeHours,
      incentives: p.incentives,
      absenceDeduction: p.absenceDeduction,
      advances: p.advances,
      penalties: p.penalties,
    });
    return {
      id: p.id,
      empNo: p.employee.empNo,
      name: p.employee.name,
      basicSalary: p.employee.basicSalary,
      overtimeHours: p.overtimeHours,
      incentives: p.incentives,
      absenceDeduction: p.absenceDeduction,
      advances: p.advances,
      penalties: p.penalties,
      ...calc,
    };
  });

  return <PayrollClient month={month.toISOString().slice(0, 10)} rows={rows} />;
}
