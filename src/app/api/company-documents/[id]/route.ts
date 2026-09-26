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
  if (body.issueDate !== undefined) data.issueDate = body.issueDate ? new Date(body.issueDate) : null;
  if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  if (body.fees !== undefined) data.fees = Number(body.fees);
  if (body.renewedThisCycle !== undefined) data.renewedThisCycle = !!body.renewedThisCycle;
  if (body.notes !== undefined) data.notes = body.notes;

  await prisma.companyDocument.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
