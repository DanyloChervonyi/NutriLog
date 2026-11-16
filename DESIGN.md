---
version: alpha
name: NutriLog
description: A focused nutrition journal with cool, dark surfaces and blue-shifted green signals.
colors:
  background: "#071514"
  ambient: "#184E46"
  surface: "#0D201F"
  raised: "#132B2B"
  surface-danger: "#3C2022"
  border: "#294443"
  border-strong: "#47716A"
  border-subtle: "#1A302E"
  text: "#EEF7F4"
  muted: "#A8BFBB"
  primary: "#39BFA7"
  primary-strong: "#8BE2CE"
  primary-soft: "#143B38"
  on-primary: "#06211C"
  danger: "#F08483"
  danger-strong: "#FFB6B3"
  warning: "#E9C47B"
  info: "#8EC5D0"
typography:
  sans:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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

NutriLog is a personal nutrition field console: a calm, dark instrument surface that keeps the daily food record legible at a glance. The food lookup and nutrition-per-100-g clarity of TablicaKalorijnosti.ru inform the product structure. The supplied sports dashboards inform contrast and color energy, without importing betting or match-day imagery.

### Product context and register

- **Audience and primary job:** People who track their nutrition; record food and portions, then compare daily intake with personal goals.
- **Target market(s) and evidence:** Russian, Ukrainian, and English interface locales are confirmed. No geographic market is specified.
- **Locale(s) and language policy:** `ru`, `uk`, and `en`; interface labels come from locale JSON messages.
- **Usage scene:** Frequent short check-ins on desktop or mobile, often while adding a meal; dense numeric content must remain scannable.
- **Register:** Product UI across diary, catalog, profile, and authentication routes.
- **Memorable signature:** Daily nutrition values read as a compact, aligned signal board, with blue-green progress marks against deep teal-black surfaces.
- **Restraint:** Food names, amounts, and macro values remain primary. Accent color is reserved for actions, selected states, and progress.
- **Anti-references:** Betting controls, scores, odds, neon-green glow, and decorative sports imagery; light generic dashboard cards; low-contrast gray text.
- **Token ownership/runtime mapping:** Runtime CSS variables in `apps/web/src/app/globals.scss` own the rendered values. This file mirrors those semantic tokens. `apps/web/src/app/globals.scss` → CSS Modules → shared and route components; keep this mapping aligned when tokens change.

## Colors

The canvas is near-black with a subtle green-blue cast. Content panels use a distinct deep teal layer; raised panels are lighter by tone, not by a broad shadow. Primary green shifts toward turquoise (`primary`) for clear progress and selected controls. The supplied sports references contribute cool dark surfaces and contrast, while the food reference informs quick food lookup and visible nutrition values. Foreground is soft white; secondary text is pale teal and must remain readable. Danger, warning, and information each have a separate semantic color. Controls, selection, focus, and progress use semantic tokens; route styles do not carry independent hex values.

## Typography

Use Noto Sans for a consistent, readable interface across Latin and Cyrillic locales, with system sans-serif fallbacks. Headings are compact and semibold; the public landing uses a clear, restrained headline. Data uses aligned numerals (`font-variant-numeric: tabular-nums`). Labels remain sentence case. Do not use display or monospace type as decoration.

## Layout

The public landing pairs the offer and registration action with a clearly labeled sample of the daily nutrition summary. The signed-in content uses a centered maximum width of 72rem. Diary summaries and meal lists use a compact desktop grid, then collapse to one column on narrow screens. Catalog results keep each product name, serving basis, and nutrition values together. Auth and profile forms stay narrow and single-column. Main mobile content has at least 1rem side padding; controls target 44px or more for touch.

## Elevation & Depth

Use tonal separation and thin teal borders. Avoid ambient glow and glass effects. A subtle, soft shadow is reserved for a clearly raised layer if needed; borders are sufficient for ordinary lists and sections.

## Shapes

Inputs, buttons, and result panels use consistent rounded corners: 0.5rem for controls and 0.875–1.125rem for larger surfaces. Small state markers may be pill-shaped. Keep nutrition rows and meal lists open rather than nesting same-sized cards.

## Components

### Foundational visual states

Interactive controls expose hover, focus-visible, active, disabled, loading, and error states. Focus uses a visible primary-color outline. Disabled controls reduce contrast without becoming unreadable. Errors use both text and danger color; loading and empty states preserve their place in the flow.

### Buttons and actions

Primary actions use a filled blue-green surface and strong foreground contrast. Secondary actions use a transparent or surface background with a border. Destructive actions remain visually distinct and never share the primary accent.

### Navigation and data display

The top navigation remains present on all routes and wraps into a compact mobile layout. Current navigation uses a low-contrast teal surface and clear text. Macro values align consistently and preserve units and serving basis.

### Forms and overlays

Use native inputs and selects with themed browser controls, visible labels, persistent focus rings, and clear validation states. Search and date controls remain keyboard-operable. No new overlay behavior is introduced by the visual redesign.

The locale control is a searchable dropdown: names stay in their native writing systems, the search input supports arrow-key navigation and Enter to select, and Escape closes the list. Ukrainian is the first and default locale.

### Iconography

Use existing text labels and native date controls; do not introduce emoji or decorative Unicode as an icon system.

### Motion

Use one short GSAP timeline on the public landing to connect its headline to the labeled nutrition preview. AutoAnimate handles dynamic list and form-message changes. Keep hover and selection feedback short; do not add repeated scroll reveals. Respect `prefers-reduced-motion` by skipping the landing timeline; AutoAnimate disables its motion automatically.

### Content and data visualization

Nutrition totals retain explicit units. Progress is shown with a labeled native progress element and numeric remaining amount, so color is not the only signal. Food values retain their per-100-g context.

## Do's and Don'ts

- **Do:** Use the same semantic tokens and control states on diary, catalog, profile, and authentication screens.
- **Do:** Keep diary totals and food nutrition values easy to compare at a glance.
- **Don't:** Use a neon glow or full-bleed green as the default surface.
- **Don't:** hide serving units, error text, keyboard focus, or selected-state labels.
