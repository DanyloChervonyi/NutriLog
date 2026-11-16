# NutriLog UX Contract

## Product context

- Audience: people who track their nutrition.
- Primary jobs: set personal targets, find foods, record portions by meal, review a day, and open diary history.
- Active locales: Ukrainian (first and default), Russian, and English. Language names use their native writing systems; the header selector supports keyboard search and selection.
- Timezone/calendar policy: diary date is selected in the browser's local date; future dates are unavailable.
- Accessibility target: semantic controls, visible keyboard focus, and readable text at mobile widths.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| MVP scope and nutrition rules | `docs/MVP-SCOPE.md` | Product specification | 2026-11-16 |
| Food data source and caveat | `docs/FOOD-CATALOG.md` | Data provenance | 2026-11-16 |
| Personal data access | Authenticated API and account-scoped service queries | API implementation | 2026-11-16 |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`.
- Token ownership model: runtime CSS is canonical; `DESIGN.md` mirrors its semantic values.
- Runtime design-system/token source: `apps/web/src/app/globals.scss`.
- Mapping/adapters: semantic custom properties consumed by CSS Modules and shared components.
- Supported themes: dark blue-green.
- Design-context owner/review policy: preserve the product workflows and shared token mapping across route changes.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native `<select>` | route component | native | keyboard and mobile viewport |
| Date | Native `<input type="date">` | diary | typed/native | locale and keyboard |
| Form | React Hook Form and Zod | auth/profile forms | create/edit | validation and submission states |
| Scrollbar | Global application stylesheet | `DESIGN.md` | standard geometry | computed style |
| CRUD | Diary route and API | `docs/MVP-SCOPE.md` and API | update in place | full diary flow |

## Component behavior

| Component | Default | Hover | Focus | Active | Disabled | Busy | Error |
|---|---|---|---|---|---|---|---|
| Button | labeled action | surface change | visible outline | pressed surface | subdued, legible | action-specific label remains | alert text nearby |
| Input | labeled value | border emphasis | visible outline | n/a | subdued | form pending state | inline/form alert |
| Search | empty or query | border emphasis | visible outline | n/a | n/a | loading status | error status or no-results message |
| Diary list | meal items | row emphasis | controls focusable | selected food | mutation controls disabled | loading status | alert with retry path by re-submission |

## Dataset navigation

- Food search requires at least two characters, is debounced, and shows loading, error, empty, or paginated results.
- Diary defaults to the current local date and supports previous dates through date input and previous/next controls.
- Search page state is transient; selected catalog food is handed to the diary through session storage.
- The diary distinguishes loading, unauthenticated, request-error, empty meal, and populated states.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery | Source ref |
|---|---|---|---|---|---|---|
| Register / sign in | Auth form submit | Submit disabled | Diary | Route change | Inline/form alert | `apps/web/src/app/[locale]/auth-forms.tsx` |
| Reset password | Request or reset form submit | Submit disabled | Same route | Status message | Inline/form alert | `apps/web/src/app/[locale]/auth-forms.tsx` |
| Search foods | Query change | Loading status | Same route | Results and serving basis | Error or no-results state | `apps/web/src/app/[locale]/catalog/catalog-search.tsx` |
| Add food | Select result then submit grams and meal | Saving state | Same diary day | Updated totals and meal row | Error alert, form remains available | `apps/web/src/app/[locale]/diary/diary-view.tsx` |
| Edit/delete diary entry | Row action | Mutation controls disabled | Same diary day | Updated row and totals | Error alert | `apps/web/src/app/[locale]/diary/diary-view.tsx` |
| Save profile | Profile form submit | Submit disabled | Same profile route | Saved state and recalculated targets | Form error state | `apps/web/src/app/[locale]/profile/profile-form.tsx` |

## Navigation and responsive behavior

- The locale home route is a public landing page with registration, sign-in, and catalog actions. After the client session is restored, an authenticated visitor is redirected to the diary.
- The NutriLog brand link returns to the locale home route.
- Top navigation links to diary and catalog; profile is shown for an authenticated user. Auth actions depend on session state.
- Locale switcher exposes Russian, Ukrainian, and English.
- Diary summary and meals use multiple columns on desktop and collapse to one column on mobile.
- Food results keep product name and per-100-g values together; buttons and fields remain usable at narrow widths.

## Async and resilience

- Reads and mutations use TanStack Query and the shared API client.
- Mutations refresh the affected diary/profile query; loading and error states remain visible in the route.
- Authentication-required screens provide a sign-in route.
- The landing's nutrition preview is illustrative and labeled as example data.
- Do not introduce optimistic writes or alter request semantics as part of visual changes.

## Motion

- One short GSAP timeline connects the public landing headline, action, and example summary; its final content remains visible when reduced motion is requested.
- AutoAnimate is limited to search results, diary add-food content, and form/navigation state changes; it respects the user's reduced-motion preference.
- Hover and focus transitions remain immediate feedback. No auto-running loops, modal windows, or scroll-triggered reveals are added.

## Validation

- Auth/profile forms use React Hook Form and Zod.
- Field labels and server/form messages remain visible; pending controls prevent duplicate submission.

## Verification

- Supported viewport classes: narrow mobile (320–390px), tablet, and desktop.
- Compare diary and catalog as sibling workflows; verify locale switcher, focus, disabled, loading, empty, and error styling.
- Confirm runtime token values stay aligned with `DESIGN.md`.
