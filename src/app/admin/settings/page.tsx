import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  readSession,
  isLoginConfigured,
  isProductionRuntime,
} from "@/lib/adminAuth";
import { readSettings, listRevisions } from "@/lib/settings";
import { backendName } from "@/lib/store";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "إعدادات وتخصيص الموقع | لوحة التحكم",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const jar = await cookies();
  const session = readSession(jar.get(SESSION_COOKIE)?.value);

  if (isLoginConfigured()) {
    if (!session) redirect("/admin/login");
  } else if (isProductionRuntime()) {
    redirect("/admin/login");
  }

  const [settings, revisions] = await Promise.all([
    readSettings(),
    listRevisions(),
  ]);

  return (
    <SettingsClient
      initialSettings={settings}
      initialRevisions={revisions}
      backend={backendName()}
    />
  );
}
