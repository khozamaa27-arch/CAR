import { getSettings } from "@/lib/settings";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <SettingsClient
      settings={{
        vatRate: settings.vatRate,
        daysInMonth: settings.daysInMonth,
        escalationDays: settings.escalationDays,
        warningDays: settings.warningDays,
        claimGraceDays: settings.claimGraceDays,
        monthlyTargetManual: settings.monthlyTargetManual,
        branch: settings.branch,
        companyName: settings.companyName,
        crNumber: settings.crNumber,
        unifiedNationalNumber: settings.unifiedNationalNumber,
        taxNumber: settings.taxNumber,
        address: settings.address,
        iban: settings.iban,
        bankName: settings.bankName,
        whatsappNumber: settings.whatsappNumber,
        calcDateOverride: settings.calcDateOverride?.toISOString().slice(0, 10) || "",
      }}
    />
  );
}
