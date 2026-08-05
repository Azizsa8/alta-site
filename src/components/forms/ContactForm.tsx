"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  TextField,
  TextArea,
  ConsentField,
  FormStatus,
  SelectField,
} from "./Field";
import { validateContact, hasErrors, type Errors } from "@/lib/validation";
import { microcopy } from "@/content/site";
import { services } from "@/content/services";

const SUBJECTS = [
  { value: "general", label: "استفسار عام" },
  { value: "quote", label: "طلب عرض سعر" },
  { value: "partnership", label: "شراكة أو توريد" },
  { value: "careers", label: "التقديم على وظيفة" },
  { value: "support", label: "متابعة مشروع قائم" },
  ...services.map((s) => ({ value: s.slug, label: s.title })),
];

const EMPTY = {
  fullName: "",
  organisation: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm({ defaultTopic = "" }: { defaultTopic?: string }) {
  const [form, setForm] = useState({ ...EMPTY, subject: defaultTopic });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [busy, setBusy] = useState(false);
  /** Timestamp of first interaction — the API uses it as a bot heuristic. */
  const [startedAt] = useState(() => Date.now());

  const set = (k: keyof typeof EMPTY) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateContact({ ...form, consent });
    setErrors(found);
    if (hasErrors(found)) {
      setState("error");
      return;
    }

    setBusy(true);
    setState("idle");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          consent,
          elapsedMs: Date.now() - startedAt,
          path: window.location.pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data?.errors ?? {});
        setState("error");
        return;
      }
      setState("success");
      setForm({ ...EMPTY });
      setConsent(false);
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormStatus
        state={state}
        successMessage={microcopy.contactSuccess}
        errorMessage={microcopy.contactError}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="fullName"
          label="الاسم الكامل"
          required
          value={form.fullName}
          onChange={set("fullName")}
          error={errors.fullName}
        />
        <TextField
          id="organisation"
          label="اسم المنشأة"
          value={form.organisation}
          onChange={set("organisation")}
          error={errors.organisation}
        />
        <TextField
          id="phone"
          label="رقم الجوال"
          required
          type="tel"
          inputMode="tel"
          placeholder="05XXXXXXXX"
          value={form.phone}
          onChange={set("phone")}
          error={errors.phone}
        />
        <TextField
          id="email"
          label="البريد الإلكتروني"
          type="email"
          inputMode="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
      </div>

      <SelectField
        id="subject"
        label="موضوع الرسالة"
        required
        value={form.subject}
        onChange={set("subject")}
        options={SUBJECTS}
        error={errors.subject}
      />

      <TextArea
        id="message"
        label="الرسالة"
        required
        rows={6}
        placeholder="اشرح لنا احتياجك بإيجاز…"
        value={form.message}
        onChange={set("message")}
        error={errors.message}
      />

      <ConsentField
        id="consent"
        checked={consent}
        onChange={setConsent}
        error={errors.consent}
      />

      <Button type="submit" size="lg" disabled={busy} withArrow>
        {busy ? "جارٍ الإرسال…" : "إرسال الطلب"}
      </Button>
    </form>
  );
}
