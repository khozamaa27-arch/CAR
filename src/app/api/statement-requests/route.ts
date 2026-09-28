import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getAllContractsCalc } from "@/lib/data";
import { format, addDays } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERVISOR")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await req.json();
  const { toEmployee, selectionMethod, clientName, contractNos } = body;
  if (!toEmployee || !selectionMethod) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const { contracts } = await getAllContractsCalc();
  const escalationDays = 15;
  let selected: number[] = [];

  if (selectionMethod === "أرقام محددة (القائمة الجانبية)") {
    selected = (contractNos || []).map((n: string) => Number(n)).filter(Boolean);
  } else if (selectionMethod === "كل عقود عميل" && clientName) {
    selected = contracts.filter((c) => c.clientName === clientName && c.status !== "CLOSED").map((c) => c.contractNo);
  } else if (selectionMethod === "كل المتأخرين") {
    selected = contracts.filter((c) => c.financialStatus === "متأخر" && c.status !== "CLOSED").map((c) => c.contractNo);
  } else if (selectionMethod === "التصعيد فقط") {
    selected = contracts
      .filter((c) => c.overdueDays > escalationDays && c.status !== "CLOSED")
      .map((c) => c.contractNo);
  }

  const today = new Date();
  const count = await prisma.statementRequest.count();
  const requestNo = `INQ-${format(today, "yyMMdd")}-${String(count + 1).padStart(2, "0")}`;

  const sr = await prisma.statementRequest.create({
    data: {
      requestNo,
      toEmployee,
      selectionMethod,
      clientName: clientName || null,
      date: today,
      replyBy: addDays(today, 1),
      contractNosJson: JSON.stringify(selected),
    },
  });

  return NextResponse.json({ ok: true, id: sr.id, requestNo, count: selected.length });
}
