# Engagement Layer — Visual & Token Spec

**Status:** Visual design spec (companion to the UX design doc; no code).
**Date:** 2026-08-03
**Pairs with:** `2026-08-03-engagement-ui-design.md` (functional/UX design — placement,
states, component boundaries, prop surfaces). This document is the **visual
half**: the console/terminal design language and the exact `theme.css` token
each element uses. It is the aesthetic contract the mock
(`docs/design-reference/engagement-ui-mock.html`) demonstrates.
**Token source of truth:** `configs/tailwind/theme.css`. This spec never
redefines tokens — it maps components onto the existing semantic tokens and
flags the one gap (status colours) as a decision.

## 1. Design language — "the engagement layer is the terminal"

The engagement UI does not bolt generic rounded-card widgets onto the site. It
extends the existing console idiom already present in `terminal-chip`,
`command-link`, and `terminal-typing`: monospace prompts, a blinking cursor,
window-shell framing, and CLI metaphors (a `git log`-style comment thread, an
ASCII rating gauge, a `git stash`-style bookmark, a `$ subscribe` form). Five
principles govern every component:

1. **Monospace chrome, serif prose.** All structural/interactive text —
   prompts, handles, timestamps, labels, buttons, meters — is `--font-mono`.
   Human prose (comment bodies, newsletter descriptions) is `--font-body`
   (Newsreader). Section/feature titles are `--font-display` (Space Grotesk).
2. **The prompt is the accent.** Prompt glyphs (`$`, `>`, `›`, `└─`) render in
   `--accent`; the blinking cursor is a solid `--accent` block on the shared
   `blink` keyframe. Accent is used sparingly — for prompts, active states,
   meters, and links — never as a fill for large areas.
3. **Window-shell framing.** Grouped surfaces sit in a "shell": a `--surface`
   body with a `--surface-2` title bar carrying a fake prompt path
   (`val@ovinnikov:~$ …`), separated by a `--border` hairline.
4. **Hairlines, not shadows.** Structure comes from `--border` /
   `--border-strong`; elevation is at most one faint shadow. Radius is
   restrained: `--radius` (6px) for shells, `--radius-sm` (3px) for controls.
5. **Console motion.** Transitions use `--duration-base` with `--ease-console`;
   micro-interactions (star lift) use `--duration-fast`. The cursor blink is the
   only looping animation. All of it is already covered by the global
   `prefers-reduced-motion` reset in `theme.css`.

## 2. Token reference (only the tokens this layer uses)

Semantic tokens from `theme.css`, with light/dark raw values for reference. Use
the **semantic name** in code (`bg-surface`, `text-text-muted`, …), never the
raw OKLCH.

| Token                  | Light                    | Dark                    | Used for                                            |
| ---------------------- | ------------------------ | ----------------------- | --------------------------------------------------- |
| `--bg`                 | `oklch(0.99 0.002 250)`  | `oklch(0.17 0.006 250)` | page background                                     |
| `--bg-subtle`          | `oklch(0.965 0.003 250)` | `oklch(0.2 0.006 250)`  | recessed field                                      |
| `--surface`            | `oklch(1 0 0)`           | `oklch(0.21 0.007 250)` | shell body, buttons, fields                         |
| `--surface-2`          | `oklch(0.975 0.003 250)` | `oklch(0.24 0.008 250)` | shell title bar, form body, strip                   |
| `--border`             | `oklch(0.9 0.004 250)`   | `oklch(0.3 0.008 250)`  | hairlines, separators                               |
| `--border-strong`      | `oklch(0.8 0.006 250)`   | `oklch(0.42 0.01 250)`  | control borders, empty meter/stars                  |
| `--border-emphasis`    | `oklch(0.62 0.006 250)`  | `oklch(0.55 0.01 250)`  | sole-separator rules (reuse `PostsSection` pattern) |
| `--text`               | `oklch(0.2 0.01 250)`    | `oklch(0.95 0.004 250)` | primary ink, comment body, rating number            |
| `--text-muted`         | `oklch(0.46 0.01 250)`   | `oklch(0.72 0.008 250)` | secondary text, bar text, ghost buttons             |
| `--text-subtle`        | `oklch(0.6 0.008 250)`   | `oklch(0.56 0.008 250)` | metadata, timestamps, counters, hints               |
| `--accent`             | `oklch(0.53 0.17 250)`   | `oklch(0.7 0.16 250)`   | prompts, links, active stars/meter, cursor          |
| `--accent-hover`       | `oklch(0.47 0.17 250)`   | `oklch(0.76 0.16 250)`  | link/interactive hover                              |
| `--accent-muted`       | `oklch(0.95 0.03 250)`   | `oklch(0.3 0.06 250)`   | bookmark-active tint, selection                     |
| `--accent-contrast`    | `oklch(0.99 0 0)`        | `oklch(0.16 0.006 250)` | text on `--accent-solid`                            |
| `--accent-solid`       | `oklch(0.55 0.17 250)`   | `oklch(0.7 0.16 250)`   | primary button fill (post/subscribe)                |
| `--accent-solid-hover` | `oklch(0.49 0.17 250)`   | `oklch(0.76 0.16 250)`  | primary button hover                                |
| `--ring`               | `var(--accent)`          | `var(--accent)`         | global `:focus-visible` outline                     |

**Indigo accent variant** (`.indigo` / `.dark.indigo`) swaps `--accent*` and the
logo ramp; every component below inherits it automatically because it only ever
references the semantic `--accent*` names. No component hardcodes hue.

Shape / spacing / motion / type tokens used: `--radius` (6px), `--radius-sm`
(3px), `--radius-lg` (10px); `--spacing-section` between article blocks,
`--spacing-card-x/y` inside shells; `--duration-fast` (120ms), `--duration-base`
(200ms), `--ease-console`; type scale `--text-prose`, `--text-copy`,
`--text-meta`, `--text-label`, `--text-card-title`, plus the display sizes for
titles; tracking `--tracking-section` (eyebrows), `--tracking-label`.

## 3. Shared patterns → tokens

### 3.1 Window shell

| Part                             | Token(s)                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| body background                  | `--surface`                                                                              |
| body radius / border             | `--radius` / 1px `--border`                                                              |
| title bar background             | `--surface-2`, bottom 1px `--border`                                                     |
| title-bar path text              | `--text-muted`; the "user" segment `--accent`                                            |
| corner tag (e.g. "Comments · 4") | text `--text-subtle`, 1px `--border`, pill radius                                        |
| elevation                        | at most one faint shadow tinted from `--text` at low alpha; prefer none in flat contexts |

### 3.2 Prompt glyphs & cursor

Prompt (`$ > ›`) = `--accent`, `user-select:none`. Decorative glyphs
(`└─`, `●`, `◐`, `✓`) are `aria-hidden`; the accessible name comes from the
component's `ariaLabel` prop (per the UX doc). Cursor = inline block, width
`0.55ch`, height `~1.05em`, background `--accent`, animation
`blink 1s steps(1) infinite` (keyframe already defined in `theme.css`).

### 3.3 Buttons (reuse the existing `Button`/`IconButton` variants)

| Variant             | Border            | Background       | Text                | Hover                       |
| ------------------- | ----------------- | ---------------- | ------------------- | --------------------------- |
| outline (default)   | `--border-strong` | `--surface`      | `--text`            | border+text → `--accent`    |
| solid (primary CTA) | `--accent-solid`  | `--accent-solid` | `--accent-contrast` | bg → `--accent-solid-hover` |
| ghost               | transparent       | transparent      | `--text-muted`      | text → `--accent`           |

Radius `--radius-sm`; transition `color,border,background` `--duration-base`
`--ease-console`; focus uses the global `--ring`.

### 3.4 Field / input (the new `TextInput` atom)

Border `--border-strong`, background `--surface`, radius `--radius-sm`; leading
prompt `›` in `--accent`; typed text `--text`, placeholder `--text-subtle`;
`invalid` variant switches the border to `--error` (§7). Focus = global
`--ring`. Font `--font-mono` for the newsletter email, `--font-body` for the
comment `Textarea`.

### 3.5 ASCII meter & tree connector

Meter: filled cells `--accent`, empty cells `--border-strong`, bracketed
(`▐…▌`), `--font-mono`, letter-spacing ~`0.15em`. Thread tree connector: a
`--border` left rule with a `└─` marker in `--border-strong`.

## 4. Per-feature token maps

### 4.1 Auth (#1039)

| Element                               | Token(s)                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| popover shell                         | §3.1 window shell                                                                                     |
| `> choose a provider` prompt + cursor | `--accent`                                                                                            |
| provider button                       | outline button (§3.3); GitHub glyph `--text` via `currentColor`; **Google glyph stays 4-colour** (§8) |
| account header name / email           | `--text` / `--text-subtle`, 1px `--border` divider                                                    |
| avatar tile                           | gradient `--logo-1 → --logo-3`, text `--accent-contrast`, radius `--radius-sm`                        |
| menu item hover                       | background `--surface-2`, text `--accent`                                                             |
| ⌘-key hint                            | 1px `--border`, text `--text-subtle`                                                                  |
| "Sign out"                            | text `--error` (§7)                                                                                   |

### 4.2 Ratings (#1041)

| Element                   | Token(s)                                                                    |
| ------------------------- | --------------------------------------------------------------------------- |
| `rate` / `you` prompt     | `--accent`                                                                  |
| filled meter / lit stars  | `--accent`                                                                  |
| empty meter / unlit stars | `--border-strong`                                                           |
| numeral (`4.6`)           | `--text`, weight 600, `--font-mono`, size `--text-copy`/`--text-card-title` |
| `/5` and `n=23`           | `--text-subtle`, `--text-meta`                                              |
| star hover micro-lift     | `translateY(-1px)`, `--duration-fast` `--ease-console`                      |
| "✓ your rating saved"     | `--success` (§7)                                                            |
| empty-state text          | `--text-muted`                                                              |

### 4.3 Comments (#1040)

| Element                               | Token(s)                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| entry separator                       | 1px dashed `--border`                                                                |
| author handle `@name`                 | `--accent`, weight 600, `--font-mono`, `--text-copy`                                 |
| `·` + timestamp + `↳ @parent`         | `--text-subtle`, `--text-meta`                                                       |
| comment body                          | `--font-body`, `--text`, `--text-prose`                                              |
| action row (reply/delete/id)          | `--text-subtle`; hover `--accent`                                                    |
| reply nesting rule + `└─`             | 1px `--border` left rule; marker `--border-strong` (collapses to one step on mobile) |
| **pending** bar                       | left 2px `--warn`; background = `--warn` low-alpha tint (§7 → `--warn-muted`)        |
| "pending review" badge                | text/border `--warn`, background `--warn-muted`                                      |
| author-only pending note (`● …`)      | `--warn`, `--text-meta`                                                              |
| tombstone (`// comment removed`)      | `--font-mono`, `--text-subtle`, reduced opacity                                      |
| form shell                            | 1px `--border`, background `--surface-2`                                             |
| form top prompt `$ comment --as @val` | `--text-subtle` with `--accent` handle + cursor                                      |
| textarea                              | `--font-body`, `--text`, transparent background                                      |
| char counter                          | `--text-subtle`; near-limit (>90%) → `--warn`                                        |
| logged-out gate                       | 1px dashed `--border-strong`, text `--text-muted`, prompt `--accent`                 |

### 4.4 Bookmarks (#1043)

| Element                            | Token(s)                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------- |
| toggle (default)                   | border `--border-strong`, background `--surface`, text `--text-muted`     |
| toggle hover                       | border+text `--accent`                                                    |
| toggle **active** (`aria-pressed`) | text+border `--accent`, background `--accent-muted`, icon fill `--accent` |
| `⌘S` hint                          | 1px `--border`, `--text-subtle`                                           |
| `/bookmarks` row separator         | 1px dashed `--border`                                                     |
| perm/date columns                  | `--text-subtle`, `--font-mono`                                            |
| filename link                      | `--accent`; hover underline                                               |
| empty-state                        | `--text-muted`                                                            |

### 4.5 Newsletter (#1044)

| Element                     | Token(s)                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------- |
| compact strip               | 1px `--border`, **left 3px `--accent`**, background `--surface-2`, radius `--radius-sm` |
| `$ subscribe --email` label | `--text` mono, prompt `--accent`                                                        |
| email field                 | §3.4 field                                                                              |
| subscribe button            | solid button (§3.3)                                                                     |
| full box                    | §3.1 window shell                                                                       |
| full heading                | `--font-display`, `--text-card-title`+                                                  |
| full description            | `--font-body`, `--text-muted`, `--text-prose`                                           |
| success (`✓ almost there`)  | `--success` (§7) + cursor                                                               |
| "awaiting confirmation"     | `--warn` (§7), `--text-meta`                                                            |
| hint text                   | `--text-subtle`                                                                         |

### 4.6 Account area (`/account`, Feature 6 / D15)

Three `WindowChrome` sections stacked on the hub, each titled with a terminal
command (`$ account --privacy` / `--email` / `--identities`). All three lean on
one new pattern — the **`SettingRow`** (label + description + control slot) — and
on the status tokens in §7. Mock: the "06 · Account" section of
`engagement-ui-mock.html`.

**`SettingRow` (shared by all three sections):**

| Element                 | Token(s)                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| row separator           | 1px dashed `--border`                                                                               |
| label                   | `--font-mono`, `--text`, weight 500, `--text-copy`                                                  |
| description             | `--font-body`, `--text-subtle`, `--text-meta`                                                       |
| control slot            | reuses §3.3 buttons / §3.4 field / status badge                                                     |
| `tone="danger"` wrapper | 1px `--error` border, **left 2px `--error`**, background `--error-muted` tint, radius `--radius-sm` |

**6a — privacy & data:**

| Element                 | Token(s)                                                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Export my data" action | outline button (§3.3)                                                                                                                                             |
| "Delete account" row    | `SettingRow tone="danger"`; heading `--error`                                                                                                                     |
| typed-confirm field     | §3.4 field; arms only on handle match                                                                                                                             |
| delete button           | **danger button** — border `--error` (mix), text `--error`, background transparent; hover fill `--error` with `--bg` text; `disabled` → reduced opacity, no hover |

**6b — email & newsletter preferences:**

| Element                      | Token(s)                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| "subscribed" badge           | `--success` text/border, `--success-muted` background (§7)      |
| "pending confirmation" badge | `--warn` text/border, `--warn-muted` background                 |
| email on file                | `--font-mono`, `--text`; "read-only in v1" note `--text-subtle` |
| unsubscribe / resend         | outline button (§3.3)                                           |

**6c — connected accounts / identity:**

| Element                      | Token(s)                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| provider row separator       | 1px dashed `--border`                                                                 |
| provider icon                | GitHub `currentColor` = `--text`; Google 4-colour (§8.1); email-link glyph `--accent` |
| provider name                | `--text`, `--font-mono`                                                               |
| linked state                 | `✓ linked` in `--success`; `○ not linked` in `--text-subtle`                          |
| link / unlink action         | ghost button (§3.3)                                                                   |
| "last method — can't unlink" | `--text-subtle`, italic (guard, not a button)                                         |
| display-name field + avatar  | §3.4 field + `Avatar` (gradient `--logo-1→--logo-3`); save = solid button             |

**Note (same as elsewhere):** the mock renders the danger/ok/warn tints with
`color-mix()`; ship them as the `*-muted` status tokens from §7, not inline
mixes. The entire Account area therefore **depends on the §7 status-token
decision (D11)** landing first — delete (`--error`), subscription status
(`--success`/`--warn`) have no correct token to bind to until it does.

## 5. Typography roles

| Role                                                                | Family token     | Size token(s)                                | Notes                                                     |
| ------------------------------------------------------------------- | ---------------- | -------------------------------------------- | --------------------------------------------------------- |
| Terminal chrome (prompts, handles, meta, meters, counters, buttons) | `--font-mono`    | `--text-meta`, `--text-label`, `--text-copy` | letter-spacing default; eyebrows use `--tracking-section` |
| Feature/section titles                                              | `--font-display` | `--text-card-title` → title sizes            | tracking −0.02em (global `h*` rule)                       |
| Human prose (comment bodies, newsletter copy)                       | `--font-body`    | `--text-prose`                               | serif, 1.55–1.7 line-height                               |

## 6. Motion

- **Hover/active transitions:** `color, border-color, background, transform`
  over `--duration-base` `--ease-console`. Star lift uses `--duration-fast`.
- **Cursor blink:** `blink 1s steps(1) infinite` (existing keyframe).
- **Optimistic feedback:** rating/bookmark toggles flip instantly (no entrance
  animation); a failed write rolls the value back (see UX doc states).
- **Reduced motion:** no component adds motion outside the global
  `prefers-reduced-motion` reset already in `theme.css` — nothing to re-handle.

## 7. Open decision — status colour tokens (D11)

The palette in `theme.css` is a single blue/indigo accent ramp plus neutrals. It
has **no semantic success / warning / danger colours**, but this design needs
three distinct signals that must not collide with `--accent`:

- **pending / awaiting** (comment moderation, newsletter confirmation) — amber.
- **success** ("rating saved", "check your inbox") — green.
- **danger** ("Sign out", "delete", invalid field) — red.

The mock uses placeholder `--success` / `--warn` / `--error` plus low-alpha tints
(via `color-mix`). **These are not yet tokens.** Recommendation: add a small,
WCAG-verified status set to `theme.css` `:root` / `.dark` (a `config`-layer
change), following the existing OKLCH + contrast-annotation convention, e.g.:

```
/* status (proposed — verify contrast per theme.css convention) */
--success:      oklch(0.60 0.15 150);  /* dark: oklch(0.72 0.16 150) */
--warn:         oklch(0.72 0.15 75);   /* dark: oklch(0.80 0.15 80)  */
--error:        oklch(0.58 0.20 25);   /* dark: oklch(0.70 0.17 25)  */
--success-muted: oklch(0.95 0.03 150); /* dark: oklch(0.30 0.06 150) */
--warn-muted:    oklch(0.95 0.03 80);  /* dark: oklch(0.30 0.06 80)  */
--error-muted:   oklch(0.95 0.03 25);  /* dark: oklch(0.30 0.06 25)  */
```

**Do not ship inline `color-mix()`** for the badge/bar tints as the mock does —
express them as the `*-muted` tokens above so theming stays centralized. Values
are indicative; the `config` sub-agent must recompute each against `--bg` /
`--surface` for the WCAG 1.4.3 (text) and 1.4.11 (non-text) minimums, exactly as
the existing `--accent` / `--border-emphasis` comments document. Until this
lands, the pending/success/danger states have no correct token to bind to — so
this decision gates the `ui` work for comments, ratings, and newsletter.

**`--info` addendum (2026-08-06):** shipped alongside this set is `--info` (+
`--info-muted`) — a deliberate **alias** of `--accent`/`--accent-muted`, not a
new hue: info conveys no success/failure valence, so it reuses the brand
accent colour instead of introducing a fourth. The `TOAST_TYPE.INFO` variant
(`packages/config/src/constants/toast.ts`) already renders via `--accent`
directly, so it needed no change when `--info` was added.

## 8. Icons

Two new assets. Both are `ui`-layer additions (real home:
`packages/ui/src/assets/icons/`, added by the `ui` sub-agent at implementation).

### 8.1 `google.svg` — sign-in provider (4-colour, brand exception)

The icon set is otherwise monochrome (`currentColor`). The Google mark is the
**one sanctioned exception**: Google's brand guidelines require the 4-colour "G"
and forbid recolouring, and it appears only on the sign-in provider button, so it
does not participate in `currentColor` theming. Source (24×24, matches the set's
viewBox):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.642h6.458a5.52 5.52 0 0 1-2.394 3.622v3.01h3.878c2.27-2.09 3.578-5.17 3.578-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.956-1.075 7.942-2.908l-3.878-3.01c-1.075.72-2.45 1.145-4.064 1.145-3.125 0-5.77-2.11-6.714-4.947H1.276v3.11A11.997 11.997 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.286 14.28A7.212 7.212 0 0 1 4.909 12c0-.792.136-1.56.377-2.28V6.61H1.276A11.997 11.997 0 0 0 0 12c0 1.938.464 3.772 1.276 5.39l4.01-3.11z"/><path fill="#EA4335" d="M12 4.773c1.762 0 3.344.605 4.59 1.793l3.44-3.44C17.952 1.19 15.235 0 12 0A11.997 11.997 0 0 0 1.276 6.61l4.01 3.11C6.23 6.883 8.875 4.773 12 4.773z"/></svg>
```

Reference copy lives at `docs/design-reference/google.svg`.

### 8.2 `bookmark.svg` — bookmark toggle (monochrome, `currentColor`)

Follows the set's convention: `currentColor`, 24×24. Outline for the _unsaved_
state (`fill="none" stroke="currentColor"`), and the _saved_ state simply sets
`fill` on the same path (`aria-pressed` drives the swap in the component, tinted
`--accent`). Source:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z"/></svg>
```

## 9. Accessibility notes bound to tokens

- **Contrast.** All body/meta text tokens (`--text`, `--text-muted`,
  `--text-subtle`) and `--accent` are already WCAG-annotated in `theme.css`. The
  **proposed status tokens (§7) are the only unverified colours** and must clear
  4.5:1 (text) / 3:1 (non-text) before use.
- **Non-colour signalling.** Pending/success/danger never rely on hue alone:
  pending also carries the `[pending review]` badge text and `●` note, success a
  `✓` glyph, danger the word ("delete"/"Sign out"). Colour-blind-safe by
  construction.
- **Focus.** Every interactive element uses the global `:focus-visible` ring
  (`2px solid var(--ring)`, `2px` offset) — no per-component override.
- **Accessible names.** Decorative terminal glyphs are `aria-hidden`; names come
  from the `ariaLabel` props defined in the UX doc's prop sketches.
- **Targets.** Interactive stars and the bookmark toggle keep ≥44px hit areas on
  touch (padding, not glyph size).

## 10. Decision log addendum

| #   | Decision        | Chosen                                                                                                                                                                                                                                         |
| --- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D11 | Status colours  | Add semantic `--success`/`--warn`/`--error` (+ `*-muted`) tokens to `theme.css` (`config` layer, WCAG-verified); no inline `color-mix` in components. `--info`/`--info-muted` added as `--accent`/`--accent-muted` aliases (2026-08-06 rename) |
| D12 | Google icon     | Ship the official 4-colour mark as the lone non-`currentColor` icon; monochrome `bookmark.svg` follows the normal convention                                                                                                                   |
| D15 | Account visuals | Three `WindowChrome` sections on `/account` sharing one new `SettingRow` pattern (§4.6); danger/status treatments bind to the D11 status tokens                                                                                                |

Everything else inherits the decision log in `2026-08-03-engagement-ui-design.md`
(Feature 6 / D15 there covers the account structure and per-section behaviour).
No code in this issue — the visual contract above feeds the same per-issue
`writing-plans` pass, with §7 (status tokens) sequenced first as a `config`
prerequisite for the `ui` components (including the whole Account area).
