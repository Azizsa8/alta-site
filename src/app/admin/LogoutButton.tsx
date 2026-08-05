"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
        router.refresh();
      }}
      className="rounded-md border b-gold px-4 py-2.5 text-[13px] text-primary hover:bg-primary/10 disabled:opacity-60"
    >
      {busy ? "…" : "خروج"}
    </button>
  );
}
