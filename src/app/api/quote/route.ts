import { NextResponse } from "next/server";
import {
  validateQuote,
  hasErrors,
  normalisePhone,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/validation";
import { saveSubmission, rateLimit, clientKey } from "@/lib/submissions";
import { recordEvent } from "@/lib/analytics";
import { microcopy } from "@/content/site";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Attachment = { name: string; size: number; type: string; data: string };

export async function POST(req: Request) {
  const limit = rateLimit(`quote:${clientKey(req)}`, 5);
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

  const attachment = body.attachment as Attachment | null | undefined;
  const errors = validateQuote({
    ...(body as Record<string, unknown>),
    attachmentName: attachment?.name,
    attachmentSize: attachment?.size,
  } as never);

  // Guard the byte length of the decoded payload too — `size` is client-stated
  // and a hostile caller can simply lie about it.
  if (attachment?.data && attachment.data.length * 0.75 > MAX_ATTACHMENT_BYTES) {
    errors.attachment = microcopy.fileTooLarge;
  }

  if (hasErrors(errors)) {
    await recordEvent({
      type: "form_submit",
      source: "quote",
      path: String(body.path ?? ""),
      meta: { validationFailed: true, fields: Object.keys(errors).join(",") },
    });
    return NextResponse.json(
      { ok: false, errors, message: microcopy.contactError },
      { status: 400 },
    );
  }

  const service = String(body.service ?? "");
  const scope = String(body.scope ?? "");

  const id = await saveSubmission(
    "quote",
    {
      fullName: String(body.fullName ?? ""),
      organisation: String(body.organisation ?? ""),
      jobTitle: String(body.jobTitle ?? ""),
      phone: normalisePhone(String(body.phone ?? "")),
      email: String(body.email ?? ""),
      service,
      city: String(body.city ?? ""),
      scope,
      timeline: String(body.timeline ?? ""),
      budget: String(body.budget ?? ""),
      preferredContact: String(body.preferredContact ?? ""),
      attachment: attachment
        ? {
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
            data: attachment.data,
          }
        : null,
      consent: true,
    },
    String(body.path ?? ""),
  );

  await recordEvent({
    type: "form_submit",
    source: "quote",
    path: String(body.path ?? ""),
    sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
    service,
    text: scope,
    elapsedMs: typeof body.elapsedMs === "number" ? body.elapsedMs : undefined,
    meta: {
      submissionId: id,
      hasAttachment: Boolean(attachment),
      city: String(body.city ?? ""),
    },
  });

  return NextResponse.json({ ok: true, id, message: microcopy.contactSuccess });
}
