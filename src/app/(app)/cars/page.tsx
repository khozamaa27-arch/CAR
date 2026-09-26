import { getAllCarsCalc } from "@/lib/data";
import { getSettings, parseList } from "@/lib/settings";
import CarsClient from "./CarsClient";

export const dynamic = "force-dynamic";

export default async function CarsPage() {
  const { cars } = await getAllCarsCalc();
  const settings = await getSettings();
  return (
    <CarsClient
      cars={cars}
      owners={parseList(settings.carOwnersList)}
      statuses={parseList(settings.carStatusList)}
    />
  );
}
