import { getAllContractsCalc } from "@/lib/data";
import { parseList, getSettings } from "@/lib/settings";
import SupervisorClient from "./SupervisorClient";

export const dynamic = "force-dynamic";

export default async function SupervisorPage() {
  const { contracts } = await getAllContractsCalc();
  const settings = await getSettings();
  const list = contracts
    .filter((c) => c.status !== "CLOSED")
    .sort((a, b) => b.priorityRank - a.priorityRank || b.overdueDays - a.overdueDays);

  const counts = {
    escalation: list.filter((c) => c.priority === "🔴 تصعيد").length,
    warning: list.filter((c) => c.priority === "🟠 إنذار").length,
    reminder: list.filter((c) => c.priority === "🟡 تذكير").length,
    missingData: list.filter((c) => c.dataAlert).length,
  };

  return (
    <SupervisorClient
      contracts={list}
      counts={counts}
      followUpResults={parseList(settings.followUpResultsList)}
    />
  );
}
