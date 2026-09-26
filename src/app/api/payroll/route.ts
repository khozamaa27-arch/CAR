import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfMonth } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ACCOUNTANT")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  const month = startOfMonth(new Date(body.month));

  const employees = await prisma.employee.findMany({ where: { status: "على رأس العمل" } });
  for (const emp of employees) {
    await prisma.payroll.upsert({
      where: { month_employeeId: { month, employeeId: emp.id } },
      create: { month, employeeId: emp.id },
      update: {},
    });
  }
  return NextResponse.json({ ok: true, count: employees.length });
}
