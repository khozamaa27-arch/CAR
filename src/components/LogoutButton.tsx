"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="mt-2 text-xs text-white/70 hover:text-white underline"
    >
      تسجيل الخروج
    </button>
  );
}
