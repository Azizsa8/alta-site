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
 *
 * Types, constants and pure helpers live in `settings.shared.ts` — the
 * client-safe half a "use client" component can import without pulling in
 * `./store` (and therefore `node:fs`) into its bundle. This file re-exports
 * them so existing server-side imports of `@/lib/settings` keep working
 * unchanged.
 */

import { get, put, listKeys } from "./store";
import {
  SETTINGS_STORE,
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  sanitiseTheme,
  type SiteSettings,
} from "./settings.shared";

export * from "./settings.shared";

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
