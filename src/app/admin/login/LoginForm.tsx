"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const field =
  "w-full rounded-md border b-soft bg-surface px-4 py-3 text-[14px] text-text-primary " +
  "placeholder:text-text-muted/60 focus:border-[color:var(--color-primary-container)] focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "تعذر تسجيل الدخول.");
        return;
      }
      // refresh() re-runs the server component, which now sees the cookie.
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4">
      {error && (
        <p role="alert" className="rounded-md border border-danger bg-danger/10 px-4 py-3 text-[13px] text-text-primary">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="username" className="mb-2 block text-[13px] font-semibold text-text-primary">
          اسم المستخدم
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={field}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-[13px] font-semibold text-text-primary">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
          required
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-6 text-[15px] font-semibold text-on-primary transition-all hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? "جارٍ الدخول…" : "دخول"}
        {!busy && <Icon name="arrow" className="size-4" strokeWidth={2} />}
      </button>
    </form>
  );
}
