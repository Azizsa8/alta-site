---
name: Sovereign Gold & Midnight
colors:
  surface: '#091420'
  surface-dim: '#091420'
  surface-bright: '#2f3a48'
  surface-container-lowest: '#040f1b'
  surface-container-low: '#111c29'
  surface-container: '#16202d'
  surface-container-high: '#202b38'
  surface-container-highest: '#2b3643'
  on-surface: '#d8e3f5'
  on-surface-variant: '#d3c4b2'
  inverse-surface: '#d8e3f5'
  inverse-on-surface: '#26313e'
  outline: '#9b8f7e'
  outline-variant: '#4f4537'
  surface-tint: '#f2be62'
  primary: '#f7c366'
  on-primary: '#422c00'
  primary-container: '#d9a84e'
  on-primary-container: '#5a3e00'
  inverse-primary: '#7d5800'
  secondary: '#edc06b'
  on-secondary: '#412d00'
  secondary-container: '#6f4f00'
  on-secondary-container: '#f0c36e'
  tertiary: '#c1ccdf'
  on-tertiary: '#26313f'
  tertiary-container: '#a5b1c3'
  on-tertiary-container: '#384453'
  error: '#ff7070'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea9'
  primary-fixed-dim: '#f2be62'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5f4100'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#edc06b'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#d7e3f6'
  tertiary-fixed-dim: '#bcc7d9'
  on-tertiary-fixed: '#111c2a'
  on-tertiary-fixed-variant: '#3c4856'
  background: '#091420'
  on-background: '#d8e3f5'
  surface-variant: '#2b3643'
  surface-panel: '#0d1b29'
  surface-elevated: '#101f2e'
  text-primary: '#f7f8fb'
  text-muted: '#a8b2bf'
  stroke-gold: rgba(222,172,84,0.28)
  stroke-soft: rgba(255,255,255,0.08)
  success: '#56d28b'
  info: '#4b99ff'
typography:
  hero-title:
    fontFamily: Hanken Grotesk
    fontSize: 78px
    fontWeight: '800'
    lineHeight: '1.12'
    letterSpacing: -0.02em
  hero-title-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 44px
    fontWeight: '800'
    lineHeight: '1.2'
  section-title:
    fontFamily: Hanken Grotesk
    fontSize: 42px
    fontWeight: '700'
    lineHeight: '1.0'
  stat-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.0'
  subheading:
    fontFamily: Hanken Grotesk
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.8'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.9'
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.55'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin: 24px
  container-max: 1180px
  section-desktop: 72px
  section-mobile: 52px
  gap-grid: 60px
  gap-component: 24px
---

## Brand & Style

The design system for ALTA Investment Company is anchored in a **Corporate / Modern** aesthetic that leans heavily into **Dark Mode Luxury**. It is designed to evoke a sense of institutional stability, technological foresight, and premium service.

The brand personality is **Sovereign, Technical, and Precise**. It targets high-net-worth investors and institutional partners who value clarity, data-driven insights, and a sophisticated digital presence. The UI should feel like a high-end physical asset—solid, polished, and meticulously engineered. 

Key visual hallmarks include:
- **Data-Rich Futurism:** Using structural grids and "blueprint" lines to frame content.
- **Selective Brilliance:** A deep, monochromatic base punctuated by high-contrast gold highlights.
- **Architectural Layouts:** A focus on symmetry and tiered information density that balances high-level strategic messaging with granular performance metrics.

## Colors

This design system utilizes a "Midnight and Gold" palette to establish its premium positioning.

- **Primary & Secondary Gold:** Used for high-priority actions, brand marks, and key data highlights. The secondary gold (`#f0c36e`) is reserved for interactive states and primary buttons to ensure high visibility.
- **Core Backgrounds:** The base layer (`#06111d`) provides a deep, immersive canvas. Layered surfaces (`#0a1623`, `#0d1b29`) are used to create structural depth for dashboards and cards.
- **Strokes:** Borders are a critical part of the visual language. Use `stroke-soft` for general structural division and `stroke-gold` for emphasizing premium containers or active states.
- **Semantic Colors:** Green and red are strictly reserved for performance indicators (market trends, success states).

## Typography

The choice of **Hanken Grotesk** replaces the legacy system stack with a modern, clean, and highly legible grotesque that fits the "Technical Luxury" brief. It offers a professional, sharp appearance that scales beautifully from massive hero headings to tiny data labels.

- **Scale:** High contrast between Hero Titles and Body text creates a clear hierarchy.
- **Character:** Use a tight letter-spacing for large headlines to emphasize the "bold/impactful" nature of the company.
- **Data Display:** For numerical metrics, use the `stat-lg` style to ensure numbers are the focal point of the dashboard sections.
- **Arabic Support:** This system is built for RTL optimization; ensure the chosen typeface has robust character support for Arabic numerals and glyphs.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for desktop, centered within the viewport to maintain a sense of controlled, institutional order.

- **Grid Model:** Use a 12-column grid within the 1180px container. Large "Dashboard" elements should span 6 or 12 columns, while smaller metric cards span 3 or 4.
- **Gutter & Rhythm:** A strict 8px/16px rhythm maintains cleanliness. 
- **Sectioning:** Vertical separation between major content blocks is achieved via 72px padding and subtle 1px top borders (`stroke-soft`), rather than relying solely on whitespace. This mimics the look of a structured technical document.
- **Mobile Adaptivity:** On mobile, margins reduce to 16px and section padding to 52px. Column-based grids reflow into a single-column stack, maintaining the component-level gaps of 24px.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Subtle Glassmorphism** to create a sophisticated sense of hierarchy.

- **Stacking:** The deepest layer is the core background. Metric cards and dashboards sit one tier above (`surface-panel`), and active modals or headers sit on the highest tier (`surface-elevated`).
- **Glass Effects:** Use `backdrop-filter: blur(16px)` on the primary navigation bar with an 82% opacity background to create a "frosted glass" effect that allows background colors to bleed through without sacrificing legibility.
- **Shadows:** Avoid harsh, black shadows. Use large, diffused shadows with low opacity (`rgba(0,0,0,0.36)`) for main panels. For gold-accented elements like buttons or the logo, use a tinted outer glow (`rgba(217,168,78,0.18)`) to simulate light emission.
- **Glows:** Strategic use of radial gradients (8-12% opacity gold) behind key UI sections can be used to guide the eye toward primary conversion points or data metrics.

## Shapes

The shape language is **Rounded**, balancing the industrial nature of the dark palette with approachable, modern corners.

- **Standard Radius:** 0.5rem (8px) is the baseline.
- **Large Radius:** 1rem (16px) to 1.125rem (18px) for major dashboard panels and section containers to soften the "tech" look.
- **Interactive Radius:** Buttons use a tighter 10px radius to appear more precise and clickable.
- **Pill Shapes:** Use `rounded-full` (999px) exclusively for eyebrow tags, badges, and status chips to distinguish them from structural elements.

## Components

### Buttons
- **Primary:** Gold background (`primary_color_hex`) with dark text. Apply a subtle 2px vertical lift and brightness increase on hover.
- **Secondary:** Transparent background with a `stroke-gold` border and gold text.
- **Size:** Maintain a generous touch target (minimum 48px height for mobile).

### Cards & Metrics
- **Metric Cards:** Use `surface-panel` backgrounds with `stroke-soft` borders. Numbers should be prominent (`stat-lg`).
- **Investment Cards:** Feature a top-aligned thumbnail image or icon, followed by a section title and body text. On hover, the border color should transition from `stroke-soft` to `primary_color_hex`.

### Input Fields
- Dark backgrounds (`surface-elevated`) with a 1px border. The border should turn gold on focus.
- Placeholder text uses the `text-muted` color.

### Navigation
- Sticky header with blur effects. Use a gold underline animation that expands from the center on hover for menu items.

### Success/Error Indicators
- Use small, high-contrast badges or arrows next to metrics. Use `success` green for growth and `error` red for decline, accompanied by relevant Unicode symbols (▲ / ▼).