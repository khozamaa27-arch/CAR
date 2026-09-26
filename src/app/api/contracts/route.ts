import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  const {
    clientName,
    driverName,
    mobile,
    plate,
    startDate,
    dailyPrice,
    additions,
  } = body;

  if (!clientName || !startDate || !dailyPrice) {
    return NextResponse.json({ error: "الحقول الأساسية مطلوبة" }, { status: 400 });
  }

  let client = await prisma.client.findFirst({ where: { name: clientName.trim() } });
  if (!client) {
    client = await prisma.client.create({ data: { name: clientName.trim(), mobile: mobile || null } });
  }

  let car = null;
  if (plate) {
    car = await prisma.car.findUnique({ where: { plate: plate.trim() } });
    if (!car) {
      car = await prisma.car.create({ data: { plate: plate.trim() } });
    }
  }

  const last = await prisma.contract.findFirst({ orderBy: { contractNo: "desc" } });
  const contractNo = (last?.contractNo || 0) + 1;

  const contract = await prisma.contract.create({
    data: {
      contractNo,
      clientId: client.id,
      driverName: driverName || null,
      mobile: mobile || null,
      carId: car?.id || null,
      plateText: plate || null,
      startDate: new Date(startDate),
      dailyPrice: Number(dailyPrice),
      additions: Number(additions) || 0,
    },
  });

  return NextResponse.json({ ok: true, id: contract.id, contractNo });
}
