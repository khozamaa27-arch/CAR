import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  const strFields = ["brand", "model", "year", "vin", "owner", "authorization", "insuranceCompany", "manualStatus", "notes"];
  for (const f of strFields) if (body[f] !== undefined) data[f] = body[f] || null;
  const dateFields = ["istimaraExpiry", "insuranceExpiry", "inspectionExpiry"];
  for (const f of dateFields) if (body[f] !== undefined) data[f] = body[f] ? new Date(body[f]) : null;
  if (body.dailyPrice !== undefined) data.dailyPrice = Number(body.dailyPrice);
  if (body.weeklyPrice !== undefined) data.weeklyPrice = Number(body.weeklyPrice);
  if (body.monthlyPrice !== undefined) data.monthlyPrice = Number(body.monthlyPrice);

  await prisma.car.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
