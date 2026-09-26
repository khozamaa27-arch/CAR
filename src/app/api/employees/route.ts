import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ACCOUNTANT")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "اسم الموظف مطلوب" }, { status: 400 });

  const last = await prisma.employee.findMany({ orderBy: { empNo: "desc" }, take: 1 });
  const lastNum = last[0] ? parseInt(last[0].empNo.replace(/\D/g, ""), 10) || 0 : 0;
  const empNo = `EMP-${String(lastNum + 1).padStart(3, "0")}`;

  const emp = await prisma.employee.create({
    data: {
      empNo,
      name: body.name,
      jobTitle: body.jobTitle || null,
      nationality: body.nationality || null,
      isSaudi: body.nationality === "سعودي",
      iqamaNo: body.iqamaNo || null,
      iqamaExpiry: body.iqamaExpiry ? new Date(body.iqamaExpiry) : null,
      workPermitExpiry: body.workPermitExpiry ? new Date(body.workPermitExpiry) : null,
      passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
      medicalInsuranceExpiry: body.medicalInsuranceExpiry ? new Date(body.medicalInsuranceExpiry) : null,
      hireDate: body.hireDate ? new Date(body.hireDate) : null,
      mobile: body.mobile || null,
      basicSalary: Number(body.basicSalary) || 0,
      housingAllowance: Number(body.housingAllowance) || 0,
      transportAllowance: Number(body.transportAllowance) || 0,
      otherAllowances: Number(body.otherAllowances) || 0,
    },
  });
  return NextResponse.json({ ok: true, id: emp.id });
}
