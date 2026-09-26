import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};

  if (session.role === "SUPERVISOR") {
    // المشرف يستطيع فقط تسجيل نتيجة المتابعة وملاحظاتها
    if (body.followUpNotes !== undefined) data.followUpNotes = body.followUpNotes;
    if (body.followUpResult !== undefined) {
      data.followUpResult = body.followUpResult;
      data.lastFollowUpDate = new Date();
    }
    await prisma.contract.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (body.status !== undefined) data.status = body.status;
  if (body.closeDate !== undefined) data.closeDate = body.closeDate ? new Date(body.closeDate) : null;
  if (body.followUpNotes !== undefined) data.followUpNotes = body.followUpNotes;
  if (body.followUpResult !== undefined) {
    data.followUpResult = body.followUpResult;
    data.lastFollowUpDate = new Date();
  }
  if (body.dailyPrice !== undefined) data.dailyPrice = Number(body.dailyPrice);
  if (body.additions !== undefined) data.additions = Number(body.additions);
  if (body.driverName !== undefined) data.driverName = body.driverName;
  if (body.mobile !== undefined) data.mobile = body.mobile;

  await prisma.contract.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
