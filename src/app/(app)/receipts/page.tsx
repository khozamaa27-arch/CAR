import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { parseList } from "@/lib/settings";
import ReceiptsClient from "./ReceiptsClient";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const [receipts, contracts, settings] = await Promise.all([
    prisma.receipt.findMany({
      include: { contract: { include: { client: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.contract.findMany({
      include: { client: true },
      orderBy: { contractNo: "asc" },
    }),
    getSettings(),
  ]);

  const contractOptions = contracts.map((c) => ({
    contractNo: c.contractNo,
    label: `${c.contractNo} — ${c.driverName || c.client.name} — ${c.client.name}`,
  }));

  const receiptsData = receipts.map((r) => ({
    id: r.id,
    receiptNo: r.receiptNo,
    date: r.date,
    contractNo: r.contract.contractNo,
    clientName: r.contract.client.name,
    plateText: r.contract.plateText,
    amount: r.amount,
    method: r.method,
    type: r.type,
    receivedFrom: r.receivedFrom,
    taxInvoiceNo: r.taxInvoiceNo,
  }));

  return (
    <ReceiptsClient
      receipts={receiptsData}
      contractOptions={contractOptions}
      paymentMethods={parseList(settings.paymentMethodsList)}
    />
  );
}
