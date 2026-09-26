import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.plate) return NextResponse.json({ error: "رقم اللوحة مطلوب" }, { status: 400 });

  const existing = await prisma.car.findUnique({ where: { plate: body.plate.trim() } });
  if (existing) return NextResponse.json({ error: "رقم اللوحة مسجل مسبقاً" }, { status: 400 });

  const car = await prisma.car.create({
    data: {
      plate: body.plate.trim(),
      brand: body.brand || null,
      model: body.model || null,
      year: body.year || null,
      vin: body.vin || null,
      owner: body.owner || null,
      authorization: body.authorization || null,
      istimaraExpiry: body.istimaraExpiry ? new Date(body.istimaraExpiry) : null,
      insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
      insuranceCompany: body.insuranceCompany || null,
      inspectionExpiry: body.inspectionExpiry ? new Date(body.inspectionExpiry) : null,
      dailyPrice: Number(body.dailyPrice) || 0,
      weeklyPrice: Number(body.dailyPrice || 0) * 7,
      monthlyPrice: Number(body.dailyPrice || 0) * 30,
      manualStatus: body.manualStatus || "جاهزة",
      notes: body.notes || null,
    },
  });
  return NextResponse.json({ ok: true, id: car.id });
}
