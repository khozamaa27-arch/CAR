import { prisma } from "./prisma";
import { getSettings } from "./settings";
import { computeContract, computeCar, computePayroll, type ContractCalc, type ContractWithRelations, type CarCalc } from "./calc";
import { format } from "date-fns";

export async function getAllContractsCalc(): Promise<{
  contracts: ContractCalc[];
  raw: ContractWithRelations[];
  settings: Awaited<ReturnType<typeof getSettings>>;
}> {
  const settings = await getSettings();
  const raw = await prisma.contract.findMany({
    include: { client: true, car: true, receipts: true },
    orderBy: { contractNo: "asc" },
  });
  const contracts = raw.map((c) => computeContract(c, settings));
  return { contracts, raw, settings };
}

export async function getAllCarsCalc(): Promise<{ cars: CarCalc[]; contracts: ContractCalc[] }> {
  const { contracts, settings } = await getAllContractsCalc();
  const [cars, expenses] = await Promise.all([
    prisma.car.findMany({ orderBy: { plate: "asc" } }),
    prisma.expense.findMany(),
  ]);
  const today = settings.calcDateOverride ?? new Date();
  const carsCalc = cars.map((c) => computeCar(c, contracts, expenses, today));
  return { cars: carsCalc, contracts };
}

/** خريطة التكلفة الشهرية الكاملة للرواتب (صافي + تأمينات المنشأة) لكل شهر yyyy-MM */
export async function getPayrollMonthlyCostMap(): Promise<Map<string, number>> {
  const payrolls = await prisma.payroll.findMany({ include: { employee: true } });
  const map = new Map<string, number>();
  for (const p of payrolls) {
    const key = format(p.month, "yyyy-MM");
    const result = computePayroll({
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
    const totalCost = result.netPay + result.employeeGosi + result.employerGosi;
    map.set(key, (map.get(key) || 0) + totalCost);
  }
  return map;
}

export async function getCompanyDocsMonthlyCost(): Promise<number> {
  const docs = await prisma.companyDocument.findMany();
  return docs.reduce((s, d) => s + (d.fees && d.renewalCycleMonths ? d.fees / d.renewalCycleMonths : 0), 0);
}
