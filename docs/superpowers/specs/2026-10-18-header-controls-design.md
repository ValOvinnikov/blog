# Header controls — Design Spec

**Status:** Approved 2026-10-18; in flight. Deleted by the epic's final PR once
the feature pages describe the built behaviour.
**Date:** 2026-10-18
**Epic:** #5459 (sub-issues #5460–#5467; manual tests #5468, #5469)
**Canvas (owner-only):** https://claude.ai/artifact/6gRJ55kJ4sDzqBjxcbXuiD

## Goal

Every control in the public site's header bar — language switcher, theme
toggle, mobile menu toggle, Sign in and the signed-in avatar — reads as one
family, and a tenant chooses how that family is framed on the Look page.

Today Sign in is the only control that is not round from `lg` up (a 36px
rectangle on `--radius-sm`, 2–6px), the bar mixes four heights (codes pill
≈30px, theme toggle and Sign in 36px, avatar and loading disc 32px), every gap
is 16px so the account entry reads as a fourth setting, the account slot
resizes on every state change, and on phones the labelled pill grows with the
locale and squeezes the brand.

## 1. The control family (every style)

**Geometry**

- Every header control is `rounded-full`: circles for icons, pills for labels.
  The radius scale and `CONTROL_RADIUS` (#5070) never reach the bar.
- One height per breakpoint for every control in every state: 44px below `lg`,
  36px from `lg`, and 44px under `pointer-coarse` at any width.
- Labelled pills use `px-4`. The Sign in pill uses `pl-3 pr-4` with a 6px gap
  between glyph and label.
- The header CODES pill is 36px: a 1px frame, `p-[5px]`, 2px between 24px code
  chips. The footer codes are untouched.
- Icons are 18px in circles and 16px beside a label (an agreed exception to
  #5406's one-icon-size rule).

**Grouping, by gap and never by divider**

- From `lg`: nav links 16px apart, then 24px, then the settings group
  (language switcher and theme toggle) 8px apart, then 24px, then the account
  control.
- Below `lg`: 8px between every control in the bar.
- In `@blog/ui` PrimaryNavigation: root `gap-x-2 lg:gap-x-6`, `barPanelActions`
  `gap-x-2`. With the switcher off, the theme toggle sits in `actions` and the
  root gap keeps it 24px from the account control.

**Shared interaction (identical in every style)**

| State                                  | Treatment                                                                                                                                                                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hover, and open (`aria-expanded=true`) | Border and content (glyph, label, code, chevron) turn `--brand-primary`; the fill stays. The brand ring is what keeps hover from reading as the current nav link, which never has a ring.                                                 |
| Focus                                  | `FOCUS_RING` following the round shape. The fill does not change on focus (override IconButton's `focus-visible:bg-surface-2`). Each 24px code chip takes its own ring.                                                                   |
| Forced colours                         | The 1px border is always present (`border-transparent`, never `border-0`) so a system colour paints it in every style; hover and open add a 2px `Highlight` outline; the current code chip gets a 1px `Highlight` outline at −1px offset. |

CODES: the outer pill has no hover; other codes go from muted to ink, never to
brand. The current code chip is brand-filled in every style — it marks the
current language, it is not chrome.

## 2. The account control

**Desktop, signed out (every style):** the last item in the bar. "Sign in"
(`authMenu.signIn`) in 11px/1.4 JetBrains Mono, weight 400, ink, after the
new 16px person glyph in muted. Widths: EN 98px, NL/DE 105px, FR 131px,
ES 144px.

**Signed in (every style):** the existing Avatar inside a round frame built
from the style's border and fill: a `size-9` frame around Avatar SM (32px)
from `lg`, a `size-11` frame around Avatar MD (40px) below it, with 1px of fill
between frame and photo. The initials fallback is unchanged. The frame's border
turns brand on hover and open. `aria-label` "Account menu".

**Loading:** no spinner and no grey disc. Desktop renders the signed-out
control with `visibility: hidden` at its exact width, plus the sr-only
`role="status"` "Loading account status". Phones paint the empty 44px frame at
once (both end states share it) and fade the glyph or face in over 150ms, with
no fade under `prefers-reduced-motion`. Signed-out readers never see a shift.
A signed-in reader's desktop hard load still shifts the bar as the pill becomes
the 36px frame; that is out of scope (§7).

**Phones (below `lg`):**

- Bar: brand … [44px person circle] 8px [44px menu circle]. The circle is the
  IconButton `circle` recipe with an 18px person glyph, `aria-label` "Sign in",
  `aria-haspopup`, `aria-expanded`. No locale changes its width; the brand keeps
  235px at 390px (183px when the theme toggle is also in the bar).
- Menu (drawer): links (each row `min-h-11`), then the language/theme row when
  the switcher is on, then a new account row after `mt-2 border-t border-border
pt-3`: `min-h-11 w-full rounded-md px-3`, 16px person glyph in muted plus
  "Sign in" in 12px mono ink; signed in it reads "Account"
  (`authMenu.accountHeading`). Hover is `bg-surface-2` with the glyph going to
  ink — no brand, matching the drawer's link rows. The row is a list row, not a
  header control, so it looks the same in every style. It needs a drawer-only
  PrimaryNavigation slot, because `panelActions` also renders in the desktop
  bar.
- Tapping the row closes the drawer, opens the sign-in or account panel, and
  focuses its first item; Escape returns focus to the bar circle. The circle and
  the row open the same panel and share one `aria-expanded`.
- Below `lg` the panel is a sheet anchored to the header, not to the trigger:
  left and right edges at the gutter, top at the header's bottom + 8px,
  `max-h-[calc(100dvh-<header>-16px)] overflow-y-auto`, provider and email
  buttons `min-h-11`. The OAuth error notice anchors the same way. From `lg` the
  320px popover is unchanged.
- One overlay at a time: the drawer, the sign-in/account panel and the
  language menu share one open state; opening one closes the others.

## 3. Header buttons styles (the Look setting)

A style changes exactly two tokens: the resting border and the resting fill.
Geometry, type, glyphs, widths, hover/open, focus and forced colours are §1's.

| Token                     | OUTLINED (default)                       | SOFT                              | PLAIN         |
| ------------------------- | ---------------------------------------- | --------------------------------- | ------------- |
| `--header-control-border` | `var(--border-strong)` #bbbec1 / #494e52 | `transparent`                     | `transparent` |
| `--header-control-fill`   | `var(--surface)` #ffffff / #16191b       | `var(--border)` #dcdee0 / #2b2e32 | `transparent` |

What each part looks like (light / dark):

- Icon circles (theme, globe, menu toggle, phone person circle): the frame
  above with an 18px ink glyph (#13161a / #eceff1).
- CODES pill: the frame above; current chip #0055ab / #42a3fd with
  #fcfcfc / #0b0d10 text; other codes #54595e / #a1a5a9. In PLAIN the capsule
  is invisible and the chip carries the control.
- MENU_CODE "EN ▾": the frame above, code and 12px chevron in ink.
- Sign in pill: the frame above; glyph muted, label ink.
- Avatar frame: OUTLINED a #bbbec1 / #494e52 ring with a #fff / #16191b gap;
  SOFT a 2px #dcdee0 / #2b2e32 ring; PLAIN no frame, the photo alone.

Every switcher style combines with every header style; neither setting changes
the other. On phones every switcher style already becomes the "EN ▾" menu in
the drawer, and that pill follows the header style.

Contrast: no style's resting cue reaches 3:1 (OUTLINED's line 1.82 / 2.27,
SOFT's fill 1.31 / 1.40, PLAIN none). Every control is identified by its glyph
or label at ≥13.45:1, which WCAG 1.4.11 accepts. Brand text on SOFT's fill
drops to 4.70:1 in dark at the worst hue — never dim SOFT's content.

Rejected: an accent-tint style (the tint already means selected or on), brand
outline at rest (collides with the current nav link and chip), a stronger
`border-emphasis` ring as a tenant option (if 3:1 is ever required it is one
token change for every site), and corner values (that is `CONTROL_RADIUS`).

## 4. Implementation shape

Token-driven, on the `CARD_STYLE` pattern; no getter and no new props.

- **Tokens:** `--header-control-border` / `--header-control-fill` with
  OUTLINED's values in `configs/tailwind/theme.css`'s static `:root`, so static
  defaults still equal Console, and `@theme inline` aliases giving
  `border-header-control` and `bg-header-control-fill`. No static `.dark` copy:
  the `var()` resolves on whichever element carries `.dark`.
- **Recipe (`@blog/ui`):** `HEADER_CONTROL_FRAME` (round, 1px border, the two
  tokens) and `HEADER_CONTROL` (the frame plus ink, transitions, §1's shared
  hover/open/focus/forced-colours). IconButton `circle` is built on it.
- **web:** `headerControlVariants` takes `HEADER_CONTROL` as its base and loses
  `isRound`; the header (`isInFooter: false`) branch of `language-codes-variants`
  uses `HEADER_CONTROL_FRAME`; the account frame uses `HEADER_CONTROL_FRAME`.
- **Per-tenant values:** `HEADER_CONTROL_STYLE_DECLARATIONS` in
  `packages/config/src/theme/theme-declarations.ts`, mapped by `to-theme-tokens`
  and spread into `:root` by `build-theme-style-block`; revalidation rides the
  existing `site-config:<id>` tag. The contrast guard gains a
  `headerControlStyle` axis (treating `transparent` as `--primary`).
- **Platform preview:** `buildShapePreviewTokens` spreads the declarations on
  every render, OUTLINED included, or a dark preview resolves light values.

## 5. The Look setting

- Const: `HEADER_CONTROL_STYLE = { OUTLINED, SOFT, PLAIN }` in a new
  `packages/config/src/constants/header-control-style.ts`, with
  `THeaderControlStyle`. Value names describe chrome only (no PILL — it collides
  with `CONTROL_RADIUS.PILL`; no GHOST — Button's ghost has a border).
- Storage: pgEnum `header_control_style`, column
  `site_config.header_control_style` `.notNull().default('OUTLINED')`. The
  migration is additive (`CREATE TYPE` + `ADD COLUMN … DEFAULT 'OUTLINED' NOT
NULL`), needs no backfill, and its apply on shared branches is human-gated.
- Preset: joins `TPresetBundle` as `headerControlStyle`, OUTLINED for both
  CONSOLE and EDITORIAL; `applyPresetDefaults` takes it from the bundle, so
  "Reset to preset" resets it with the rest of Shape.
- Look page: the fourth field in the **Shape** card, after Card style; it joins
  `CARD_FIELDS.shape`. Shape's description becomes "Corners, spacing, and how
  cards and header buttons are framed." Field label "Header buttons", hint "The
  language, theme, menu and Sign in buttons, at every screen size." A
  SegmentedControl in description mode: Outlined — "A thin outline around each
  button"; Soft — "A grey fill, no outline"; Plain — "No outline until
  hovered". Platform UI copy in 5 locales, never Voice.
- Preview: SampleSiteHeader renders the family from the recipe — the language
  switcher in the tenant's switcher style, the 36px theme circle, and the
  signed-out Sign in pill when the tenant has a reader feature on — and, with
  an explicit `isNarrow`, the phone bar (brand | person circle | menu circle).
  Signed out, at rest, no popover.
- Plan gating: Growth-only under #5052; Free sites resolve to the preset's
  OUTLINED through #5053.

## 6. Person icon (`ICONS.USER`)

The front figure of `users.svg`, centred and scaled up about 6%:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.8" r="3.4"/><path d="M5.5 20 C5.5 16 8.4 14 12 14 C15.6 14 18.5 16 18.5 20"/></svg>
```

Always `aria-hidden`. Not added to `FEATURE_ICONS`.

## 7. Out of scope

- The signed-in desktop hard-load shift (a pre-paint account hint).
- The sign-in panel's ARIA: it is `role="menu"` but holds headings, a hint and
  an email input; it should be a non-modal dialog, and labelled triggers should
  drop the native `title`.
- Footer language codes, which are plain links with no chrome.
- A square header — a family-wide `CONTROL_RADIUS` follow-up, never a value of
  this setting.

## 8. Superseded decisions

- #4146 (header controls follow the radius setting): every header control is
  round.
- #5406 (labelled 44px Sign in pill on phones): replaced by the person circle
  plus the drawer row.
- #5423 (44px avatar on phones, loading matches the avatar): the 44px phone
  frame stays; desktop becomes the 36px frame and loading matches the
  signed-out footprint.
- #5069: its header-control bullet is struck — the bar is always round.
