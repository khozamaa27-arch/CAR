"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";

interface SettingsForm {
  vatRate: number;
  daysInMonth: number;
  escalationDays: number;
  warningDays: number;
  claimGraceDays: number;
  monthlyTargetManual: number | null;
  branch: string;
  companyName: string;
  crNumber: string;
  unifiedNationalNumber: string;
  taxNumber: string;
  address: string;
  iban: string;
  bankName: string;
  whatsappNumber: string;
  calcDateOverride: string;
}

export default function SettingsClient({ settings }: { settings: SettingsForm }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="الإعدادات" />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-[--color-navy] mb-2">الاحتساب والحدود</h2>
          <Field label="تثبيت تاريخ الاحتساب (اختياري)">
            <input
              type="date"
              value={form.calcDateOverride}
              onChange={(e) => set("calcDateOverride", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="نسبة ضريبة القيمة المضافة">
            <input
              type="number"
              step="0.01"
              value={form.vatRate}
              onChange={(e) => set("vatRate", Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="أيام الشهر (لحساب الإيجار الشهري)">
            <input
              type="number"
              value={form.daysInMonth}
              onChange={(e) => set("daysInMonth", Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="حد التصعيد (أيام غير مسددة)">
            <input
              type="number"
              value={form.escalationDays}
              onChange={(e) => set("escalationDays", Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="حد الإنذار (أيام غير مسددة)">
            <input
              type="number"
              value={form.warningDays}
              onChange={(e) => set("warningDays", Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="مهلة السداد في المطالبة (يوم)">
            <input
              type="number"
              value={form.claimGraceDays}
              onChange={(e) => set("claimGraceDays", Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="الهدف الشهري اليدوي (فارغ = تلقائي)">
            <input
              type="number"
              value={form.monthlyTargetManual ?? ""}
              onChange={(e) => set("monthlyTargetManual", e.target.value === "" ? null : Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-[--color-navy] mb-2">بيانات الشركة</h2>
          <Field label="اسم الشركة">
            <input
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="الفرع">
            <input
              value={form.branch}
              onChange={(e) => set("branch", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="السجل التجاري">
            <input
              value={form.crNumber}
              onChange={(e) => set("crNumber", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="الرقم الوطني الموحد">
            <input
              value={form.unifiedNationalNumber}
              onChange={(e) => set("unifiedNationalNumber", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="الرقم الضريبي">
            <input
              value={form.taxNumber}
              onChange={(e) => set("taxNumber", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="العنوان">
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="آيبان">
            <input
              dir="ltr"
              value={form.iban}
              onChange={(e) => set("iban", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="اسم البنك">
            <input
              value={form.bankName}
              onChange={(e) => set("bankName", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="جوال واتساب الشركة">
            <input
              dir="ltr"
              value={form.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[--color-navy] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </button>
        {saved && <span className="text-sm text-emerald-600">✔ تم الحفظ</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
