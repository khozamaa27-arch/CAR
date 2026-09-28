import Image from "next/image";
import Link from "next/link";
import type { SessionPayload } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

const NAV: { href: string; label: string; roles: string[] }[] = [
  { href: "/dashboard", label: "لوحة الإدارة", roles: ["ADMIN"] },
  { href: "/contracts", label: "العقود", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/receipts", label: "سندات القبض", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/clients", label: "العملاء", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/quote", label: "عرض سعر", roles: ["ADMIN"] },
  { href: "/statement-requests", label: "طلب إفادة", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/supervisor", label: "المشرف", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/cars", label: "السيارات", roles: ["ADMIN"] },
  { href: "/expenses", label: "المصروفات", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/commitments", label: "الالتزامات", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/employees", label: "الموظفون", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/payroll", label: "الرواتب", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/company-documents", label: "مستندات الشركة", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/income-statement", label: "قائمة الدخل", roles: ["ADMIN"] },
  { href: "/settings", label: "الإعدادات", roles: ["ADMIN"] },
];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "مدير",
  ACCOUNTANT: "محاسب",
  SUPERVISOR: "مشرف",
};

export default function AppShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const items = NAV.filter((i) => i.roles.includes(session.role));

  return (
    <div className="min-h-screen flex">
      <aside className="no-print w-64 shrink-0 bg-[--color-navy] text-white flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <Image src="/logo.svg" alt="فرناس" width={140} height={38} className="[&_text]:fill-white" />
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs text-white/70">
          <p className="font-semibold text-white">{session.name}</p>
          <p>{ROLE_LABEL[session.role]}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-[--color-background]">
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
