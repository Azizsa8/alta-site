/**
 * Live site settings.
 *
 * This is what makes a WhatsApp-driven theme change actually visible: the
 * agent writes here, and `<ThemeVars>` in the root layout reads here and emits
 * CSS custom-property overrides. No rebuild, no deploy.
 *
 * Only a small, explicitly allow-listed set of keys is overridable. An agent
 * that could write arbitrary CSS would be a remote-defacement vector; an agent
 * that can only move six named colours cannot be.
 */

import { get, put, listKeys } from "./store";

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

export async function readSettings(): Promise<SiteSettings> {
  const stored = await get<SiteSettings>(SETTINGS_STORE, SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    theme: { ...stored.theme },
    content: { ...stored.content },
    images: { ...stored.images },
  };
}

export async function writeSettings(
  patch: Partial<Pick<SiteSettings, "theme" | "content" | "images">>,
  updatedBy: string,
): Promise<SiteSettings> {
  const current = await readSettings();
  const next: SiteSettings = {
    theme: { ...current.theme, ...sanitiseTheme(patch.theme ?? {}) },
    content: { ...current.content, ...(patch.content ?? {}) },
    images: { ...current.images, ...(patch.images ?? {}) },
    updatedAt: new Date().toISOString(),
    updatedBy,
    revision: current.revision + 1,
  };
  await put(SETTINGS_STORE, SETTINGS_KEY, next);
  // Keep an immutable history entry so any revision can be restored.
  await put(SETTINGS_STORE, `history/${String(next.revision).padStart(6, "0")}`, next);
  return next;
}

export async function restoreRevision(revision: number, by: string) {
  // Revision 0 is the pristine approved site. It is never written to history
  // (nothing has been changed yet), so it has to be handled explicitly —
  // otherwise "roll back everything" is the one rollback that fails.
  const snapshot =
    revision === 0
      ? DEFAULT_SETTINGS
      : await get<SiteSettings>(
          SETTINGS_STORE,
          `history/${String(revision).padStart(6, "0")}`,
        );
  if (!snapshot) return null;

  // Restoring must *replace*, not merge — writeSettings merges by design, so a
  // rollback that went through it would keep the very keys it is undoing.
  const current = await readSettings();
  const next: SiteSettings = {
    theme: sanitiseTheme(snapshot.theme),
    content: { ...snapshot.content },
    images: { ...snapshot.images },
    updatedAt: new Date().toISOString(),
    updatedBy: `${by} (restore r${revision})`,
    revision: current.revision + 1,
  };
  await put(SETTINGS_STORE, SETTINGS_KEY, next);
  await put(SETTINGS_STORE, `history/${String(next.revision).padStart(6, "0")}`, next);
  return next;
}

export async function listRevisions(): Promise<SiteSettings[]> {
  const keys = await listKeys(SETTINGS_STORE, "history/");
  if (!keys.length) return [];
  const entries = await Promise.all(
    keys.map((k) => get<SiteSettings>(SETTINGS_STORE, k)),
  );
  return (entries.filter((e) => e !== null) as SiteSettings[]).sort(
    (a, b) => b.revision - a.revision,
  );
}

/** Serialise overrides into a CSS rule for the document root. */
export function themeCss(theme: ThemeOverrides): string {
  const decls = (Object.keys(THEME_VAR_MAP) as (keyof ThemeOverrides)[])
    .map((key) => {
      const value = theme[key];
      // Re-validate at render time: defence in depth against a store that was
      // written by an older, looser version of this code.
      if (!value || !isValidColour(value)) return null;
      return `${THEME_VAR_MAP[key]}:${value}`;
    })
    .filter(Boolean);
  return decls.length ? `:root{${decls.join(";")}}` : "";
}
