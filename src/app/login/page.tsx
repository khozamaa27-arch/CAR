import Image from "next/image";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-navy] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6">
        <Image src="/logo.svg" alt="فرناس" width={200} height={54} priority />
        <div className="text-center">
          <h1 className="text-xl font-bold text-[--color-navy]">نظام فرناس المتكامل</h1>
          <p className="text-sm text-slate-500 mt-1">تسجيل الدخول للمتابعة</p>
        </div>
        <LoginForm />
        <div className="w-full border-t border-slate-200 pt-4 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600">حسابات تجريبية:</p>
          <p>مدير: admin@farnas.sa / admin@2026</p>
          <p>محاسب: accountant@farnas.sa / acc@2026</p>
          <p>مشرف: supervisor@farnas.sa / sup@2026</p>
        </div>
      </div>
    </div>
  );
}
