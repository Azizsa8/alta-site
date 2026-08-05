"use client";

import { microcopy } from "@/content/site";

const control =
  "w-full rounded-md border b-ink bg-paper px-4 py-3 text-[14px] text-ink " +
  "placeholder:text-ink-muted/60 transition-colors " +
  "focus:border-[color:var(--color-primary-container)] focus:outline-none " +
  "aria-[invalid=true]:border-danger";

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold text-ink">
      {children}
      {required && (
        <span className="text-danger" aria-hidden>
          {" "}
          *
        </span>
      )}
    </label>
  );
}

function Error({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[12px] text-danger">
      {message}
    </p>
  );
}

type Common = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function TextField({
  id,
  label,
  required,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  className = "",
}: Common & {
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={control}
      />
      <Error id={`${id}-error`} message={error} />
    </div>
  );
}

export function TextArea({
  id,
  label,
  required,
  error,
  value,
  onChange,
  placeholder,
  rows = 5,
  className = "",
}: Common & { rows?: number }) {
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${control} resize-y`}
      />
      <Error id={`${id}-error`} message={error} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  required,
  error,
  value,
  onChange,
  options,
  placeholder = "اختر…",
  className = "",
}: Common & { options: { value: string; label: string }[] }) {
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={control}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Error id={`${id}-error`} message={error} />
    </div>
  );
}

export function ConsentField({
  id,
  checked,
  onChange,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          className="mt-0.5 size-4 shrink-0 accent-[color:var(--color-primary-container)]"
        />
        <span className="text-[13px] leading-[1.8] text-ink-muted">
          {microcopy.privacyConsent}{" "}
          <a href="/privacy-policy" className="text-gold-ink underline">
            (اقرأ السياسة)
          </a>
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        </span>
      </label>
      <Error id={`${id}-error`} message={error} />
    </div>
  );
}

/** Result banner shown after a submission attempt. */
export function FormStatus({
  state,
  successMessage,
  errorMessage,
}: {
  state: "idle" | "success" | "error";
  successMessage: string;
  errorMessage: string;
}) {
  if (state === "idle") return null;
  const ok = state === "success";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-lg border p-5 text-[13.5px] leading-[1.9] ${
        ok
          ? "border-[color:var(--color-success)] bg-success/10 text-ink"
          : "border-danger bg-danger/10 text-ink"
      }`}
    >
      {ok ? successMessage : errorMessage}
    </div>
  );
}
