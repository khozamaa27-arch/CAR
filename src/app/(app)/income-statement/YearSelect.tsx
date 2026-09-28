"use client";

import { useRouter } from "next/navigation";

export default function YearSelect({ year }: { year: number }) {
  const router = useRouter();
  return (
    <select
      defaultValue={year}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      onChange={(e) => {
        router.push(`/income-statement?year=${e.target.value}`);
      }}
    >
      {[year - 1, year, year + 1].map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
