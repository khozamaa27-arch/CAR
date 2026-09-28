import { prisma } from "@/lib/prisma";
import { getSettings, parseList } from "@/lib/settings";
import ExpensesClient from "./ExpensesClient";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [expenses, cars, settings] = await Promise.all([
    prisma.expense.findMany({ include: { car: true }, orderBy: { date: "desc" } }),
    prisma.car.findMany({ select: { plate: true }, orderBy: { plate: "asc" } }),
    getSettings(),
  ]);

  return (
    <ExpensesClient
      expenses={expenses.map((e) => ({
        id: e.id,
        date: e.date,
        plate: e.car.plate,
        type: e.type,
        vendor: e.vendor,
        invoiceNo: e.invoiceNo,
        amountBeforeTax: e.amountBeforeTax,
        taxable: e.taxable,
        vat: e.taxable ? e.amountBeforeTax * settings.vatRate : 0,
        total: e.taxable ? e.amountBeforeTax * (1 + settings.vatRate) : e.amountBeforeTax,
        chargeTo: e.chargeTo,
      }))}
      plates={cars.map((c) => c.plate)}
      expenseTypes={parseList(settings.expenseTypesList)}
      chargeToOptions={parseList(settings.chargeToList)}
    />
  );
}
