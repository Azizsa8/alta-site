import { NextResponse } from "next/server";
import { readSettings, themeCss } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await readSettings();
  const css = themeCss(settings.theme);
  return NextResponse.json({
    ok: true,
    revision: settings.revision,
    theme: settings.theme,
    css,
  });
}
