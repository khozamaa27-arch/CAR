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
  if (body.taxInvoiceNo !== undefined) data.taxInvoiceNo = body.taxInvoiceNo;
  await prisma.receipt.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
