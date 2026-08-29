/**
 * Client-safe half of `settings.ts`: types, constants and pure functions only
 * — nothing here touches `./store`, which pulls in `node:fs`.
 *
 * `SettingsClient.tsx` ("use client") needs `SiteSettings`/`ThemeOverrides`
 * and `themeCss` but must never import `./store` transitively — Turbopack
 * fails the client bundle outright if a server-only module (`node:fs`) ends
 * up in its import graph, which is exactly what happened when this lived
 * inside `settings.ts` alongside `readSettings`/`writeSettings`. `settings.ts`
 * re-exports everything here for its existing server-side callers, so this
 * split changes no import path except the client component's.
 */

export const SETTINGS_STORE = "alta-site-settings";
export const SETTINGS_KEY = "site-settings";

export type ThemeOverrides = {
  primary?: string;
  primaryContainer?: string;
  goldInk?: string;
  surface?: string;
  surfacePanel?: string;
  paper?: string;
};

export type ContentOverrides = {
  /** Home hero, when the client wants different words on the front page. */
  heroTitle?: string;
  heroTitleAccent?: string;
  heroEyebrow?: string;
  heroBody?: string;
  /** Additional announcement bar text. */
  announcement?: string;
  announcementActive?: boolean;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  crNumber?: string;
  allowedSenders?: string;
  wahaUrl?: string;
};

export type ImageOverrides = {
  hero?: string;
  about?: string;
  logo?: string;
};

export type SiteSettings = {
  theme: ThemeOverrides;
  content: ContentOverrides;
  images: ImageOverrides;
  updatedAt: string;
  updatedBy: string;
  /** Increments on every applied change — used for audit and rollback. */
  revision: number;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  theme: {},
  content: {},
  images: {},
  updatedAt: new Date(0).toISOString(),
  updatedBy: "system",
  revision: 0,
};

/** Keys an agent may set, mapped to the CSS variable they drive. */
export const THEME_VAR_MAP: Record<keyof ThemeOverrides, string> = {
  primary: "--color-primary",
  primaryContainer: "--color-primary-container",
  goldInk: "--color-gold-ink",
  surface: "--color-surface",
  surfacePanel: "--color-surface-panel",
  paper: "--color-paper",
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Reject anything that is not a plain hex colour — no `var()`, no `url()`. */
export function isValidColour(value: string) {
  return HEX.test(value.trim());
}

export function sanitiseTheme(input: Partial<ThemeOverrides>): ThemeOverrides {
  const out: ThemeOverrides = {};
  for (const key of Object.keys(THEME_VAR_MAP) as (keyof ThemeOverrides)[]) {
    const value = input[key];
    if (typeof value === "string" && isValidColour(value)) {
      out[key] = value.trim().toLowerCase();
    }
  }
  return out;
}

/** Serialise overrides into a CSS rule for the document root. */
export function themeCss(theme: ThemeOverrides): string {
  const decls = (Object.keys(THEME_VAR_MAP) as (keyof ThemeOverrides)[])
    .map((key) => {
      const value = theme[key];
      // Re-validate at render time: defence in depth against a store that was
      // written by an older, looser version of this code.
      if (!value || !isValidColour(value)) return null;
      return `${THEME_VAR_MAP[key]}:${value} !important`;
    })
    .filter(Boolean);

  if (theme.primary && isValidColour(theme.primary)) {
    decls.push(`--stroke-gold: color-mix(in srgb, ${theme.primary} 32%, transparent) !important`);
    decls.push(`--glow-gold: 0 12px 32px -10px color-mix(in srgb, ${theme.primary} 40%, transparent) !important`);
  }
  if (theme.primaryContainer && isValidColour(theme.primaryContainer)) {
    decls.push(`--color-secondary: ${theme.primaryContainer} !important`);
  }
  if (theme.surface && isValidColour(theme.surface)) {
    decls.push(`--page-base: ${theme.surface} !important`);
  }

  return decls.length ? `:root{${decls.join(";")}}` : "";
}
