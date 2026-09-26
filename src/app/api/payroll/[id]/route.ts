import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ACCOUNTANT")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  const numFields = ["overtimeHours", "incentives", "absenceDeduction", "advances", "penalties"];
  for (const f of numFields) if (body[f] !== undefined) data[f] = Number(body[f]);
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.paidDate !== undefined) data.paidDate = body.paidDate ? new Date(body.paidDate) : null;

  await prisma.payroll.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
