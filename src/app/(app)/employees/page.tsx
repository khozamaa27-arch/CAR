import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { annualLeaveDays, endOfServiceGratuity, whatsappLink } from "@/lib/calc";
import { differenceInCalendarDays, differenceInCalendarYears } from "date-fns";
import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const settings = await getSettings();
  const today = settings.calcDateOverride ?? new Date();
  const employees = await prisma.employee.findMany({ orderBy: { empNo: "asc" } });

  const rows = employees.map((e) => {
    const expiries = [
      { label: "الإقامة", date: e.iqamaExpiry },
      { label: "رخصة العمل", date: e.workPermitExpiry },
      { label: "الجواز", date: e.passportExpiry },
      { label: "التأمين الطبي", date: e.medicalInsuranceExpiry },
    ].filter((x) => x.date);
    let nearestDays: number | null = null;
    let nearestLabel = "";
    for (const x of expiries) {
      const days = differenceInCalendarDays(x.date!, today);
      if (nearestDays === null || days < nearestDays) {
        nearestDays = days;
        nearestLabel = x.label;
      }
    }
    const years = e.hireDate ? Math.max(0, differenceInCalendarYears(today, e.hireDate)) : 0;
    const gratuity = endOfServiceGratuity(e.basicSalary, years);
    const leaveDays = annualLeaveDays(years);
    const docStatus =
      nearestDays === null
        ? "🟡 بيانات ناقصة"
        : nearestDays < 0
        ? "🔴 منتهية"
        : nearestDays <= 30
        ? "🟠 قريبة الانتهاء"
        : "🟢 سارية";

    return {
      id: e.id,
      empNo: e.empNo,
      name: e.name,
      jobTitle: e.jobTitle,
      nationality: e.nationality,
      mobile: e.mobile,
      basicSalary: e.basicSalary,
      hireDate: e.hireDate,
      yearsOfService: years,
      gratuity,
      leaveDays,
      nearestExpiryLabel: nearestLabel,
      nearestExpiryDays: nearestDays,
      docStatus,
      status: e.status,
      whatsappUrl: whatsappLink(e.mobile, `فرناس: تذكير بتحديث وثائق ${e.name}`),
    };
  });

  return <EmployeesClient rows={rows} />;
}
