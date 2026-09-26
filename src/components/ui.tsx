export function Card({
  title,
  value,
  sub,
  tone = "default",
}: {
  title: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "green" | "red" | "amber" | "blue";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-[--color-navy]",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    blue: "text-[--color-blue]",
  };
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-500">{title}</span>
      <span className={`text-2xl font-bold ${toneClasses[tone]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

export function PageHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <h1 className="text-xl font-bold text-[--color-navy]">{title}</h1>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone] || map.slate}`}>
      {children}
    </span>
  );
}

export function fmtMoney(n: number): string {
  return new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { year: "numeric", month: "2-digit", day: "2-digit" }).format(dt);
}

export function WhatsAppButton({ url }: { url: string | null }) {
  if (!url) return <span className="text-slate-300">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
      title="واتساب"
    >
      💬
    </a>
  );
}
