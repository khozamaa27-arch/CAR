import { getSettings } from "@/lib/settings";
import QuoteClient from "./QuoteClient";

export const dynamic = "force-dynamic";

export default async function QuotePage() {
  const settings = await getSettings();
  return (
    <QuoteClient
      settings={{
        companyName: settings.companyName,
        address: settings.address,
        crNumber: settings.crNumber,
        taxNumber: settings.taxNumber,
        iban: settings.iban,
        bankName: settings.bankName,
        vatRate: settings.vatRate,
      }}
    />
  );
}
