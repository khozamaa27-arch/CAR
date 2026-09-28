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
  const strFields = ["jobTitle", "nationality", "iqamaNo", "mobile", "status"];
  for (const f of strFields) if (body[f] !== undefined) data[f] = body[f] || null;
  const dateFields = ["iqamaExpiry", "workPermitExpiry", "passportExpiry", "medicalInsuranceExpiry", "hireDate"];
  for (const f of dateFields) if (body[f] !== undefined) data[f] = body[f] ? new Date(body[f]) : null;
  const numFields = ["basicSalary", "housingAllowance", "transportAllowance", "otherAllowances"];
  for (const f of numFields) if (body[f] !== undefined) data[f] = Number(body[f]);
  if (body.nationality !== undefined) data.isSaudi = body.nationality === "سعودي";

  await prisma.employee.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
