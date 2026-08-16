import { readSettings, themeCss } from "@/lib/settings";
import { ThemeClientSync } from "./ThemeClientSync";

/**
 * Injects live theme overrides as CSS custom properties.
 * 
 * Works on both SSR (style tag in document head) and Client hydration
 * (instant sync from /api/theme without waiting for cache invalidation).
 */
export async function ThemeVars() {
  const settings = await readSettings();
  const css = themeCss(settings.theme);

  return (
    <>
      {css && (
        <style
          id="alta-theme-overrides"
          dangerouslySetInnerHTML={{ __html: css }}
        />
      )}
      <ThemeClientSync initialCss={css} />
    </>
  );
}
