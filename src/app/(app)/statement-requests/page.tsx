import { prisma } from "@/lib/prisma";
import { getSettings, parseList } from "@/lib/settings";
import StatementRequestsClient from "./StatementRequestsClient";

export const dynamic = "force-dynamic";

export default async function StatementRequestsPage() {
  const settings = await getSettings();
  const requests = await prisma.statementRequest.findMany({ orderBy: { createdAt: "desc" } });
  const clients = await prisma.client.findMany({ select: { name: true }, orderBy: { name: "asc" } });

  return (
    <StatementRequestsClient
      requests={requests.map((r) => ({
        id: r.id,
        requestNo: r.requestNo,
        toEmployee: r.toEmployee,
        selectionMethod: r.selectionMethod,
        date: r.date,
        replyBy: r.replyBy,
        count: JSON.parse(r.contractNosJson).length,
      }))}
      employees={parseList(settings.employeesList)}
      methods={parseList(settings.statementMethodsList)}
      clientNames={clients.map((c) => c.name)}
    />
  );
}
