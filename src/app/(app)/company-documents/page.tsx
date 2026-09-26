import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { differenceInCalendarDays } from "date-fns";
import CompanyDocumentsClient from "./CompanyDocumentsClient";

export const dynamic = "force-dynamic";

export default async function CompanyDocumentsPage() {
  const settings = await getSettings();
  const today = settings.calcDateOverride ?? new Date();
  const docs = await prisma.companyDocument.findMany({ orderBy: { expiryDate: "asc" } });

  const rows = docs.map((d) => {
    const daysLeft = d.expiryDate ? differenceInCalendarDays(d.expiryDate, today) : null;
    let status = "🟡 بيانات ناقصة";
    if (daysLeft !== null) {
      status = daysLeft < 0 ? "🔴 منتهية / متأخرة" : daysLeft <= (d.alertBeforeDays || 30) ? "🟠 قريبة — جدّد" : "🟢 سارية";
    }
    return {
      id: d.id,
      name: d.name,
      authority: d.authority,
      number: d.number,
      issueDate: d.issueDate,
      expiryDate: d.expiryDate,
      renewalCycleMonths: d.renewalCycleMonths,
      fees: d.fees,
      daysLeft,
      status,
      stopsTransportLicense: d.stopsTransportLicense,
      responsible: d.responsible,
      notes: d.notes,
    };
  });

  const transportAtRisk = rows.some((r) => r.stopsTransportLicense && r.daysLeft !== null && r.daysLeft < 0);

  return <CompanyDocumentsClient rows={rows} transportAtRisk={transportAtRisk} />;
}
