import {
  startOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  differenceInCalendarDays,
  format,
} from "date-fns";
import type { Contract, Receipt, Client, Car, Expense, Settings, Employee } from "@prisma/client";

// ===================== أدوات مساعدة عامة =====================

export function todayForCalc(settings: Pick<Settings, "calcDateOverride">): Date {
  return startOfDay(settings.calcDateOverride ?? new Date());
}

function d(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  return startOfDay(typeof date === "string" ? new Date(date) : date);
}

// ===================== العقود =====================

export type ContractWithRelations = Contract & {
  client: Client;
  car: Car | null;
  receipts: Receipt[];
};

export interface ContractCalc {
  id: string;
  contractNo: number;
  clientName: string;
  driverName: string | null;
  mobile: string | null;
  plateText: string;
  ownerText: string;
  startDate: Date;
  dailyPrice: number;
  status: "OPEN" | "CLOSED" | "SUSPENDED";
  statusLabel: string;
  closeDate: Date | null;
  followUpNotes: string | null;
  additions: number;
  days: number;
  dueAmount: number;
  paidAmount: number;
  balance: number;
  financialStatus: "متأخر" | "رصيد مقدم" | "مسدد";
  overdueDays: number;
  paidUntilDate: Date | null;
  priority: string;
  priorityRank: number;
  monthlyRent: number;
  dueThisMonth: number;
  dataAlert: string;
  lastFollowUpDate: Date | null;
  followUpResult: string | null;
  whatsappUrl: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "مفتوح",
  CLOSED: "مغلق",
  SUSPENDED: "معلق",
};

export function computeContract(
  c: ContractWithRelations,
  settings: Pick<Settings, "vatRate" | "daysInMonth" | "escalationDays" | "warningDays" | "calcDateOverride">
): ContractCalc {
  const today = todayForCalc(settings);
  const vat = settings.vatRate;
  const start = d(c.startDate)!;
  const close = d(c.closeDate);
  const effectiveEnd = c.status === "CLOSED" && close ? close : today;

  const days =
    c.status === "SUSPENDED" ? 0 : Math.max(0, differenceInCalendarDays(effectiveEnd, start));

  const dueAmount = round2(c.dailyPrice * days * (1 + vat) + (c.additions || 0));
  const paidAmount = round2(c.receipts.reduce((s, r) => s + r.amount, 0));
  const balance = round2(dueAmount - paidAmount);

  const financialStatus: ContractCalc["financialStatus"] =
    balance > 0.5 ? "متأخر" : balance < -0.5 ? "رصيد مقدم" : "مسدد";

  const dailyIncVat = c.dailyPrice * (1 + vat);
  const overdueDays =
    balance > 0.5 && c.dailyPrice > 0 ? Math.ceil(balance / dailyIncVat) : 0;

  const paidUntilDate =
    c.dailyPrice > 0 ? addDays(start, Math.floor(paidAmount / dailyIncVat)) : null;

  let priority: string;
  let priorityRank: number;
  if (c.status === "CLOSED") {
    priority = "⚪ مغلق";
    priorityRank = 0;
  } else if (overdueDays > settings.escalationDays) {
    priority = "🔴 تصعيد";
    priorityRank = 4;
  } else if (overdueDays > settings.warningDays) {
    priority = "🟠 إنذار";
    priorityRank = 3;
  } else if (overdueDays > 0) {
    priority = "🟡 تذكير";
    priorityRank = 2;
  } else {
    priority = "🟢 منتظم";
    priorityRank = 1;
  }

  const monthlyRent = c.status === "OPEN" ? round2(c.dailyPrice * settings.daysInMonth * (1 + vat)) : 0;

  const prevMonthEnd = addDays(startOfMonth(today), -1);
  const dueThisMonthBase =
    c.status === "SUSPENDED"
      ? 0
      : Math.max(0, differenceInCalendarDays(effectiveEnd, start > prevMonthEnd ? start : prevMonthEnd));
  const dueThisMonth = round2(dailyIncVat * dueThisMonthBase);

  let dataAlert = "";
  if (!c.mobile) dataAlert = "جوال ناقص";
  else if (!c.plateText) dataAlert = "السيارة غير مسجلة";
  else if (c.status === "SUSPENDED") dataAlert = "عقد معلق";

  const cleanMobile = (c.mobile || "").replace(/[\s-]/g, "");
  const local9 = cleanMobile.slice(-9);
  const whatsappUrl =
    local9.length === 9
      ? `https://wa.me/966${local9}?text=${encodeURIComponent(
          `فرناس: تذكير بسداد العقد رقم ${c.contractNo}`
        )}`
      : null;

  return {
    id: c.id,
    contractNo: c.contractNo,
    clientName: c.client.name,
    driverName: c.driverName,
    mobile: c.mobile,
    plateText: c.plateText || c.car?.plate || "",
    ownerText: c.car?.owner || "يُحدد",
    startDate: start,
    dailyPrice: c.dailyPrice,
    status: c.status,
    statusLabel: STATUS_LABELS[c.status],
    closeDate: close,
    followUpNotes: c.followUpNotes,
    additions: c.additions || 0,
    days,
    dueAmount,
    paidAmount,
    balance,
    financialStatus,
    overdueDays,
    paidUntilDate,
    priority,
    priorityRank,
    monthlyRent,
    dueThisMonth,
    dataAlert,
    lastFollowUpDate: d(c.lastFollowUpDate),
    followUpResult: c.followUpResult,
    whatsappUrl,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ===================== العملاء =====================

export interface ClientCalc {
  id: string;
  name: string;
  type: string | null;
  taxNumber: string | null;
  mobile: string | null;
  email: string | null;
  openContracts: number;
  monthlyRent: number;
  due: number;
  paid: number;
  balance: number;
  maxOverdueDays: number;
  collectionRate: number;
  status: string;
}

export function computeClient(client: Client, contracts: ContractCalc[]): ClientCalc {
  const mine = contracts.filter((c) => c.clientName === client.name);
  const openContracts = mine.filter((c) => c.status === "OPEN").length;
  const monthlyRent = round2(mine.reduce((s, c) => s + c.monthlyRent, 0));
  const due = round2(mine.reduce((s, c) => s + c.dueAmount, 0));
  const paid = round2(mine.reduce((s, c) => s + c.paidAmount, 0));
  const balance = round2(due - paid);
  const maxOverdueDays = mine.reduce((m, c) => Math.max(m, c.overdueDays), 0);
  const collectionRate = due > 0 ? paid / due : 0;

  let status = "🟢 منتظم";
  if (balance < -0.5) status = "🔵 رصيد مقدم";
  else if (maxOverdueDays > 15) status = "🔴 تصعيد";
  else if (maxOverdueDays > 7) status = "🟠 إنذار";
  else if (maxOverdueDays > 0) status = "🟡 تذكير";

  return {
    id: client.id,
    name: client.name,
    type: client.type,
    taxNumber: client.taxNumber,
    mobile: client.mobile,
    email: client.email,
    openContracts,
    monthlyRent,
    due,
    paid,
    balance,
    maxOverdueDays,
    collectionRate,
    status,
  };
}

// ===================== السيارات =====================

export interface CarCalc {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: string | null;
  vin: string | null;
  owner: string | null;
  authorization: string | null;
  istimaraExpiry: Date | null;
  insuranceExpiry: Date | null;
  insuranceCompany: string | null;
  inspectionExpiry: Date | null;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  manualStatus: string | null;
  actualStatus: string;
  currentClient: string | null;
  currentContractNo: number | null;
  revenue: number;
  collected: number;
  expenses: number;
  netProfit: number;
  nearestExpiryDays: number | null;
  docAlert: string;
  notes: string | null;
}

export function computeCar(
  car: Car,
  contracts: ContractCalc[],
  expenses: Expense[],
  today: Date
): CarCalc {
  const carContracts = contracts.filter((c) => c.plateText === car.plate);
  const openContract = carContracts.find((c) => c.status === "OPEN");
  const actualStatus = openContract ? "مؤجرة" : car.manualStatus || "جاهزة";

  const revenue = round2(carContracts.reduce((s, c) => s + c.dueAmount / (1 + 0), 0));
  const collected = round2(carContracts.reduce((s, c) => s + c.paidAmount, 0));
  const carExpenses = expenses.filter((e) => e.carId === car.id);
  const expensesTotal = round2(carExpenses.reduce((s, e) => s + e.amountBeforeTax, 0));
  const netProfit = round2(revenue - expensesTotal);

  const expiries = [car.istimaraExpiry, car.insuranceExpiry, car.inspectionExpiry].filter(
    (x): x is Date => !!x
  );
  let nearestExpiryDays: number | null = null;
  if (expiries.length) {
    const nearest = expiries.reduce((a, b) => (a < b ? a : b));
    nearestExpiryDays = differenceInCalendarDays(nearest, today);
  }

  let docAlert = "🟢 مكتملة";
  const missing = [car.istimaraExpiry, car.insuranceExpiry, car.inspectionExpiry].filter((x) => !x).length;
  if (missing > 0) docAlert = "🟡 وثائق ناقصة";
  if (nearestExpiryDays !== null && nearestExpiryDays < 0) docAlert = "🔴 وثيقة منتهية";
  else if (nearestExpiryDays !== null && nearestExpiryDays <= 30) docAlert = "🟠 قريبة الانتهاء";

  return {
    id: car.id,
    plate: car.plate,
    brand: car.brand,
    model: car.model,
    year: car.year,
    vin: car.vin,
    owner: car.owner,
    authorization: car.authorization,
    istimaraExpiry: car.istimaraExpiry,
    insuranceExpiry: car.insuranceExpiry,
    insuranceCompany: car.insuranceCompany,
    inspectionExpiry: car.inspectionExpiry,
    dailyPrice: car.dailyPrice,
    weeklyPrice: car.weeklyPrice,
    monthlyPrice: car.monthlyPrice,
    manualStatus: car.manualStatus,
    actualStatus,
    currentClient: openContract?.clientName ?? null,
    currentContractNo: openContract?.contractNo ?? null,
    revenue,
    collected,
    expenses: expensesTotal,
    netProfit,
    nearestExpiryDays,
    docAlert,
    notes: car.notes,
  };
}

// ===================== لوحة الإدارة =====================

export interface DashboardData {
  openContractsCount: number;
  monthlyTarget: number;
  collectedThisMonth: number;
  targetAchievementRate: number;
  totalOverdue: number;
  overdueContractsCount: number;
  advanceBalances: number;
  netReceivables: number;
  top10Overdue: ContractCalc[];
  fleetTotal: number;
  fleetRented: number;
  fleetReady: number;
  fleetMaintenance: number;
  netProfitMonth: number;
  netProfitYTD: number;
  expiringDocsCount: number;
  expiringIqamasCount: number;
  transportLicenseAtRisk: boolean;
}

export function computeDashboard(
  contracts: ContractCalc[],
  cars: CarCalc[],
  companyDocs: { expiryDate: Date | null; stopsTransportLicense: boolean }[],
  employees: Employee[],
  monthlyTargetManual: number | null,
  incomeStatement: MonthRow[],
  today: Date
): DashboardData {
  const open = contracts.filter((c) => c.status === "OPEN");
  const monthlyTarget = monthlyTargetManual ?? round2(open.reduce((s, c) => s + c.monthlyRent, 0));
  const collectedThisMonth = round2(
    contracts.reduce((s, c) => s + c.dueThisMonth, 0)
  ); // تقريب: يُستبدل لاحقاً بمجموع السندات الفعلي لهذا الشهر
  const overdue = contracts.filter((c) => c.financialStatus === "متأخر" && c.status !== "CLOSED");
  const totalOverdue = round2(overdue.reduce((s, c) => s + c.balance, 0));
  const advanceBalances = round2(
    Math.abs(
      contracts
        .filter((c) => c.financialStatus === "رصيد مقدم")
        .reduce((s, c) => s + c.balance, 0)
    )
  );
  const netReceivables = round2(totalOverdue - advanceBalances);

  const top10Overdue = [...overdue].sort((a, b) => b.overdueDays - a.overdueDays).slice(0, 10);

  const expiringDocsCount = companyDocs.filter(
    (doc) => doc.expiryDate && differenceInCalendarDays(doc.expiryDate, today) <= 30
  ).length;
  const expiringIqamasCount = employees.filter(
    (e) => e.iqamaExpiry && differenceInCalendarDays(e.iqamaExpiry, today) <= 30
  ).length;
  const transportLicenseAtRisk = companyDocs.some(
    (doc) => doc.stopsTransportLicense && doc.expiryDate && doc.expiryDate < today
  );

  const thisMonthKey = format(today, "yyyy-MM");
  const monthRow = incomeStatement.find((m) => m.key === thisMonthKey);
  const netProfitMonth = monthRow?.netProfit ?? 0;
  const netProfitYTD = incomeStatement.reduce((s, m) => s + m.netProfit, 0);

  return {
    openContractsCount: open.length,
    monthlyTarget,
    collectedThisMonth,
    targetAchievementRate: monthlyTarget > 0 ? collectedThisMonth / monthlyTarget : 0,
    totalOverdue,
    overdueContractsCount: overdue.length,
    advanceBalances,
    netReceivables,
    top10Overdue,
    fleetTotal: cars.length,
    fleetRented: cars.filter((c) => c.actualStatus === "مؤجرة").length,
    fleetReady: cars.filter((c) => c.actualStatus === "جاهزة").length,
    fleetMaintenance: cars.filter((c) => c.actualStatus === "صيانة").length,
    netProfitMonth,
    netProfitYTD,
    expiringDocsCount,
    expiringIqamasCount,
    transportLicenseAtRisk,
  };
}

// ===================== قائمة الدخل الشهرية =====================

export interface MonthRow {
  key: string; // yyyy-MM
  label: string;
  revenue: number;
  expenses: number;
  commitmentsCost: number;
  payrollCost: number;
  companyDocsCost: number;
  totalExpenses: number;
  netProfit: number;
  margin: number;
  cumulative: number;
}

export function computeIncomeStatement(
  year: number,
  contracts: ContractWithRelations[],
  expenses: Expense[],
  commitments: { paymentAmount: number | null; periodicity: string; startDate: Date | null; endDate: Date | null }[],
  payrollMonthlyCost: Map<string, number>,
  companyDocsMonthly: number,
  settings: Pick<Settings, "vatRate">,
  today: Date
): MonthRow[] {
  const rows: MonthRow[] = [];
  let cumulative = 0;

  for (let m = 0; m < 12; m++) {
    const monthStart = startOfMonth(new Date(year, m, 1));
    if (monthStart > today) break;
    const monthEnd = endOfMonth(monthStart);
    const prevDay = addDays(monthStart, -1);
    const key = format(monthStart, "yyyy-MM");

    let revenue = 0;
    for (const c of contracts) {
      if (c.status === "SUSPENDED" || !c.contractNo) continue;
      const start = d(c.startDate)!;
      const close = d(c.closeDate);
      const effectiveEnd = c.status === "CLOSED" && close ? close : today;
      const a = effectiveEnd < monthEnd ? effectiveEnd : monthEnd;
      const b = start > prevDay ? start : prevDay;
      const overlap = Math.max(0, differenceInCalendarDays(a, b));
      revenue += c.dailyPrice * overlap;
    }
    revenue = round2(revenue);

    const monthExpenses = round2(
      expenses
        .filter((e) => {
          const ed = d(e.date)!;
          return ed >= monthStart && ed <= monthEnd;
        })
        .reduce((s, e) => s + e.amountBeforeTax, 0)
    );

    const commitmentsCost = round2(
      commitments.reduce((s, c) => {
        if (!c.paymentAmount) return s;
        if (c.startDate && d(c.startDate)! > monthEnd) return s;
        if (c.endDate && d(c.endDate)! < monthStart) return s;
        const divisor =
          c.periodicity === "شهري"
            ? 1
            : c.periodicity === "ربع سنوي"
            ? 3
            : c.periodicity === "نصف سنوي"
            ? 6
            : c.periodicity === "سنوي"
            ? 12
            : 1;
        return s + c.paymentAmount / divisor;
      }, 0)
    );

    const payrollCost = round2(payrollMonthlyCost.get(key) ?? 0);
    const companyDocsCost = round2(companyDocsMonthly);

    const totalExpenses = round2(monthExpenses + commitmentsCost + payrollCost + companyDocsCost);
    const netProfit = round2(revenue - totalExpenses);
    cumulative = round2(cumulative + netProfit);

    rows.push({
      key,
      label: format(monthStart, "MM/yyyy"),
      revenue,
      expenses: monthExpenses,
      commitmentsCost,
      payrollCost,
      companyDocsCost,
      totalExpenses,
      netProfit,
      margin: revenue > 0 ? netProfit / revenue : 0,
      cumulative,
    });
  }

  return rows;
}

// ===================== الرواتب (تأمينات، مكافأة نهاية الخدمة) =====================

export interface PayrollCalcInput {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  isSaudi: boolean;
  overtimeHours: number;
  incentives: number;
  absenceDeduction: number;
  advances: number;
  penalties: number;
}

export interface PayrollCalcResult {
  grossPay: number;
  insuranceWage: number;
  employeeGosi: number;
  employerGosi: number;
  overtimePay: number;
  totalEarned: number;
  totalDeductions: number;
  netPay: number;
  deductionCapWarning: boolean;
  advanceCapWarning: boolean;
}

const GOSI_WAGE_CAP = 45000;

export function computePayroll(input: PayrollCalcInput): PayrollCalcResult {
  const grossPay =
    input.basicSalary + input.housingAllowance + input.transportAllowance + input.otherAllowances;

  const insuranceWage = Math.min(input.basicSalary + input.housingAllowance, GOSI_WAGE_CAP);
  const employeeGosi = input.isSaudi ? round2(insuranceWage * 0.0975) : 0;
  const employerGosi = round2(insuranceWage * (input.isSaudi ? 0.1175 : 0.02));

  const hourlyWage = input.basicSalary / 30 / 8;
  const overtimePay = round2(input.overtimeHours * hourlyWage * 1.5);

  const totalEarned = round2(grossPay + overtimePay + input.incentives);

  const deductionCap = totalEarned * 0.5;
  const advanceCap = totalEarned * 0.1;
  const rawDeductions =
    input.absenceDeduction + input.penalties + employeeGosi + Math.min(input.advances, advanceCap);
  const totalDeductions = round2(Math.min(rawDeductions, deductionCap));

  const netPay = round2(totalEarned - totalDeductions);

  return {
    grossPay: round2(grossPay),
    insuranceWage: round2(insuranceWage),
    employeeGosi,
    employerGosi,
    overtimePay,
    totalEarned,
    totalDeductions,
    netPay,
    deductionCapWarning: rawDeductions > deductionCap,
    advanceCapWarning: input.advances > advanceCap,
  };
}

/** مكافأة نهاية الخدمة: نصف شهر لكل سنة من أول 5 سنوات ثم شهر لكل سنة بعدها (م 84) */
export function endOfServiceGratuity(basicSalary: number, yearsOfService: number): number {
  const firstFive = Math.min(yearsOfService, 5);
  const rest = Math.max(0, yearsOfService - 5);
  return round2(firstFive * (basicSalary / 2) + rest * basicSalary);
}

/** أيام الإجازة السنوية: 21 يوماً، أو 30 يوماً بعد 5 سنوات خدمة */
export function annualLeaveDays(yearsOfService: number): number {
  return yearsOfService >= 5 ? 30 : 21;
}

export function whatsappLink(mobile: string | null | undefined, message: string): string | null {
  if (!mobile) return null;
  const clean = mobile.replace(/[\s-]/g, "");
  const local9 = clean.slice(-9);
  if (local9.length !== 9) return null;
  return `https://wa.me/966${local9}?text=${encodeURIComponent(message)}`;
}

export { round2 };
