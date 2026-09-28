import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};

  const numFields = ["vatRate", "daysInMonth", "escalationDays", "warningDays", "claimGraceDays", "monthlyTargetManual"];
  for (const f of numFields) {
    if (body[f] !== undefined) data[f] = body[f] === "" ? null : Number(body[f]);
  }
  const strFields = ["branch", "companyName", "crNumber", "unifiedNationalNumber", "taxNumber", "address", "iban", "bankName", "whatsappNumber"];
  for (const f of strFields) if (body[f] !== undefined) data[f] = body[f];

  if (body.calcDateOverride !== undefined) {
    data.calcDateOverride = body.calcDateOverride ? new Date(body.calcDateOverride) : null;
  }

  await prisma.settings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  return NextResponse.json({ ok: true });
}
