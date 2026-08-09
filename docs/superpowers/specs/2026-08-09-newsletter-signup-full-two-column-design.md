# Spec: `NewsletterSignup.Full` — two-column layout

**Layer:** `@blog/ui` (pure, prop-driven). **Type:** presentational/layout change only.
**Skills:** `ui-library-practices`, `ui-storybook`. **Owning agent:** `ui`.

This supersedes an initial draft written without repo access. Every `⚠ VERIFY`
item from that draft has been checked against the actual source, and three
open design questions have been resolved with the user. This is the version
to implement from.

---

## 1. Problem

On the page(s) where the `module_newsletter` CMS page-builder module renders
`NewsletterSignup.Full`, the signup renders as a narrow, centered card with
large empty gutters left and right, even though its wrapping page container
(`BlogPageTemplate.root`, `max-w-page px-gutter`) already matches the posts
grid above it.

**Confirmed root cause:** the _page-level_ container is already correct —
`NewsletterModule` and the posts grid both sit inside the same `max-w-page`
container. The narrow-card look comes from `NewsletterSignupFull`'s own root,
which caps itself at `max-w-copy` (60ch) —
`packages/ui/src/organisms/newsletter-signup/newsletter-signup-variants.ts:23`.
The fix is removing/widening that internal cap so the card fills the
container it's already given, not chasing a container mismatch further up
the tree.

## 2. Goal

Rework `NewsletterSignup.Full` into a full-content-width, two-column block:

- **Left pane:** the pitch — heading, description (CMS-authored), trust cues.
- **Right pane:** the form — email field + subscribe button, vertically centered.

At mobile width the two panes stack (pitch above form) as a single column.
The card fills the same container width as the posts grid above it.

**Only the `Full` variant changes. The compact variant is out of scope.**

## 3. Resolved design decisions

These were open questions in the initial draft; each is now settled and is
binding for implementation.

### 3a. Heading styling — no per-segment coloring

`heading` is CMS-authored free text (`module_newsletter.heading`, a required
Sanity field — see `apps/web/src/modules/newsletter/newsletter-module.tsx:27-34`),
not a fixed string with a `$ subscribe --to weekly`-style structure. **Do not**
attempt to color-segment it (`$` muted / `--to` secondary / rest accent) —
there is no reliable structure in arbitrary editor text to segment.

Render `heading` (still typed `string`, prop contract unchanged) as one
mono/accent-styled line, terminal-flavored via font/color alone (no glyph
segmentation). Same treatment applies to `description`.

### 3b. Trust cues — new optional props, sourced from `apps/web` i18n

Trust cues ("no spam", "unsubscribe in one line") don't exist in any prop or
CMS field today, and adding CMS fields is out of scope for this spec. Add them
as **new optional props** on `NewsletterSignupFull`, following the same
pattern already used for `submitLabel`/`emailAriaLabel` (caller-supplied
copy, not component-owned):

```ts
trustCues?: { icon: ReactNode; label: string }[];
```

(exact shape is the `ui` agent's call — array of icon+label pairs is the
minimum needed to satisfy §7's two-cue example). `apps/web`'s `NewsletterForm`
supplies the copy via `next-intl` translations (same source as
`submitLabel`/`placeholder` today) — **not** CMS content. Optional and
defaulted to not rendering the trust-cue row when omitted, so no existing
call site breaks.

Icons: `packages/config/src/constants/icon.ts` already has `X`/`CLOSE`
registered (use for "unsubscribe"); `SHIELD_CHECK` does **not** exist yet and
must be added to `ICONS` (`packages/config`) and the icon registry
(`packages/ui/src/atoms/icon/icon-registry.ts`) for "no spam" — additive,
same pattern as `ARROW`/`CHEVRON_RIGHT` added earlier in this epic.

### 3c. Keep `WindowChrome` — build the two-column grid inside its `Body`

`Full` currently renders inside `<WindowChrome>`
(`packages/ui/src/organisms/newsletter-signup/components/full/newsletter-signup-full.tsx:55`),
the same terminal-title-bar shell used elsewhere in the app (e.g. bookmarks
page). **Keep it.** The two-column grid described in §6 is the layout inside
`WindowChrome.Body`, not a replacement shell. `WindowChrome`'s own
border/radius/background already provides the card framing — §6's "Card:
1px border, 12px radius, surface-2 background" describes what `WindowChrome`
already gives for free; don't duplicate it on an inner wrapper.

## 4. Scope / files

Verified actual structure — `Full` is already a separate sub-component file,
not inline in the top-level `NewsletterSignup`:

- `packages/ui/src/organisms/newsletter-signup/newsletter-signup.tsx` — top-level compound export (`.Full` / `.Compact`), unchanged.
- `packages/ui/src/organisms/newsletter-signup/components/full/newsletter-signup-full.tsx` — the component to rework.
- `packages/ui/src/organisms/newsletter-signup/components/full/newsletter-signup-full.test.tsx` — update per `testing-practices`.
- `packages/ui/src/organisms/newsletter-signup/components/full/newsletter-signup-full.stories.tsx` — update/extend per `ui-storybook`.
- `packages/ui/src/organisms/newsletter-signup/newsletter-signup-variants.ts` — shared slots; add/adjust `full`-variant entries (remove the `max-w-copy` cap from `full`, add two-column grid slots).
- `packages/ui/src/organisms/newsletter-signup/components/content/newsletter-signup-content.tsx` — shared between `Full`/`Compact`; touch only if the right-pane form needs a `full`-specific wrapper it doesn't already have.
- `packages/config/src/constants/icon.ts` + `packages/ui/src/atoms/icon/icon-registry.ts` — add `SHIELD_CHECK` (see §3b). This is the one `config`-layer touch; still ships in the single `ui` PR since it's additive and `ui` already owns icon registration precedent in this epic (`ARROW`/`CHEVRON_RIGHT` were added the same way).
- Regenerate `packages/ui/COMPONENTS.md` via `scripts/gen-ui-index.mjs` (pre-commit hook handles this on staged `packages/ui` changes).

**Out of scope:** `apps/web` placement/composition beyond passing the new
`trustCues` prop and its i18n strings, the compact variant, `service`/`db`,
any CMS schema/migration work.

## 5. Non-goals / constraints (layer contract)

- `@blog/ui` stays pure: no `'use client'`, no fetch, no `service`/`db`/Sanity imports.
- No new hardcoded colors/fonts/spacing — use existing tokens (see §6 for verified names).
- Absolute imports via `@blog/ui/*`; same-dir `./` relative; never `../`.
- TypeScript strict, no `any`. Sentence case in all copy. Comments only where genuinely non-obvious.

## 6. Public API

Preserve the existing prop contract; add only optional, defaulted props.

Current `INewsletterSignupFullProps`
(`packages/ui/src/organisms/newsletter-signup/components/full/newsletter-signup-full.tsx:14-27`):
`email`, `onChange`, `onSubmit`, `status`, `heading: string`, `description?: string`,
`errorMessage?`, `successMessage?`, `submitLabel`, `emailAriaLabel`, `placeholder?`,
`className?`, `dataTestId?` — **all unchanged**.

**New:** `trustCues?: { icon: ReactNode; label: string }[]` (see §3b). No other
prop additions. `apps/web`'s `NewsletterForm` → `NewsletterModule` call sites
keep compiling untouched if `trustCues` is omitted.

## 7. Layout spec

### Shell

`WindowChrome` (kept, §3c) provides the border/radius/surface-2 background
and title bar. Its `Body` becomes the two-column grid container. Width: drop
`full`'s `max-w-copy` cap in `newsletter-signup-variants.ts` so the shell
fills its container (already correctly sized at the page level — see §1).

### Desktop (≥ `md`, verified: repo's `md` = Tailwind default 768px, no custom screens)

- CSS grid, two columns, left slightly wider than right (`1.1fr 1fr` — tune to taste).
- Vertical `1px` divider (`border-border`) between panes — `border-l` on the right pane, not a separate element.
- Left pane padding ≈ `2rem`; right pane padding ≈ `2rem`, flex column, contents vertically centered (`justify-center`).

### Mobile (< `md`)

- Single column: pitch pane on top, form pane below.
- Divider becomes a **top** border on the form pane: `border-t md:border-t-0 md:border-l`.
- `grid-cols-1 md:grid-cols-2`.
- Full-width button; trust cues (if present) stack vertically so they don't wrap awkwardly.

## 8. Content / slots

### Left pane (pitch)

1. **Heading** — `h3`, mono, accent color, uniform styling (no segment coloring — §3a). Renders the `heading` prop as-is.
2. **Description** — existing `description?: string` prop, serif/body font, primary text. Same content source as today, just repositioned into the left pane.
3. **Trust cues** (optional, §3b) — mono, muted. Desktop: inline row (`gap`); mobile: stacked column. Icon + label pairs from the new `trustCues` prop; icons `aria-hidden`.

### Right pane (form)

Unchanged from what `NewsletterSignupContent` already renders (shared with
`Compact`): mono `email` label bound via `htmlFor`/`id`, `TextInput` with the
existing chevron `leadingIcon` prompt, submit button (existing `submitLabel`).
No content changes here — only the pane's own layout (vertical centering,
full-width button) per §7.

## 9. Accessibility

- Existing `<form>`/submit path unchanged (owned by `NewsletterSignupContent`).
- `<label htmlFor>` bound to input `id` — already the case today, verify it survives the layout change.
- Decorative icons (`leadingIcon`, trust-cue icons) stay `aria-hidden="true"`.
- Color contrast AA in both light and dark themes for accent-on-surface heading and any new trust-cue text/icon.
- Keyboard: input focusable, visible focus ring (existing `focus-visible:ring-2 focus-visible:ring-accent` pattern — `packages/ui/src/atoms/button/button-variants.ts:12` precedent), button submits on Enter.

## 10. Theming

Light/dark via existing token mechanism only — no mode-specific hardcoded hex.
Verified tokens to use: `border-border`, `bg-surface-2`, `text-accent`,
`font-mono` (`--font-mono`), `font-body` (`--font-body`, serif) —
`configs/tailwind/theme.css`.

## 11. Storybook (`ui-storybook`)

Stories for `NewsletterSignup.Full`:

- Default (desktop width).
- Narrow/mobile viewport showing the stacked state (reuse the `phone` viewport-pinning precedent from the `NewsletterSignup.Compact` `MobilePhone` story added this epic).
- Dark theme.
- With `trustCues` populated vs omitted.

## 12. Tests (`testing-practices`)

Co-located `*.test.tsx`. Cover:

- Renders heading, description, trust cues (when provided), label, input, button.
- `trustCues` omitted → no trust-cue row rendered, no other regression.
- Input `type="email"`, associated with its label (`getByLabelText('email')`).
- Submit still invokes `onSubmit` per the existing controlled contract.
- No presentation-CSS-class assertions (`code-review-practices` §6) — assert DOM structure/content/ARIA, not Tailwind class strings.
- No regression to the compact variant if the same test file/suite touches shared code.

`pnpm test` must pass.

## 13. Migrations

None. Presentational `@blog/ui` change plus one additive `config`-layer icon
registration; no Sanity schema, no `db` schema, no generated types touched.
State this explicitly in the PR body.

## 14. Acceptance criteria

1. `NewsletterSignup.Full` fills its container width (matches the posts-grid container it already shares at the page level); no oversized side gutters from its own internal cap.
2. Desktop: two columns (pitch | form) with a vertical divider inside `WindowChrome.Body`; form vertically centered.
3. Mobile: single column, pitch above form, divider becomes a top border on the form pane, button full width.
4. Compact variant unchanged; `Full`'s existing prop API unchanged plus one new optional `trustCues` prop — no existing call site needs changes.
5. Heading/description render as plain CMS-authored text with uniform terminal styling — no attempted glyph/color segmentation.
6. `WindowChrome` shell (title bar, border, radius, surface-2 bg) is preserved, not replaced.
7. Light + dark both correct; AA contrast on button, heading, and trust cues.
8. Label properly associated with the email input.
9. No `'use client'`, no fetch/`service`/`db` imports added; no new runtime dependency.
10. New/updated stories render in all listed states; `COMPONENTS.md` regenerated and in sync.
11. `pnpm type-check`, `pnpm lint`, `pnpm test` green from root.

## 15. Delivery

Single per-layer PR (`ui` only, plus the one additive `config` icon-registration
touch) — merges green on its own since it's additive. Reference the tracking
issue; `Closes #<n>` since this is the completing PR (single-PR delivery).

Standard gate sequence: work → `reviewer` APPROVE on the diff → commit →
(human-gated) push → (human-gated) PR.
