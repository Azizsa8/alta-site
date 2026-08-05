import { readSettings, themeCss } from "@/lib/settings";

/**
 * Injects live theme overrides as CSS custom properties.
 *
 * Rendered in the root layout, after globals.css, so `:root{--color-primary:…}`
 * wins over the compiled default. Values are hex-validated in `themeCss`, so
 * nothing here can become a CSS injection vector.
 */
export async function ThemeVars() {
  const settings = await readSettings();
  const css = themeCss(settings.theme);
  if (!css) return null;
  return <style id="alta-theme-overrides">{css}</style>;
}
