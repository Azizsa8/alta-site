/**
 * One validation module, imported by both the client form and the API route.
 *
 * Client-side validation is a UX affordance and nothing more — it can be
 * bypassed trivially — so the route re-runs the *same* functions on the raw
 * body before anything is persisted. Sharing the code is what guarantees the
 * two can't drift apart.
 */

import { microcopy } from "@/content/site";

export type Errors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Saudi mobile: 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX or 009665XXXXXXXX. */
const KSA_MOBILE = /^(?:\+?966|00966|0)?5\d{8}$/;

export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export function normalisePhone(raw: string) {
  // Arabic-Indic digits are common on Saudi keyboards; fold them to ASCII so
  // one regex covers both, then drop separators.
  const ascii = raw.replace(/[٠-٩]/g, (d) =>
    String(d.charCodeAt(0) - 0x0660),
  );
  return ascii.replace(/[\s()\-.]/g, "");
}

function req(errors: Errors, key: string, value: string) {
  if (!value || !value.trim()) errors[key] = microcopy.requiredField;
}

export type ContactInput = {
  fullName: string;
  organisation?: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  consent: boolean;
};

export function validateContact(input: Partial<ContactInput>): Errors {
  const e: Errors = {};
  req(e, "fullName", input.fullName ?? "");
  req(e, "phone", input.phone ?? "");
  req(e, "subject", input.subject ?? "");
  req(e, "message", input.message ?? "");

  if (input.phone && !KSA_MOBILE.test(normalisePhone(input.phone))) {
    e.phone = "يرجى إدخال رقم جوال سعودي صحيح.";
  }
  // Email is optional on the general contact form, but must be valid if given.
  if (input.email && input.email.trim() && !EMAIL.test(input.email.trim())) {
    e.email = microcopy.invalidEmail;
  }
  if (!input.consent) e.consent = microcopy.requiredField;
  return e;
}

export type QuoteInput = {
  fullName: string;
  organisation: string;
  jobTitle?: string;
  phone: string;
  email: string;
  service: string;
  city?: string;
  scope: string;
  timeline?: string;
  budget?: string;
  preferredContact?: string;
  attachmentName?: string;
  attachmentSize?: number;
  consent: boolean;
};

export function validateQuote(input: Partial<QuoteInput>): Errors {
  const e: Errors = {};
  req(e, "fullName", input.fullName ?? "");
  req(e, "organisation", input.organisation ?? "");
  req(e, "phone", input.phone ?? "");
  req(e, "email", input.email ?? "");
  req(e, "service", input.service ?? "");
  req(e, "scope", input.scope ?? "");

  if (input.phone && !KSA_MOBILE.test(normalisePhone(input.phone))) {
    e.phone = "يرجى إدخال رقم جوال سعودي صحيح.";
  }
  if (input.email && input.email.trim() && !EMAIL.test(input.email.trim())) {
    e.email = microcopy.invalidEmail;
  }
  if ((input.attachmentSize ?? 0) > MAX_ATTACHMENT_BYTES) {
    e.attachment = microcopy.fileTooLarge;
  }
  if (!input.consent) e.consent = microcopy.requiredField;
  return e;
}

export const hasErrors = (e: Errors) => Object.keys(e).length > 0;
