import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminRequest, SESSION_COOKIE } from "@/lib/adminAuth";
import {
  readSettings,
  writeSettings,
  restoreRevision,
  listRevisions,
  DEFAULT_SETTINGS,
} from "@/lib/settings";
import { backendName } from "@/lib/store";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const jar = await cookies();
  if (!isAdminRequest(req, jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const [settings, revisions] = await Promise.all([
    readSettings(),
    listRevisions(),
  ]);

  return NextResponse.json({
    ok: true,
    backend: backendName(),
    settings,
    revisions,
  });
}

export async function POST(req: Request) {
  const jar = await cookies();
  if (!isAdminRequest(req, jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const patch = {
    theme: typeof body.theme === "object" && body.theme !== null ? body.theme : undefined,
    content: typeof body.content === "object" && body.content !== null ? body.content : undefined,
    images: typeof body.images === "object" && body.images !== null ? body.images : undefined,
  };

  const updatedBy = (typeof body.updatedBy === "string" && body.updatedBy.trim())
    ? body.updatedBy.trim()
    : "admin-dashboard";

  const next = await writeSettings(patch as never, updatedBy);

  try {
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
  } catch {
    /* ignore outside request scope */
  }

  return NextResponse.json({ ok: true, settings: next });
}

export async function PUT(req: Request) {
  const jar = await cookies();
  if (!isAdminRequest(req, jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  if (body.reset === true) {
    const next = await writeSettings(DEFAULT_SETTINGS, "admin-reset");
    try {
      revalidatePath("/", "layout");
    } catch {
      /* ignore */
    }
    return NextResponse.json({ ok: true, settings: next });
  }

  const revision = typeof body.revision === "number" ? body.revision : Number(body.revision);
  if (Number.isFinite(revision)) {
    const restored = await restoreRevision(revision, "admin-dashboard");
    if (!restored) {
      return NextResponse.json({ ok: false, error: "revision not found" }, { status: 404 });
    }
    try {
      revalidatePath("/", "layout");
    } catch {
      /* ignore */
    }
    return NextResponse.json({ ok: true, settings: restored });
  }

  return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
}
