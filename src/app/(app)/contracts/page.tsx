import { getAllContractsCalc } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ContractsClient from "./ContractsClient";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const { contracts } = await getAllContractsCalc();
  const session = await getSession();
  const clients = await prisma.client.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const cars = await prisma.car.findMany({ select: { plate: true }, orderBy: { plate: "asc" } });

  return (
    <ContractsClient
      contracts={contracts}
      canEdit={session?.role === "ADMIN"}
      clientNames={clients.map((c) => c.name)}
      plates={cars.map((c) => c.plate)}
    />
  );
}
