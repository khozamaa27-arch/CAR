import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ACCOUNTANT")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  const { date, plate, type, vendor, invoiceNo, amountBeforeTax, taxable, chargeTo, notes } = body;
  if (!plate || !type || !amountBeforeTax) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  let car = await prisma.car.findUnique({ where: { plate: plate.trim() } });
  if (!car) car = await prisma.car.create({ data: { plate: plate.trim() } });

  await getSettings(); // تأكيد وجود الإعدادات (نسبة الضريبة تُحسب في العرض)

  const expense = await prisma.expense.create({
    data: {
      date: date ? new Date(date) : new Date(),
      carId: car.id,
      type,
      vendor: vendor || null,
      invoiceNo: invoiceNo || null,
      amountBeforeTax: Number(amountBeforeTax),
      taxable: taxable !== false,
      chargeTo: chargeTo || "فرناس",
      notes: notes || null,
    },
  });

  return NextResponse.json({ ok: true, id: expense.id });
}
