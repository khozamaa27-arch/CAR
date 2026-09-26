import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ACCOUNTANT")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  const { contractNo, date, amount, method, bankRef, receivedFrom } = body;

  const no = Number(contractNo);
  if (!no || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  const contract = await prisma.contract.findUnique({ where: { contractNo: no } });
  if (!contract) {
    return NextResponse.json({ error: "رقم العقد غير موجود" }, { status: 404 });
  }

  const count = await prisma.receipt.count({ where: { type: "PAYMENT" } });
  const receiptNo = `RV-${String(count + 1).padStart(4, "0")}`;

  const receipt = await prisma.receipt.create({
    data: {
      receiptNo,
      date: date ? new Date(date) : new Date(),
      contractId: contract.id,
      amount: Number(amount),
      method: method || null,
      bankRef: bankRef || null,
      type: "PAYMENT",
      receivedFrom: receivedFrom || null,
    },
  });

  return NextResponse.json({ ok: true, id: receipt.id, receiptNo });
}
