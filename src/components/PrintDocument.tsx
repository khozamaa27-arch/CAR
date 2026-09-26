import Image from "next/image";
import type { Settings } from "@prisma/client";

type PrintSettings = Pick<
  Settings,
  "address" | "crNumber" | "taxNumber" | "companyName" | "iban" | "bankName"
>;

export default function PrintDocument({
  title,
  settings,
  children,
}: {
  title: string;
  settings: PrintSettings;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="print-page mx-auto bg-white max-w-[800px] p-10 shadow print:shadow-none" dir="rtl">
        <div className="flex items-start justify-between border-b-2 pb-4 mb-6" style={{ borderColor: "#0A1E4A" }}>
          <div>
            <Image src="/logo.svg" alt="فرناس" width={180} height={48} />
            <p className="text-xs text-slate-500 mt-2">{settings.address}</p>
            <p className="text-xs text-slate-500">
              س.ت {settings.crNumber} · الرقم الضريبي {settings.taxNumber}
            </p>
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold text-[--color-navy]">{title}</h1>
            <p className="text-xs text-slate-500 mt-1">{settings.companyName}</p>
          </div>
        </div>

        {children}

        <div className="mt-10 pt-4 border-t text-[10px] text-slate-400 flex justify-between">
          <span>
            آيبان: {settings.iban} — {settings.bankName}
          </span>
          <span>{settings.companyName}</span>
        </div>
      </div>
    </div>
  );
}
