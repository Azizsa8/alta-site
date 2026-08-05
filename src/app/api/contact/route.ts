import { NextResponse } from "next/server";
import { validateContact, hasErrors, normalisePhone } from "@/lib/validation";
import { saveSubmission, rateLimit, clientKey } from "@/lib/submissions";
import { recordEvent } from "@/lib/analytics";
import { microcopy } from "@/content/site";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const limit = rateLimit(`contact:${clientKey(req)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: "تم تجاوز الحد المسموح. يرجى المحاولة بعد قليل." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: microcopy.contactError },
      { status: 400 },
    );
  }

  // Re-run the *same* validation the client ran; the client's pass is only UX.
  const errors = validateContact(body as never);
  if (hasErrors(errors)) {
    await recordEvent({
      type: "form_submit",
      source: "contact",
      path: String(body.path ?? ""),
      meta: { validationFailed: true, fields: Object.keys(errors).join(",") },
    });
    return NextResponse.json(
      { ok: false, errors, message: microcopy.contactError },
      { status: 400 },
    );
  }

  const subject = String(body.subject ?? "");
  const message = String(body.message ?? "");

  const id = await saveSubmission(
    "contact",
    {
      fullName: String(body.fullName ?? ""),
      organisation: String(body.organisation ?? ""),
      phone: normalisePhone(String(body.phone ?? "")),
      email: String(body.email ?? ""),
      subject,
      message,
      consent: true,
    },
    String(body.path ?? ""),
  );

  // The analytics event stores the message text but no contact details —
  // behaviour analysis never needs to know who wrote it.
  await recordEvent({
    type: "form_submit",
    source: "contact",
    path: String(body.path ?? ""),
    sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
    service: subject,
    text: `${subject} — ${message}`,
    elapsedMs: typeof body.elapsedMs === "number" ? body.elapsedMs : undefined,
    meta: { submissionId: id },
  });

  return NextResponse.json({ ok: true, id, message: microcopy.contactSuccess });
}
