---
version: alpha
name: NutriLog
description: A focused nutrition journal with system-aware light and dark surfaces and blue-shifted green signals.
colors:
  background: "#F3F8F6"
  ambient: "#D8EEE7"
  bar-surface: "#E2EFEA"
  surface: "#FFFFFF"
  raised: "#F9FCFB"
  surface-danger: "#FFF0EF"
  border: "#D0DFDA"
  border-strong: "#9BB9B1"
  border-subtle: "#E3ECE9"
  text: "#17312D"
  muted: "#526B66"
  primary: "#16836F"
  primary-strong: "#126B5A"
  primary-soft: "#DCEFE9"
  icon: "#16836F"
  on-primary: "#FFFFFF"
  danger: "#B8474B"
  danger-strong: "#8D3036"
  warning: "#805711"
  info: "#246D7B"
darkColors:
  background: "#0B1C1A"
  ambient: "#215B52"
  surface: "#102522"
  bar-surface: "#16332F"
  raised: "#183431"
  surface-danger: "#492A2B"
  border: "#35534F"
  border-strong: "#5D887F"
  border-subtle: "#253D39"
  text: "#F3FBF8"
  muted: "#B5CBC6"
  primary: "#49CDB2"
  primary-strong: "#9AE8D7"
  primary-soft: "#1C4842"
  icon: "#9AE8D7"
  on-primary: "#06211C"
  danger: "#FF9995"
  danger-strong: "#FFC0BC"
  warning: "#F3D18C"
  info: "#A0D7DF"
typography:
  sans:
    fontFamily: "Noto Sans, ui-sans-serif, system-ui, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
rounded:
  sm: "0.5rem"
  md: "0.875rem"
  lg: "1.125rem"
  pill: "999px"
spacing:
  page-max: "72rem"
  section-gap: "2rem"
components:
  button: { }
  input: { }
  navigation: { }
  nutrition-summary: { }
---

# NutriLog Design System

## Overview

### Creative North Star

NutriLog is a calm nutrition journal with a bright, low-glare default and an optional deep teal dark theme. The food lookup and nutrition-per-100-g clarity of TablicaKalorijnosti.ru inform the product structure. The supplied sports dashboards inform the blue-green accent color, without importing betting or match-day imagery.

### Product context and register

- **Audience and primary job:** People who track their nutrition; record food and portions, then compare daily intake with personal goals.
- **Target market(s) and evidence:** Russian, Ukrainian, and English interface locales are confirmed. No geographic market is specified.
- **Locale(s) and language policy:** `ru`, `uk`, and `en`; interface labels come from locale JSON messages.
- **Usage scene:** Frequent short check-ins on desktop or mobile, often while adding a meal; dense numeric content must remain scannable.
- **Register:** Product UI across diary, catalog, profile, and authentication routes.
- **Memorable signature:** Daily nutrition values read as a compact, aligned summary, with blue-green progress marks on soft, neutral surfaces.
- **Restraint:** Food names, amounts, and macro values remain primary. Accent color is reserved for actions, selected states, and progress.
- **Anti-references:** Betting controls, scores, odds, neon-green glow, and decorative sports imagery; light generic dashboard cards; low-contrast gray text.
- **Token ownership/runtime mapping:** Runtime CSS variables in `apps/web/src/app/globals.scss` own the rendered values. This file mirrors those semantic tokens. `apps/web/src/app/globals.scss` → CSS Modules → shared and route components; keep this mapping aligned when tokens change.

## Colors

The default system-aware light canvas is soft and neutral, with white panels and clear borders. The optional dark theme uses the existing near-black canvas and deep teal surfaces. Fixed navigation bars use a distinct teal-tinted surface in both themes so they remain visible above the page. Both themes retain the same blue-shifted green accent family, with contrast-adjusted token values for readable text and controls. Danger, warning, and information each have a separate semantic color. Controls, selection, focus, and progress use semantic tokens; route styles do not carry independent hex values.

## Typography

Use Noto Sans for a consistent, readable interface across Latin and Cyrillic locales, with system sans-serif fallbacks. Headings are compact and semibold; the public landing uses a clear, restrained headline. Data uses aligned numerals (`font-variant-numeric: tabular-nums`). Labels remain sentence case. Do not use display or monospace type as decoration.

## Layout

The public landing pairs the offer and registration action with a clearly labeled sample of the daily nutrition summary. The signed-in content uses a centered maximum width of 72rem. The diary summary pairs a circular calorie-share view of protein, fat, and carbohydrates with aligned daily totals; meal groups stack vertically and use headings as separators. Catalog results keep each product name, serving basis, and nutrition values together. Auth and profile forms stay narrow and single-column. Main mobile content has at least 1rem side padding; controls target 44px or more for touch.

## Elevation & Depth

Use tonal separation and thin teal borders. Avoid ambient glow and glass effects. A subtle, soft shadow is reserved for a clearly raised layer if needed; borders are sufficient for ordinary lists and sections.

## Shapes

Inputs, buttons, and result panels use consistent rounded corners: 0.5rem for controls and 0.875–1.125rem for larger surfaces. Small state markers may be pill-shaped. Keep nutrition rows and meal lists open rather than nesting same-sized cards.

## Components

### Foundational visual states

Interactive controls expose hover, focus-visible, active, disabled, loading, and error states. Focus uses a soft, visible primary-color halo without adding a hard control border. Disabled controls reduce contrast without becoming unreadable. Errors use both text and danger color; loading and empty states preserve their place in the flow.

### Buttons and actions

Primary actions use a filled blue-green surface and strong foreground contrast. Secondary actions use a transparent or surface background with a border. Destructive actions remain visually distinct and never share the primary accent.

### Navigation and data display

The top navigation remains present on all routes and wraps into a compact mobile layout. Current navigation uses a low-contrast teal surface and clear text. Macro values align consistently and preserve units and serving basis.

### Forms and overlays

Use native inputs and selects with themed browser controls, visible labels, persistent focus rings, and clear validation states. Search and date controls remain keyboard-operable. Borderless locale and theme menus open above the fixed footer; mobile navigation opens below the fixed header.

The footer contains the searchable locale dropdown and theme control. Language names stay in their native writing systems; the globe and theme icons have localized accessible names. The locale search supports arrow-key navigation and Enter to select, and Escape closes the list. On first visit, a supported browser language is selected; Ukrainian is the fallback.

The theme control is a borderless icon dropdown for system, light, and dark. Its trigger shows the active mode icon, and the menu lists the three existing icons with localized accessible names. Locale and theme icons use the same size and color in both themes. The light theme has a subtle teal gradient; dark mode uses brighter blue-green surfaces while retaining the same palette.

### Iconography

Use crisp inline SVGs with the same rounded stroke style as the footer controls for profile and sign-out actions. Icon-only actions keep localized accessible names and tooltips; do not use emoji or decorative Unicode as icons.

### Motion

Use one short GSAP timeline on the public landing to connect its headline to the labeled nutrition preview. AutoAnimate handles dynamic list and form-message changes. Keep hover and selection feedback short; do not add repeated scroll reveals. Respect `prefers-reduced-motion` by skipping the landing timeline; AutoAnimate disables its motion automatically.

### Content and data visualization

Nutrition totals retain explicit units. Progress is shown with a labeled native progress element and numeric remaining amount, so color is not the only signal. Food values retain their per-100-g context.

## Do's and Don'ts

- **Do:** Use the same semantic tokens and control states on diary, catalog, profile, and authentication screens.
- **Do:** Keep diary totals and food nutrition values easy to compare at a glance.
- **Don't:** Use a neon glow or full-bleed green as the default surface.
- **Don't:** hide serving units, error text, keyboard focus, or selected-state labels.
