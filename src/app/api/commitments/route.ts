import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ACCOUNTANT")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.item || !body.category) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  const c = await prisma.commitment.create({
    data: {
      item: body.item,
      category: body.category,
      vendor: body.vendor || null,
      leaseContractNo: body.leaseContractNo || null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      totalValue: body.totalValue ? Number(body.totalValue) : null,
      periodicity: body.periodicity || "شهري",
      paymentsCount: body.paymentsCount ? Number(body.paymentsCount) : null,
      paymentAmount: body.paymentAmount ? Number(body.paymentAmount) : null,
      paidSoFar: Number(body.paidSoFar) || 0,
      responsible: body.responsible || null,
      responsiblePhone: body.responsiblePhone || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json({ ok: true, id: c.id });
}
