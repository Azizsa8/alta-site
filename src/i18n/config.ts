/**
 * Locale primitives.
 *
 * Arabic is the source language, not a translation: every string in
 * `src/content` is transcribed from the client's approved document. English is
 * a derived layer, and it must never silently diverge from it — see `Widen`
 * below, which is what makes that a compile error rather than a blank on the
 * page.
 */

export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

/**
 * Arabic is the default and owns the bare URLs. The site is an Arabic-first
 * Saudi corporate site; English is the secondary audience.
 */
export const defaultLocale: Locale = "ar";

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

/** Writing direction. Drives <html dir> and every logical CSS property. */
export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Widens a literal-typed content tree into its structural shape.
 *
 * The Arabic content modules are declared `as const`, so their type is a tree
 * of string LITERALS — `"من نحن"`, not `string`. An English mirror typed
 * directly against them could therefore never compile, because "About us" is
 * not assignable to "من نحن".
 *
 * `Widen` maps that tree to the same shape with every leaf relaxed to `string`
 * and readonly stripped. Typing the English module as `Widen<typeof arabic>`
 * gives exactly the guarantee that matters: the two locales must have the same
 * keys, the same nesting and the same array shapes, but may hold different
 * text. Add a key to Arabic and English fails to build until it is translated;
 * delete one and the stale English key is flagged.
 *
 * This is the whole reason the site can carry two locales without a
 * translation-management service.
 */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends null
        ? null
        : T extends readonly (infer U)[]
          ? Widen<U>[]
          : { -readonly [K in keyof T]: Widen<T[K]> };
