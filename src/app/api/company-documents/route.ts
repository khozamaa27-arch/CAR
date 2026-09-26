import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ACCOUNTANT")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "اسم المستند مطلوب" }, { status: 400 });

  const doc = await prisma.companyDocument.create({
    data: {
      name: body.name,
      authority: body.authority || null,
      number: body.number || null,
      issueDate: body.issueDate ? new Date(body.issueDate) : null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      renewalCycleMonths: body.renewalCycleMonths ? Number(body.renewalCycleMonths) : null,
      fees: body.fees ? Number(body.fees) : null,
      stopsTransportLicense: !!body.stopsTransportLicense,
      responsible: body.responsible || null,
      responsiblePhone: body.responsiblePhone || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json({ ok: true, id: doc.id });
}
