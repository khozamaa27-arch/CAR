import { prisma } from "@/lib/prisma";
import { getSettings, parseList } from "@/lib/settings";
import CommitmentsClient from "./CommitmentsClient";

export const dynamic = "force-dynamic";

const PERIOD_DIVISOR: Record<string, number> = {
  "شهري": 1,
  "ربع سنوي": 3,
  "نصف سنوي": 6,
  "سنوي": 12,
};

export default async function CommitmentsPage() {
  const [commitments, settings] = await Promise.all([
    prisma.commitment.findMany({ orderBy: { createdAt: "asc" } }),
    getSettings(),
  ]);

  const rows = commitments.map((c) => {
    const monthlyCost = c.paymentAmount ? c.paymentAmount / (PERIOD_DIVISOR[c.periodicity] || 1) : 0;
    const missing = !c.vendor || !c.startDate || !c.paymentAmount;
    return {
      id: c.id,
      item: c.item,
      category: c.category,
      vendor: c.vendor,
      periodicity: c.periodicity,
      paymentAmount: c.paymentAmount,
      paidSoFar: c.paidSoFar,
      monthlyCost,
      responsible: c.responsible,
      responsiblePhone: c.responsiblePhone,
      status: missing ? "🟡 بيانات ناقصة" : "🟢 مكتمل",
      notes: c.notes,
    };
  });

  return <CommitmentsClient rows={rows} categories={parseList(settings.commitmentCategoryList)} />;
}
