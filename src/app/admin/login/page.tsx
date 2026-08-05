import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginForm } from "./LoginForm";
import { SESSION_COOKIE, readSession, isLoginConfigured } from "@/lib/adminAuth";
import { company } from "@/content/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "دخول لوحة التحكم | شركة التا للاستثمار",
  // An admin login page has no business in a search index.
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const jar = await cookies();
  if (readSession(jar.get(SESSION_COOKIE)?.value)) redirect("/admin");

  return (
    <section className="relative isolate flex min-h-[calc(100dvh-72px)] items-center overflow-hidden bg-surface">
      <div className="blueprint absolute inset-0" />
      <div className="alta-container relative py-16">
        <div className="mx-auto w-full max-w-md rounded-xl border b-gold bg-surface-panel p-8 shadow-panel">
          <p className="font-display text-[13px] font-bold tracking-[0.28em] text-primary">
            {company.mark}
          </p>
          <h1 className="mt-3 font-display text-[24px] font-bold text-text-primary">
            لوحة التحكم
          </h1>
          <p className="mt-2 text-[13px] leading-[1.8] text-text-muted">
            الدخول مخصص لفريق {company.nameAr}.
          </p>

          {isLoginConfigured() ? (
            <LoginForm />
          ) : (
            <div className="mt-7 rounded-lg border b-soft bg-surface p-5 text-[13px] leading-[1.9] text-text-muted">
              <p className="mb-3 font-bold text-text-primary">لم يتم إعداد الدخول بعد</p>
              <p>
                شغّل الأمر التالي ثم أضف القيم الناتجة إلى متغيرات البيئة مع{" "}
                <code className="text-primary">ADMIN_USERNAME</code>:
              </p>
              <pre className="mt-3 overflow-x-auto rounded bg-surface-lowest p-3 text-[11.5px] text-primary" dir="ltr">
                node scripts/hash-password.mjs &quot;your-password&quot;
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
