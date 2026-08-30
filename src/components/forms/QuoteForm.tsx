"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField, TextArea, SelectField, ConsentField, FormStatus } from "./Field";
import {
  validateQuote,
  hasErrors,
  MAX_ATTACHMENT_BYTES,
  type Errors,
} from "@/lib/validation";
import { microcopy } from "@/content/site";
import { services } from "@/content/services";
import { serviceSectors } from "@/content/serviceSectors";

const CONTACT_METHODS = [
  { value: "phone", label: "مكالمة هاتفية" },
  { value: "whatsapp", label: "واتساب" },
  { value: "email", label: "البريد الإلكتروني" },
];

const EMPTY = {
  fullName: "",
  organisation: "",
  jobTitle: "",
  phone: "",
  email: "",
  sector: "",
  service: "",
  city: "",
  scope: "",
  timeline: "",
  budget: "",
  preferredContact: "",
};

type Attachment = { name: string; size: number; type: string; data: string };

export function QuoteForm({ defaultService = "" }: { defaultService?: string }) {
  // Arriving from a service page (?service=slug) should pre-fill the sector
  // too, so the visitor never has to re-state something the link already knew.
  const defaultSector =
    serviceSectors.find((x) => x.serviceSlugs.includes(defaultService))?.id ?? "";
  const [form, setForm] = useState({
    ...EMPTY,
    sector: defaultSector,
    service: defaultService,
  });
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const set = (k: keyof typeof EMPTY) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  /**
   * Picking a sector narrows the service list to that sector. A service left
   * selected from a different sector would otherwise stay submitted while
   * invisible in the narrowed dropdown, so it is cleared on mismatch.
   */
  const setSector = (v: string) =>
    setForm((f) => {
      const allowed = serviceSectors.find((x) => x.id === v)?.serviceSlugs ?? [];
      const keep = !v || allowed.includes(f.service);
      return { ...f, sector: v, service: keep ? f.service : "" };
    });

  const serviceOptions = (
    form.sector
      ? services.filter((sv) =>
          serviceSectors
            .find((x) => x.id === form.sector)
            ?.serviceSlugs.includes(sv.slug),
        )
      : services
  ).map((sv) => ({ value: sv.slug, label: sv.title }));

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setAttachment(null);
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setErrors((x) => ({ ...x, attachment: microcopy.fileTooLarge }));
      e.target.value = "";
      setAttachment(null);
      return;
    }
    // Base64 keeps the whole submission in one JSON POST — no separate upload
    // endpoint or object store to operate for a 4 MB scope document.
    const data = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    setErrors((x) => ({ ...x, attachment: "" }));
    setAttachment({ name: file.name, size: file.size, type: file.type, data });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateQuote({
      ...form,
      consent,
      attachmentName: attachment?.name,
      attachmentSize: attachment?.size,
    });
    setErrors(found);
    if (hasErrors(found)) {
      setState("error");
      return;
    }

    setBusy(true);
    setState("idle");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          consent,
          attachment,
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
      setAttachment(null);
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
          label="اسم مقدم الطلب"
          required
          value={form.fullName}
          onChange={set("fullName")}
          error={errors.fullName}
        />
        <TextField
          id="organisation"
          label="اسم المنشأة"
          required
          value={form.organisation}
          onChange={set("organisation")}
          error={errors.organisation}
        />
        <TextField
          id="jobTitle"
          label="المسمى الوظيفي"
          value={form.jobTitle}
          onChange={set("jobTitle")}
          error={errors.jobTitle}
        />
        <TextField
          id="city"
          label="المدينة وموقع المشروع"
          value={form.city}
          onChange={set("city")}
          error={errors.city}
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
          required
          type="email"
          inputMode="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id="sector"
          label="القطاع"
          value={form.sector}
          onChange={setSector}
          options={serviceSectors.map((x) => ({ value: x.id, label: x.title }))}
          error={errors.sector}
        />
        <SelectField
          id="service"
          label="الخدمة المطلوبة"
          required
          value={form.service}
          onChange={set("service")}
          options={serviceOptions}
          error={errors.service}
        />
      </div>

      <TextArea
        id="scope"
        label="وصف الاحتياج أو نطاق العمل"
        required
        rows={6}
        placeholder="ما التحدي الذي تريد حله؟ وما المخرجات المتوقعة؟"
        value={form.scope}
        onChange={set("scope")}
        error={errors.scope}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          id="timeline"
          label="المدة أو تاريخ البدء المتوقع"
          value={form.timeline}
          onChange={set("timeline")}
          error={errors.timeline}
        />
        <TextField
          id="budget"
          label="الميزانية التقديرية – اختياري"
          value={form.budget}
          onChange={set("budget")}
          error={errors.budget}
        />
        <SelectField
          id="preferredContact"
          label="طريقة التواصل المفضلة"
          value={form.preferredContact}
          onChange={set("preferredContact")}
          options={CONTACT_METHODS}
          error={errors.preferredContact}
        />
      </div>

      <div>
        <label
          htmlFor="attachment"
          className="mb-2 block text-[13px] font-semibold text-ink"
        >
          إرفاق الملفات{" "}
          <span className="font-normal text-ink-muted">
            (حتى {MAX_ATTACHMENT_BYTES / 1024 / 1024} ميجابايت)
          </span>
        </label>
        <input
          id="attachment"
          name="attachment"
          type="file"
          onChange={onFile}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          className="w-full rounded-md border b-ink bg-paper px-4 py-3 text-[13px] text-ink-muted file:me-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-on-primary"
        />
        {attachment && (
          <p className="mt-1.5 text-[12px] text-ink-muted">
            تم إرفاق: {attachment.name} ({Math.round(attachment.size / 1024)} كيلوبايت)
          </p>
        )}
        {errors.attachment && (
          <p role="alert" className="mt-1.5 text-[12px] text-danger">
            {errors.attachment}
          </p>
        )}
      </div>

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
