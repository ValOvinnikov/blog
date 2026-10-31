# Voice page: grouped sections and a sticky chip bar (V3a)

Design of record for the Voice page redesign chosen on 30 Oct (direction V3a),
reconciled on 30 Oct with the cross-set precedence rule the user approved
("Yes, use that rule"). Each kind of detail comes from one fixed source:

| Kind of detail                                                                        | Source                                                                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Shell: sidebar, top bar, breadcrumb, account menu, phone Menu, content edge           | **SH1** (drawn around Voice in TH1 colours on `gap-shell-sh1-in-th1`)                 |
| Colour and tokens: palettes, popover colours, control borders, focus ring, dark theme | **TH1**                                                                               |
| Cards (chrome, header, title), status pills, page heading                             | **Layout B** (dashboard)                                                              |
| Tooltip                                                                               | Layout B's look; opens after Base UI's default hover delay, at once on keyboard focus |
| The Voice page itself: head content, note row, chip bar, sections, rows, save bar     | **V3a**                                                                               |
| Anything no board drew                                                                | drawn before filing — every Voice gap is now drawn (table below)                      |

Where V3a disagrees with a row above, the row wins and this document says so at
the value. X-numbers (X1…X30) are the cross-set conflict resolutions in
`2026-10-30-admin-redesign-resolutions.md` § 1, which lands on `main` with this document.

Canvas: https://claude.ai/artifact/LVch29ZcSE9Lh5T3Cocm9J

| Board id                           | Title on the canvas                  | Frames (ids used below)                                                            | Settles             |
| ---------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- | ------------------- |
| `voice-V3a-chip-bar-desktop`       | "Voice section chip bar" (1440×1600) | A                                                                                  | the page at 1440    |
| `voice-V3a-chip-bar-states`        | "Voice chip bar states" (1440×3520)  | B1–B7                                                                              | states, phone, 1280 |
| `gap-voice-phone-head`             | "Voice phone head" (1440×1400)       | P1 three languages · P2 Français selected · P3 single language                     | D10                 |
| `gap-voice-phone-chipbar-unpinned` | "Voice phone chip bar"               | U1 in flow · U2 about to pin · U3 pinned                                           | D25                 |
| `gap-voice-field-cards`            | "Voice field cards"                  | F1 1440 Error pages expanded · F2 390 Page not found · F3 390 Error page           | D32                 |
| `gap-voice-show-preview-pressed`   | "Voice preview shown"                | S1 390 Hide preview                                                                | D33                 |
| `gap-voice-phone-footer-states`    | "Voice phone footer states"          | E1 error after Save · E2 two errors, link focused · E3 saving · E4/E5 320 strips   | D24, D41            |
| `gap-voice-notices`                | "Voice notices"                      | NA archived · NB save failed · NC1 draft offered · NC2 draft, page saved since     | D36                 |
| `gap-voice-820`                    | "Voice at 820"                       | M1 820 in flow · M2 820 pinned, overflow · M3 save-bar strips · M4 chip-bar strips | D11                 |
| `gap-theme-token-dark-values`      | "Token dark values"                  | Light and Dark palettes, chip-tone specimens, shadows                              | dark token values   |
| `gap-shell-sh1-in-th1`             | "SH1 shell in TH1 colours"           | the shell every Voice frame sits in                                                | shell (reference)   |

Every value below is copied from a board source, never rounded. The gap frames
were drawn under the rule; where one still copies a V3a value the rule
overrides (a 22px pill, the #818a99 border, the 8px amber row dot, V3a's dark
240px sidebar), the rule's value applies and the section says so. A builder
never invents a value this document does not state; anything missing is a
question, not a judgement call.

**This document lands on `main` in #6314** — the docs-only PR that carries
the six reconciled specs and `2026-10-30-admin-redesign-resolutions.md` — before the epic or any
sub-issue is filed, so every ticket's `## Design` link resolves on the day it
is filed.

Element ids (A12, B3-6, P1, M2, …) are the inventory numbers used throughout:
board A is the V3a desktop board, board B the V3a states board (B1…B7 its
frames), and the gap frames carry the ids in the table above. Token names are
given beside each hex value; a builder uses the token, never the hex.

## 1. Why

The Voice page today is a flat list of four surface cards with an "On this
page" index. Earlier admin redesigns shipped without parts that were drawn
(the onboarding stepper on W2 is the known case), so this document lists every
element, every state and every value, and § 20 is a checklist a reviewer ticks
against the built page frame by frame. The manual-test issue carries a copy of
§ 20, so the checklist outlives this document.

## 2. Goals and non-goals

Goals:

- Surfaces grouped into collapsible **sections** (Error pages, Empty states),
  each with a header button, a meta line and, while collapsed, a summary list.
- A **sticky chip bar** above the sections (main has no index column; the cards are a flat stack): one chip
  per section, a "customised" count, scroll-spy, Expand all / Collapse all.
- The **Light / Dark live-preview switch** becomes two icon buttons with
  tooltips. The control is the shared `IconToggleGroup` #6382 builds,
  as the Colour scheme group #6390 defines for the preview toolbar;
  Voice renders that same group (#6406), so the admin has one icon
  scheme switch (§ 7). Look and onboarding reach it through the
  shared device-frame preview (#6390 → #6426 → #6332).
- Restyled page head content, language switcher, info note, surface cards,
  list rows, field cards, editor, preview pane and save bar, at the exact
  values below.
- A phone layout (390), a 768–1023 layout (820) and the 1024+ layout for the
  bar, the sections, the cards and the save area.

Non-goals:

- **The app shell.** Sidebar, top bar, breadcrumb and phone Menu are SH1's
  (#6287, NEW-SH1-*), in TH1 colours (`gap-shell-sh1-in-th1`). V3a's dark
  240px sidebar (A1–A15), 56px header (A16–A18) and dark phone header with the
  Menu button (B1-1, B2-1) are backdrop; so are the dark phone headers some gap
  frames copied from V3a. SH1 draws the top bar 59px from `md` and 67px on
  a phone, while `--spacing-admin-topbar` stays 68 as the document's scroll
  padding (X4); the chip bar sticks at the drawn heights, never at the token
  (§ 5.3 "Sticky offset", § 14).
- **Shared primitives other sets own.** Voice consumes them and builds none of
  them: the Tooltip (#6370, X1), pill size and tones (#6356, X12), the
  page heading (#6357, X19), card chrome (#6355, X15), the gapped
  focus ring and control borders (#6337, X13, X14), the icon toggle group
  (#6382), the unsaved dot (#6387), icon sizes (#6361), the
  admin mono font (#6288, X24) and the save bar's location and LX phone layout
  (#6388, X16).
- The "example" sections **Confirmations** and **Sign-in**, and the example
  rows **Link expired**, **Search results**, **Comments**, **Subscription
  confirmed**, **Unsubscribed**, **Message sent**, **Check your email**,
  **Sign-in failed** (B2, B5, M2). They show how the page scales; the surfaces
  do not exist yet. The layout handles N sections and N chips, but no example
  copy ships.
- **The admin dark theme.** #6291 owns it. This design adds light token values
  only; the dark value of every token it adds is drawn on
  `gap-theme-token-dark-values` and applied by #6291. The Voice manual test
  runs after #6291 and covers Light and Dark (X27).
- The site specimen inside the preview pane (A67–A69). It renders the tenant's
  real site with `@blog/ui`; the Field Notes colours are sample data.

## 3. Frames and breakpoints

| Frame  | Size      | What it shows                                                                                                      |
| ------ | --------- | ------------------------------------------------------------------------------------------------------------------ |
| A      | 1440×1600 | Desktop, unscrolled. Errors section collapsed, Empty states expanded, Topic page row open with an unsaved change.  |
| B1     | 390×844   | Phone, scrolled to Empty states. Pinned bar, chips scrolled, icon Expand button.                                   |
| B2     | 390×844   | Phone, four sections (two are examples), scrolled to Confirmations, saved state.                                   |
| B3     | 490×844   | Keyboard focus: chip, Expand all, phone icon button, section header, Light/Dark.                                   |
| B4     | 1280×820  | Desktop with sidebar, scrolled into Empty states; the bar pinned edge to edge.                                     |
| B5     | 1360×880  | Four sections all collapsed (12 surfaces). A scaled overview: its spacing differs from A (D1).                     |
| B6     | 660×440   | Edge: a save error in a field. A cropped excerpt (no route, no panel head, no toolbar).                            |
| B7     | 660×440   | Edge: new site, nothing customised. A cropped excerpt (no summary lists drawn, D20).                               |
| P1–P3  | 390×844   | Phone head: three languages (English); Français selected, track scrolled; single-language site.                    |
| U1–U3  | 390×844   | Phone chip bar in flow at the top, 10px short of pinning, pinned once the Error pages header has passed.           |
| F1     | 1440      | Error pages expanded: Page not found (saved custom Heading, unsaved Supporting text) and Error page (all default). |
| F2, F3 | 390       | Page not found and Error page on a phone: one column, no preview, 44px Reset and toolbar.                          |
| S1     | 390       | Empty lists after "Show preview": "Hide preview", focused, the preview group below it.                             |
| E1–E3  | 390×844   | Phone footer: error right after Save; two errors, scrolled, "Go to the first one" focused; saving.                 |
| E4, E5 | 320       | Footer-only strips: error (two rows, 85 tall) and saving.                                                          |
| NA     | 1440      | Archived tenant, read-only, full page.                                                                             |
| NB     | 1440×900  | Save failed with no field errors: server-error Alert.                                                              |
| NC1    | 1440×760  | Draft offered back (warning DraftRecoveryBanner).                                                                  |
| NC2    | 1440×860  | Draft offered back after the page was saved since (error tone, differences table open).                            |
| M1     | 820       | 768–1023 form: bar in flow, every section collapsed, nothing to save. Content column 504.                          |
| M2     | 820       | 768–1023 form: four sections, bar pinned, chips overflowing, one unsaved change.                                   |
| M3     | 768–1024  | Save-bar strips: unsaved, saving, all saved, error, 768 plural error, 1024 return to the desktop bar.              |
| M4     | 768–1024  | Chip-bar strips: 768 pinned, 820 error chip, 820 focus + tooltip, 1024 desktop form returns.                       |

V3a's boards draw a dark 240px sidebar; every width below assumes SH1's 264px
expanded sidebar (76px collapsed) instead, so content widths are SH1's: the
content column is the viewport minus the sidebar minus 2 × 26 — **1124** at
1440, **964** at 1280, **504** at 820, **708** at 1024.

Breakpoints (repo rules, `platform-ui-practices`):

| Range                         | Layout                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| below `md` (< 768)            | **Phone** form of the head (§ 6.1), note row (§ 7.1), bar (§ 8.3), sections (§ 9), summary rows (§ 10.2), list rows (§ 11.4), field cards (§ 11.8), footer (§ 12.3); 44px controls.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `md` to below `lg` (768–1023) | Desktop head and note row; the **768–1023 bar** (§ 8.5); sections and summary rows (§ 10.1, name column 150); card body **one column**, list rows in desktop form, "Show preview" (§ 11.4) under the Empty lists list instead of the preview pane; the **768–1023 save bar** (§ 12.4). Drawn: M1–M4. Spacing is board A's at every width from `md` — section gap 28, header-to-body 10 / 12 (§ 9), summary-row padding 10px 18px (§ 10.1), head-row gap 16 (§ 6 A20), bottom padding 120 (§ 6 A19); M1's 20 / 8 / 10px 16px / 12px 24px / 96 are dropped. The 768–1023 bar's own flex gap is M1's 8 (§ 8.5). |
| `lg` and up (≥ 1024)          | Card body two equal columns `repeat(2, minmax(0, 1fr))`: list or fields + preview pane. No "Show preview" button. The bar and the save bar take their 1280 form (M4 "1024 · desktop form returns", M3 "1024 · back to the desktop bar").                                                                                                                                                                                                                                                                                                                                                                     |

The 768–1023 forms follow the **window** width, not the column: collapsing the
sidebar widens the column but does not switch the form (M2 note, same rule as
`gap-dash-band-820`).

## 4. Data: the section grouping key

`VOICE_SURFACE` (`packages/config/src/voice/voice-surface.ts`) has no group.
Only `apps/platform` reads a grouping (web never groups; `@blog/db` reads
`VOICE_SURFACE` only in a test fixture), so under CLAUDE.md "An app's own
vocabulary lives in that app":

| Item                           | Home                                                                                        | Value                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `VOICE_SECTION`                | new `apps/platform/src/constants/voice.ts`                                                  | `{ ERROR_PAGES: 'ERROR_PAGES', EMPTY_STATES: 'EMPTY_STATES' } as const`   |
| `TVoiceSection`                | same file                                                                                   | `TValueOf<typeof VOICE_SECTION>`                                          |
| `VOICE_SECTIONS_IN_PAGE_ORDER` | `apps/platform/src/utils/voice-draft/voice-draft.ts`, beside `VOICE_SURFACES_IN_PAGE_ORDER` | `[ERROR_PAGES, EMPTY_STATES]`                                             |
| `VOICE_SURFACES_BY_SECTION`    | same                                                                                        | `ERROR_PAGES → [NOT_FOUND, ERROR]`, `EMPTY_STATES → [ARCHIVE, BOOKMARKS]` |
| `VOICE_SURFACES_IN_PAGE_ORDER` | same                                                                                        | **derived** from the two above                                            |

The page renders the cards in the order Page not found, Error page, Empty
lists, Bookmarks — the same order as today. No `section` property is added to
`VOICE_FIELDS` in `@blog/config`. Run `pnpm gen:const-index`. The day a second
workspace reads the grouping, it moves to `@blog/config` in that change.

Derived counts, per locale:

| Count                       | Rule                                                                                                                                | Example                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Section fields              | sum of fields of its surfaces; a list item counts as one field                                                                      | Empty states: 5 lists + 1 field = "6 fields" |
| Section customised          | fields whose **draft** value differs from the default — saved or unsaved, so an unsaved edit counts at once, as its pill does (D46) | "2 customised"                               |
| Chip count                  | the section's customised count; **shown only when > 0**                                                                             | "1 customised" / nothing                     |
| Surface count (summary row) | "3 fields", "2 fields", "5 lists", "1 field"                                                                                        |                                              |
| Surface badge               | Customised when any of its fields is customised, else Default                                                                       |                                              |
| Section errors              | fields with a validation error after a save attempt                                                                                 | "1 error" on the chip                        |
| Row unsaved                 | a list row or field whose draft differs from its saved value (shows the unsaved dot, D22)                                           | Topic page in A                              |

**Unsaved edits in the counts (D46; decided 31 Oct).** Every customised count — the chip,
the section meta, the card summary and the language sub-line — uses the rule
above. Decided 31 Oct: the draft, saved
or not, which is today's behaviour (`countCustomisedVoiceFields` reads the
draft values) and agrees with the Customised pills beside each count.
`gap-voice-field-cards` F1 and F2 print the counts from before Supporting
text's unsaved edit ("3 fields · 1 customised", "5 fields · 1 customised",
chip "1 customised", English "3 customised") beside two Customised pills;
under the rule that state reads "3 fields · 2 customised", "5 fields · 2
customised", chip "2 customised" and "Default language · 4 customised"
(§ 11.8). Board A reads the same under either answer: its Topic page edit sits
on a row already saved as customised, so "5 lists · 2 customised" holds.

## 5. Tokens

Existing tokens in `apps/platform/src/styles/admin-theme.css` that match, with
the values TH1 sets through #6288 (X14: the boards' #818a99 control border is
dropped everywhere):

| Value                                                        | Token                                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| #4f46e5 / #3730a3 / #eef2ff                                  | `admin-brand` / `admin-brand-strong` / `admin-brand-weak`                         |
| #12141a / #5b6472                                            | `admin-text` / `admin-muted`                                                      |
| #e5e7eb / #eef0f3                                            | `admin-line` / `admin-line-2`                                                     |
| #878f9d                                                      | `admin-control-line` (X14; was #818a99 on every V3a and gap board)                |
| #eef0f3 (Light / Dark track, language track)                 | TH1 theme track (#0f1115 in Dark)                                                 |
| #eef1f6                                                      | `admin-surface-head` (card header, X15; #6288)                                    |
| #f6f7f9 / #fbfbfd / #ffffff                                  | `admin-bg` / `admin-surface-2` / `admin-surface`                                  |
| #8a5f00 / #b42318 / #dd6152 / #fdeceb                        | `admin-warn` / `admin-bad` / `admin-bad-line` / `admin-bad-weak`                  |
| `0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)` | `--shadow-admin`                                                                  |
| `0 12px 40px rgba(16,24,40,.14)`                             | `--shadow-admin-lg` (the shared tooltip, X1)                                      |
| 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 16px                | `text-admin-11` … `text-admin-16`                                                 |
| 6px / 4px radius                                             | `rounded-admin` / `rounded-admin-control`                                         |
| JetBrains Mono 500                                           | `font-admin-mono` (#6288 owns the admin mono font, X24)                           |
| 22px/28px                                                    | `text-admin-22` (#6357 adds it with the global page heading, X19)                 |
| #e2e5ea                                                      | the icon-button hover token #6381 adds (`hover` on `gap-theme-token-dark-values`) |

**White on a brand fill is fixed, never `admin-surface`.** "A builder uses
the token, never the hex" maps the boards' #fff / #ffffff grounds — chip,
bar, card, list, inputs, and the error pill inside the active chip (§ 8.4) —
to `admin-surface`, which is #171a20 in Dark (the Dark error pill is
admin-bad #fca5a0 on #171a20, as `gap-theme-token-dark-values` draws it). It
does **not** map text on an `admin-brand` fill: the active chip's text and
count (A36), its hover (D6) and the Save changes label (§ 12.1, § 12.3) are
the fixed white the theme spec names for that role ("`white` is the fixed
white of text on a brand fill, not a token"; Tailwind `text-white`), #ffffff
in both themes (5.56:1 on the Dark brand #5850ec). No new token is added for it.

New tokens this design needs (#6403, light values only; their dark
values are drawn on `gap-theme-token-dark-values` and applied by #6291):

| Value                           | Token                       | Dark (applied by #6291)     | Used by                                                 |
| ------------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------- |
| #c7d2fe                         | `--color-admin-brand-line`  | #343a78                     | note border (A27), disabled phone Save fill (B2-16, E3) |
| `0 2px 8px rgba(16,24,40,.08)`  | `--shadow-admin-bar`        | `0 2px 8px rgba(0,0,0,.45)` | pinned bar (B4-3, B1-3, U3, M2)                         |
| `0 -2px 8px rgba(16,24,40,.06)` | `--shadow-admin-dock`       | `0 -2px 8px rgba(0,0,0,.4)` | docked save bar (A83, M3)                               |
| `0 1px 2px rgba(16,24,40,.08)`  | `--shadow-admin-xs`         | `0 1px 2px rgba(0,0,0,.4)`  | selected language option (A23)                          |
| #3730a3                         | `--color-admin-brand-hover` | #6159ee                     | active chip hover fill and border (A36; D6)             |

Dropped from the earlier draft of #6403: `--color-admin-hover` (#6381
adds the same #e2e5ea), `--text-admin-22` (#6357), `--font-admin-mono`
and the JetBrains Mono loader change (#6288, X24), and `--shadow-admin-tip`
(the phone tooltip now uses the shared tooltip's `--shadow-admin-lg`, X1).

`gap-theme-token-dark-values` also lists `note-line` (#6381's G2 note
border, rgba(79,70,229,.3)) beside `brand-line`; both are note borders and
render 1.18:1 apart. #6288 lands before either token exists, so the
duplicate check is #6403's, which lands after #6381 and compares
the two before adding `brand-line` (D48; decided 31 Oct): keep both.
`brand-line` is an opaque #c7d2fe that also fills the disabled phone Save on
white (B2-16, E3), where the translucent `note-line` would not give #c7d2fe,
and the two Dark values differ (#343a78; rgba(165,180,252,.3)). #6403
records the comparison in its Reuse item.

**Active chip hover (D6; theme spec § 20 item 3). Decided 31 Oct.**
`admin-brand-strong` cannot be the hover: TH1 sets it to #c7cdfd in Dark, so
the white chip text on it is 1.55:1 and fails the § 20 D box ("every text
pair reaches 4.5:1"). Decided 31 Oct: a `--color-admin-brand-hover` token, #3730a3 in Light (white 9.93:1) and
#6159ee in Dark (white 5.03:1, the value `gap-theme-token-dark-values` draws
and drew as the proposal). #6403 adds it with its light value; #6291 applies the
dark value and its two guard pairs ("White on active chip hover", "Active
chip hover on page").

### 5.1 Line heights (every text element)

The boards inherit `line-height: normal` (about 1.21 for Inter, 1.32 for
JetBrains Mono); the admin's Tailwind preflight sets 1.5. Without a pinned
line height every row below renders taller than the board. **Every text
element in this design states its line height**; the ones a section table
does not already give are pinned here, rounded from the board's rendered
metrics:

| Element                                              | Size / line height                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| language option name / sub-line (A22–A25)            | 13px/16px / 12px/15px → option ≈ 43 tall; below `md` 18 + 16 lines, ≥ 44 (P1) |
| "Jump to" (A33)                                      | 12px/16px                                                                     |
| chip name / count / error pill (A35, A36, B6-2)      | 13px/16px (13.5px/16px phone) / 12px/15px                                     |
| Expand all / Collapse all, Reset (A37, A38, A55)     | 12.5px/16px (Reset 13.5px/16px below `md`, F2)                                |
| summary row name / description / count (A43)         | 13.5px/16px / 12.5px/16px / 12px/15px                                         |
| list row name / route (mono) / value preview (A52)   | 13.5px/16px / 12px/16px / 13.5px/16px → ≈ 58                                  |
| status pill (A43, A52, F1)                           | 11.5px/16px inside the 20px pill (X12)                                        |
| preview label (mono, A66, A81)                       | 11px/15px                                                                     |
| save bar text / shortcut / Discard / Save (A83–A85)  | 13.5px/16px / 12px/15px / 13.5px/16px                                         |
| save error strip / link / "Not saved" (B6-8)         | 13px/16px / 13px/16px / 12.5px/16px (768–1023 stack: § 12.4)                  |
| phone footer text (B1-22, B2-16) / error status (E1) | 13px/16px / 13px/18px                                                         |
| Show preview (B1-20)                                 | 13.5px/16px                                                                   |
| editor toolbar buttons (A56–A59)                     | 13px/16px (15px below `md`, F2)                                               |
| field label (F1) / hint (F1)                         | 13px/18px (14px/20px below `md`, F2) / 12px/16px                              |
| text input (§ 11.8)                                  | 13.5px/20px from `md`, 16px/24px below `md`                                   |

Elements whose line height a section table states (h1, description, note,
card title, editor body, error text, tooltip) keep it.

### 5.2 Focus ring

One ring everywhere (X13, owner #6337): a 2px gap in the colour of the
ground the control sits on, then a 2px `brand-ink` ring: #4f46e5 in Light,
and #a5b4fc in Dark. The gap colour is the ground's, so on the page (#f6f7f9), the
Light / Dark track (#eef0f3), an open row (#fbfbfd) or a card header (#eef1f6)
no white band shows — the boards' `outline: 2px solid #4f46e5;
outline-offset: 2px` and SH1/LB's `0 0 0 2px <ground>, 0 0 0 4px #4f46e5` are
the same ring. Every control this design draws or changes uses #6337's
ring helper for its ground; none writes its own.

### 5.3 Hover and motion (D35)

The boards draw hover only on chips (A35, A36), Light / Dark (A30, A31), the
768–1023 icon button (#fbfbfd, M4) and the "Go to the first one" link (B6-8).
For everything else (colour resolved by TH1's `surface-2` "Card footer, row
hover"; motion confirm-only):

| Element                  | Hover                                                 | Motion                                                                                                   |
| ------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| section header (A41)     | none (no background, title unchanged); cursor pointer | chevron: one right-pointing glyph, `rotate(90deg)` when open, 150ms; body swaps with no height animation |
| summary row (A43)        | bg admin-surface-2 #fbfbfd                            | none                                                                                                     |
| list row trigger (A52)   | bg admin-surface-2 #fbfbfd (today's hover, kept)      | chevron right glyph `rotate(90deg)` when open, 150ms; the panel keeps today's height animation           |
| Expand / Collapse, Reset | the Button's secondary hover (#6358: brand border)    | none                                                                                                     |

`prefers-reduced-motion: reduce` removes every transition above and makes
every jump an instant scroll: a chip (#6420, #6421), a summary row
(#6417), "Go to the first one" and Save's reveal (#6422), and
the first-load hash (D9). The chip list's own `scrollLeft` change is instant
too.

The active chip hover is `admin-brand-hover` (§ 5, D6); no other hover colour is new.

Radii without tokens use arbitrary values in the variants files: 3px
(`rounded-[3px]`: icon button inside the track, `{name}` code chip), 5px
(`rounded-[5px]`: the Light/Dark track), 999px (`rounded-full`: chips, pills,
error pill). #6381 adds radius tokens 3 and 5; use them once it lands.

Sticky offset: SH1 draws the top bar **59px from `md` and 67px on a phone**
(X4); U1–U3 pin at 67 and M2 at 59. `--spacing-admin-topbar` stays **68**
(X4: it is the document's scroll padding and covers both heights), so the
bar does **not** stick at `top-admin-topbar`, which would leave a 9px gap
from `md` and 1px on a phone. Its `top` is the drawn height — 67 below `md`,
59 from `md` — written in the bar's variants file (D7). The heights are
SH1's (#6375 from `md`, #6376 on a phone), so #6420 follows
#6375 and #6421 follows #6376. § 14 gives the scroll margin
that goes with it.

## 6. Page head (A19–A25)

| #   | Element            | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A19 | content            | sits in SH1's content column (#6372): starts at the sidebar edge, padding **26px** from `md`, max-width 1180. the page has **bottom padding 120px** from `md` to clear the docked save bar (owned by #6413 with the bar; 96 below `md` by #6414; 48 when archived) and stacks head, shell notices, note row, bar and section stack in a column, **gap 20px** (V3a). V3a's 28px 40px padding, the gap 24 M1 copies from the shell default and M1's 96px bottom padding at 820 are dropped: 120 applies at every width from `md`, since 768–1023 docks the same 64px bar (§ 12.4) |
| A20 | head row           | the shared `PageHeader` row (#6357, X19): wraps, items top-aligned, **gap 16**; the title group grows from a 320px basis with `min-width: 0`; the language radiogroup sits in the actions slot. It wraps under the title block once the column is under about 720px (M1 note). M1's 12px row / 24px column gap is dropped: the shared row keeps gap 16 at every width from `md`                                                                                                                                                                                                 |
| A21 | `<h1>` "Voice"     | #6357's global heading (X19): **24px/32px 600, letter-spacing −.01em**, wraps anywhere; **22px/28px below `md`**. On the page background admin-bg #f6f7f9, **no white band**. V3a's 22px desktop size is dropped                                                                                                                                                                                                                                                                                                                                                                |
| A21 | description        | **4px** below the title, **13.5px/20px**, admin-muted #5b6472 (#6357): "Reword the site's page-level messages. Every field has a default, so change only what you want to sound like you." V3a's 620px cap and 6px gap are dropped with the rest of V3a's head metrics                                                                                                                                                                                                                                                                                                          |
| A22 | language switcher  | `role="radiogroup" aria-label="Language"`; track: padding 3, bg TH1 theme track #eef0f3, **radius 6, no border**, gap 2, inline-flex, flex none                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| A22 | option             | `<button role="radio" aria-checked>`, padding 6px 12px, no border, radius 4, text-align left; two block spans: name **13px/600 admin-text**, sub-line **12px Inter admin-muted** (not mono)                                                                                                                                                                                                                                                                                                                                                                                     |
| A23 | English (selected) | `aria-checked="true"`, bg admin-surface #fff, `shadow-admin-xs`. Sub-line "Default language · 3 customised"                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| A24 | Nederlands         | `aria-checked="false"`, transparent. Sub-line "All default"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| A25 | Français           | `aria-checked="false"`, transparent. Sub-line "1 customised"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| —   | min-width          | the **default-language option** min-width **150**, every other option **120**, whatever is selected — so switching never shifts the layout (D28)                                                                                                                                                                                                                                                                                                                                                                                                                                |
| —   | focus              | the gapped ring (§ 5.2), gap in #eef0f3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Radio semantics: arrow keys move the selection inside the group; one tab stop.
The language switcher only renders with more than one locale (today's rule).

The column stack is `SettingsFormShell`'s root
(`components/shared/settings-form-shell/`), today `flex flex-col gap-6` (24)
on every settings page. It renders `PageHeader` (the radiogroup reaches its
existing `actions` slot through the shell's `headerActions`), then the
archived notice, the error Alert and the draft-recovery banner, then its
children (the note row onward). #6416 gives the shell an opt-in stack
gap, 20 from `md` and 16 below, that Voice passes; every other settings page
keeps 24. No `page-header/` file changes.

### 6.1 Phone head (below `md`; P1–P3)

| Item            | Values                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| content         | padding **14px 16px 96px**, column, **gap 16** (B1-11, P1); the 16px sides are SH1's (#6372), the 96 bottom #6414's with the footer                                                                                                                                                                                                                                                                                |
| order           | head, language track, note, Live preview row, chip bar, sections; shell notices (§ 6.2) go between the head and the note — after the language track, which is part of the head as on desktop — each its own item in the gap-16 stack                                                                                                                                                                               |
| title block     | h1 22px/28px 600, −.01em, wraps; description 13.5px/20px admin-muted, 4px below, full width (X19 phone values)                                                                                                                                                                                                                                                                                                     |
| language track  | **12px** below the title block, **full width** (358 at 390); padding 3, gap 2, #eef0f3, radius 6, no border                                                                                                                                                                                                                                                                                                        |
| options         | the desktop look and min-widths (default 150, others 120); each **at least 44 tall** (6px padding, name line 18 + sub-line 16)                                                                                                                                                                                                                                                                                     |
| overflow        | the track scrolls sideways, no visible scrollbar; a **28px fade** on each side that has more (`aria-hidden`), from the TH1 theme-track token `admin-theme-track` (#eef0f3 Light, #0f1115 Dark — not `admin-line-2`, which is also #eef0f3 in Light but not the track's Dark ground) to the same token at zero alpha; selecting an option scrolls it fully into view by changing only the track's `scrollLeft` (P2) |
| single language | no track at all; the note drops its second sentence; everything else keeps its place (P3)                                                                                                                                                                                                                                                                                                                          |

P2's scroll offset (116px) was estimated on the board, not measured; the rule
is "the selected option fully in view", not the number.

P1–P3 are cropped below the head: they draw both sections collapsed with no
summary list. On the page every section is collapsed on first load (D9) and
every collapsed section shows its summary list (rule 9, D20); those rules win
over the crop.

### 6.2 Shell notices and the archived state (NA, NB, NC1, NC2; D36)

`SettingsFormShell` renders three items, in this order, **directly under the
page head and above the note row**, each its own item in the gap-20 stack
(gap 16 below `md`). They keep today's `Alert` look: border at 30% of the
tone, radius 6, padding 14px 16px, the card shadow; title 13.5px/600,
description 12.5px admin-muted. Alert buttons are 13px with 8px 13px padding
(about 37 tall) from `md` and 44 tall below `md`, as today. Nothing here is
restyled.

| Frame | Item                               | Values                                                                                                                                                                                                                                                                                             |
| ----- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NA    | `ArchivedTenantNotice`             | warning Alert, `role="status"`: "This tenant is archived" + "Deprovisioned {date}. Everything on these pages is read-only."                                                                                                                                                                        |
| NB    | server-error Alert                 | error Alert, **title only**, `role="alert"`, **as wide as its text** (`w-fit`): "Couldn't save every change — the ones still marked Unsaved weren't saved. Try again." (`voiceSettings.alertError`). Shown after a failed save with **no** field errors                                            |
| NC1   | `DraftRecoveryBanner`              | warning Alert, `role="status"`: "You have unsaved changes from {time}." + "They were kept on this device when you left the page."; primary "Restore {n} changes", ghost "Discard them"                                                                                                             |
| NC2   | `DraftRecoveryBanner`, saved since | the same banner in the **error** tone: "…but this page was saved at {time}." + "Restoring replaces {n} of the newer values: {field}."; an inline disclosure "Review the difference" (open in NC2) holding a Field / Saved / Your draft table; secondary "Restore anyway", ghost "Discard my draft" |

Around each notice:

- **Archived (NA).** The language radiogroup, Light / Dark, chips, Expand all
  / Collapse all, section headers, summary rows, list rows and Show preview
  stay operable (they only navigate or reveal). Every editor and text input
  uses today's read-only control: **no formatting toolbar**, fill and border
  #eef0f3, text admin-muted #5b6472 (5.2:1), each pointing at the notice with
  `aria-describedby`. This holds in the open list-row panel (the Topic page
  row NA draws open) as much as in the field cards. The hint ("A topic with no
  posts yet") and the "Keep {name} — the site fills it in." note stay, as NA
  draws them, around the read-only control; only Reset goes. No Reset, no
  unsaved dot, no save bar or phone footer at any width (the phone footer's
  clean "All changes saved" state does not render either); the page ends at a
  **48px** bottom padding instead of 120 / 96.
- **Save failed, no field errors (NB).** The docked bar keeps its unsaved
  state ("1 unsaved change", shortcut, Discard, Save changes) and the row
  keeps its unsaved dot; the Alert is the whole message. No chip error pill
  and no red section meta, since no field has an error: chips keep their
  counts and metas their "N customised" text.
- **Draft offered (NC1, NC2).** The page shows the saved values until Restore,
  so the page is clean: no unsaved dot, no docked bar from `md`, and below `md`
  the phone footer in its clean "All changes saved" state.
- **First-view state in NC1 / NC2.** Both frames draw Empty states expanded
  with no list row open. That is the page after the reader opened Empty
  states and closed its row: on load every section is collapsed (D9), and
  opening Empty states for the first time opens its first row (D40). D9 and
  D40 win; the notices themselves are as drawn.

Copy: every string is existing (`archivedTenantNotice`,
`voiceSettings.alertError`, `draftRecovery`, `voiceSettings.draftFieldLabel`);
dates, times and draft values are sample data.

## 7. Note and live-preview switch row (A26–A31)

| #      | Element      | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A26    | row          | flex, **gap 16**, `align-items: stretch`. Note first (flex 1), switch group last                                                                                                                                                                                                                                                                                                                                                                                         |
| A27    | note         | `role="note"`, flex 1, flex, gap 10, padding **10px 14px**, bg admin-brand-weak #eef2ff, border **1px admin-brand-line #c7d2fe**, radius 6, **no shadow**, text **13px/19px admin-text**                                                                                                                                                                                                                                                                                 |
| A27    | info icon    | 16×16, stroke admin-brand #4f46e5, width 2, circle r9 + `M12 11v5M12 8h.01`, flex none, margin-top 2                                                                                                                                                                                                                                                                                                                                                                     |
| A27    | text         | "Buttons, menus and labels are translated for you and stay the same on every site, so they aren't listed here. Editing **English** — other languages keep their own text." The second sentence shows only with more than one locale (today's rule); "English" is the current locale name, bold.                                                                                                                                                                          |
| A28    | switch group | flex, `align-items: center`, **gap 8** between the label and the track; it stretches to the note's height and its contents sit vertically centred against the note                                                                                                                                                                                                                                                                                                       |
| A28    | label        | "Live preview", 12px/16px admin-muted #5b6472, nowrap                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A29    | track        | #6382's `IconToggleGroup`: `role="group" aria-label="Preview colour scheme"`; inline-flex, padding 2, gap 2, bg TH1 theme track #eef0f3, border 1px admin-control-line **#878f9d** (X14), **radius 5**                                                                                                                                                                                                                                                                   |
| A30    | Light        | `button aria-pressed="true" aria-label="Light"`, **32×32** (#6382's size from `lg`; V3a drew 30), radius 3, sun icon 16px stroke 1.8. Pressed: TH1's checked plate (admin-surface #ffffff in Light, popover-hover #323845 in Dark), icon admin-brand-strong (#3730a3 / #c7cdfd), an inset 1.5px **admin-brand-ink** ring (#4f46e5 / #a5b4fc; the board's #4f46e5 is brand-ink, not `admin-brand`, which is #5850ec in Dark); hovering the pressed button changes nothing |
| A31    | Dark         | `aria-pressed="false" aria-label="Dark"`, moon icon. Unpressed: icon admin-muted #5b6472 on the track. Hover: icon admin-text #12141a on #6381's hover token #e2e5ea                                                                                                                                                                                                                                                                                                     |
| —      | size         | the primitive's rule (#6382): **32×32 from `lg`**, **44×44 below `lg` and on touch**. A and M1 draw 30; one component keeps one size rule, so 32 applies from `lg` and 44 at 820                                                                                                                                                                                                                                                                                         |
| A30/31 | tooltip      | the shared Tooltip (#6370, X1): "Light" / "Dark"; #12141a, white 12px/1.5 weight 500, padding 4px 8px, radius 4, `shadow-admin-lg`, one line, 6px below the trigger; opens after Base UI's default hover delay and at once on keyboard focus; Escape hides it; visual only (`aria-hidden`), the button's `aria-label` carries the name. **No tooltip on touch** (P1)                                                                                                     |
| A30/31 | focus        | the gapped ring (§ 5.2), gap in #eef0f3                                                                                                                                                                                                                                                                                                                                                                                                                                  |

The group is #6382's `IconToggleGroup`, and the Light / Dark group
(SUN and MOON, the names, the tooltips) has one owner: the Colour scheme
group #6390 defines for the shared preview toolbar. #6406 moves
that group out of `preview-frame/` into its own folder under
`components/shared/` and renders it on Voice, so the admin has one icon
scheme switch; `preview-mode-control/` gains no icon look. V3a's own tooltip (ARROW,
centred, 8px below, no shadow, instant on hover) is dropped (X1, D43).

Sun glyph: circle r4 + 8 rays, stroke 1.8. Moon glyph:
`M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z`, stroke 1.8. Both 24×24
viewBox, round caps and joins, `currentColor` (registered on the platform by #6405).

### 7.1 Phone note row (below `md`; P1–P3)

The note and the Live preview row stack, **12px apart**, as one item in the
gap-16 stack. Note: full width, the desktop look (padding 10px 14px, #eef2ff,
1px #c7d2fe, radius 6, 13px/19px). Live preview row: right-aligned, label
12px/16px admin-muted, **gap 8** to the track; Light / Dark **44×44** (track 50
tall), the desktop pressed style; no tooltip on touch, the buttons keep their
`aria-label`.

## 8. Chip bar

### 8.1 Desktop, unscrolled (≥ 1024; A32–A38, B5-1, B7-1)

| #       | Element                   | Values                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A32     | bar                       | `role="region" aria-label="Sections"`; **position sticky; top = the drawn top-bar height (59 from `md`, § 5.3; not `top-admin-topbar`, which stays 68); z-index 3**; flex, centred, **gap 12**; padding **8px 10px 8px 14px**; bg #fff; border 1px admin-line #e5e7eb all round; radius 6; no shadow                                                      |
| A33     | label                     | "Jump to", 12px/600 admin-muted #5b6472, **nowrap**, flex none, `aria-hidden="true"`                                                                                                                                                                                                                                                                      |
| A34     | nav                       | `<nav aria-label="Voice sections">`, flex 1, min-width 0; `ul` flex, **gap 8**, margin 0, padding 0, no list style, **overflow-x auto, scrollbar hidden** (no board draws one); each `li` flex none                                                                                                                                                       |
| A35     | chip (inactive)           | `<a href="#sec-…">`: inline-flex, centred, **gap 8** (name to count), **height 32**, padding 0 12, border 1px admin-control-line **#878f9d** (X14), radius 999, bg #fff, 13px/600 **admin-text #12141a, `text-decoration: none`** (overrides the admin's default link colour and underline), nowrap. Hover bg admin-surface-2 #fbfbfd, text stays #12141a |
| A35     | count                     | "1 customised", 12px/500 admin-muted #5b6472, only when count > 0                                                                                                                                                                                                                                                                                         |
| A36     | chip (active)             | `aria-current="true"`, bg admin-brand #4f46e5, border #4f46e5, text and count the fixed white #fff (§ 5; never `admin-surface`). Hover: fill and border `admin-brand-hover` (#3730a3 Light, #6159ee Dark; D6 — `admin-brand-strong` is #c7cdfd in Dark, 1.55:1 under white), text the fixed white                                                         |
| A37/A38 | Expand all / Collapse all | wrapper flex, **gap 6**, flex none. Each: XS secondary Button (#6410) — **height 28**, padding 0 10, border 1px admin-control-line #878f9d, radius 4, bg #fff, **no shadow**, **12.5px/600** admin-text. `aria-controls` lists every section body id                                                                                                      |
| —       | no-op state               | both buttons stay enabled in every state; pressing one when every section is already open (or closed) does nothing (B5 and B7 draw both enabled with every section collapsed)                                                                                                                                                                             |
| —       | focus                     | the gapped ring (§ 5.2) on chips and buttons (B3-1, B3-3)                                                                                                                                                                                                                                                                                                 |

At 1360 B5-1 draws four chips (two are example sections) on one line. Today's
two sections give two chips, which fit on one line with nothing scrolled and
no fade at every width from 768. Past about six sections the chip list
scrolls sideways (B5 caption); it never wraps to a second line.

Chip behaviour, every width (§ 8.3 and § 8.5 add their own parts):

- **Activation.** Click, tap and Enter on a chip all do the same thing (rule
  3): open the section if collapsed, scroll its header to 16px below the bar
  (instant under reduced motion), move focus to the header button, and make
  that chip active at once (it does not wait for the scroll-spy).
- **URL.** Activating a chip replaces the URL hash with the section id
  (`history.replaceState`, no history entry, no browser jump), so the address
  can be shared and the first-load rule (§ 9) reopens that section. Summary
  rows do the same with the card id.
- **Overflow (D37).** When the chips overflow, the active chip is brought into
  view by changing only the list's own `scrollLeft` (never `scrollIntoView`),
  at every width; a fade shows on each side that has hidden chips (28px
  left and 36px right on a phone, § 8.3; **28px on each side** from `md`,
  1024 and up included, M2). Each
  fade runs from the bar's ground token `admin-surface` (#ffffff Light,
  #171a20 Dark) to the same token at zero alpha — never a literal white,
  which would draw a white band on the Dark bar (`gap-theme-token-dark-values`,
  "Phone index · fade to fade-end"); the
  list scrolls with a trackpad, shift + wheel or by tabbing through the chips.
  With today's two sections nothing overflows from 768 up and no fade shows
  (M4 "768 · pinned, two sections": 390px of chips in 403px).
- **Focus ring room.** The scroller clips vertically (`overflow-x: auto`
  forces it), which would cut the ring off the top and bottom of a 32px (44px
  phone) chip. The `ul` gets `padding-block: 4px` with `margin-block: -4px`,
  and `scroll-padding-inline: 36px`, so the full ring of B3-1 shows and a
  focused chip is scrolled clear of the fades. The bar's height is unchanged
  by this.

### 8.2 Desktop, pinned (B4-3, M2)

When the bar reaches the top of the scroll area it pins under the top bar and:

| Property | Unpinned                   | Pinned                                                                                                  |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| width    | inside the content padding | **edge to edge** of the content column                                                                  |
| border   | 1px all round              | **bottom only** 1px admin-line #e5e7eb                                                                  |
| radius   | 6                          | **0**                                                                                                   |
| padding  | 8px 10px 8px 14px          | **8px 26px** — chips align with SH1's 26px content edge (M2; V3a's 8px 40px followed V3a's 40px gutter) |
| shadow   | none                       | `shadow-admin-bar`                                                                                      |

The swap is instant and the height holds (49 from `md`), so content under the
bar never jumps. Content below the pinned bar (B4-4): a jumped-to section
header lands **16px** below the pinned bar's bottom edge. The card spans the
full content width (**964px** at 1280 with SH1's sidebar; two equal columns).

### 8.3 Phone (below `md`; B1-3…B1-10, B2-2…B2-7, U1–U3)

| #     | Element                                | Values                                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1    | unpinned (in flow)                     | one item in the gap-16 stack, after the Live preview row and before the first section; **358 wide** (inset 16 like the cards); bg #fff, **1px #e5e7eb border all round, radius 6, no shadow**; padding **7.5px 7px 7.5px 0**, so with its border it is **61 tall**, the same as pinned; chip track inset **8** from the bar's left edge                                                             |
| U2    | about to pin                           | rides up with the page in the in-flow look; still no active chip while the first section header is below it                                                                                                                                                                                                                                                                                         |
| U3    | pinned                                 | `position: sticky`, top = 67, SH1's drawn phone top bar (§ 5.3; not `top-admin-topbar`); full 390 width (−16px inline margin), **no side borders, no radius**, bottom border #e5e7eb, `shadow-admin-bar`; padding **8px 16px 8px 0**; track inset 16. The swap is instant and the height holds (61), so nothing jumps; scrolling back past its place unpins it and clears the active chip           |
| B1-3  | bar (pinned)                           | sticky; z 2; flex, centred, **gap 8**; bg #fff                                                                                                                                                                                                                                                                                                                                                      |
| —     | label                                  | "Jump to" **not shown**                                                                                                                                                                                                                                                                                                                                                                             |
| B1-4  | nav                                    | relative, flex 1, min-width 0, overflow hidden; `ul` gap 8, scrolls sideways (swipe), scrollbar hidden; `padding-block 4` / `margin-block −4` so the focus ring is not clipped (§ 8.1)                                                                                                                                                                                                              |
| B1-5  | chip                                   | **height 44**, padding 0 14, **13.5px**/600, otherwise as desktop (gap 8, border #878f9d, pill, count)                                                                                                                                                                                                                                                                                              |
| B1-6  | active chip                            | none until the first section header passes under the bar (D19, U1–U2); then scrolled into view automatically when it changes (B1: Empty states; B2: Confirmations). **Only the chip list's own `scrollLeft` changes** — never `element.scrollIntoView`, which would also scroll the page vertically and fight the scroll-spy. An unpinned bar never shows an active chip                            |
| B1-7  | left fade                              | `aria-hidden`, absolute left 0, top 0, bottom 0, width **28**, a gradient to the right from `admin-surface` to `admin-surface` at zero alpha (§ 8.1 Overflow; #ffffff → transparent in Light, #171a20 → transparent in Dark); shown only when chips are hidden on the left                                                                                                                          |
| B1-8  | right fade                             | absolute right 0, width **36**, the same gradient to the left (`admin-surface` to zero alpha); shown only when chips are hidden on the right                                                                                                                                                                                                                                                        |
| B1-9  | divider                                | `aria-hidden`, **1×28**, admin-line #e5e7eb, flex none                                                                                                                                                                                                                                                                                                                                              |
| B1-10 | icon button                            | 44×44, flex none, border 1px admin-control-line #878f9d, **radius 6**, bg #fff; unfold icon 18px stroke admin-text width 2 (`M7 15l5 5 5-5` + `M7 9l5-5 5 5`, `ICONS.UNFOLD`, #6404 / #6405). Name "Expand all sections" while any section is collapsed, "Collapse all sections" once all are open. **The glyph stays the unfold glyph in both states** (D26). `aria-controls` = every section body |
| B3-6  | its tooltip                            | the shared Tooltip (X1) with its current name, from the pointer and from keyboard focus; on touch none (P1). Base UI's collision handling keeps it in the window at the right edge (M4). V3a's right-aligned, 8px-below, no-arrow form is dropped                                                                                                                                                   |
| —     | Expand all / Collapse all text buttons | **not shown**                                                                                                                                                                                                                                                                                                                                                                                       |

Contrast on the phone bar (U-board): chip text #12141a on #fff, count #5b6472
on #fff 6.1:1, active #fff on #4f46e5 6.3:1. Pinning changes no focus order and
no accessible name.

U1 and U2 draw Error pages expanded into its cards at the top of the page:
that is the page after the reader opened Error pages. On first load every
section is collapsed with its summary list (D9, D20), and those rules win
over U1–U3's section content; the bar's own values (in flow, 61 tall, no
active chip until a header passes) are as drawn.

### 8.4 States

| State              | Board                  | Rule                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Some customised    | A, B4, B5              | chips with count > 0 show "N customised"; others show the name only (B2-5, B2-6)                                                                                                                                                                                                                                                                                                                         |
| Nothing customised | B7-1                   | no chip has a count                                                                                                                                                                                                                                                                                                                                                                                      |
| No active chip     | B7-1, B7-4, U1, U2, M1 | before the reader scrolls past the first section header, no chip is active and none carries `aria-current`. **This rule wins over boards A, B5 and `gap-voice-field-cards` F1**, which draw an active chip (or `aria-current`) at the top of the page (D19)                                                                                                                                              |
| Active             | B4-3                   | the scroll-spy rule below picks the active chip; it carries `aria-current="true"`; it never takes focus by itself                                                                                                                                                                                                                                                                                        |
| Error              | B6-2                   | a section with errors shows, **instead of** its count, a pill: inline-flex, centred, **gap 4**, 12px/600 admin-bad #b42318; inside the active chip it is a white pill (**height 20, padding 0 6, radius 999**, bg `admin-surface`: #fff Light, #171a20 Dark, where its text is admin-bad #fca5a0; § 5). Error-circle icon 12×12, stroke admin-bad, width **2.5**, in both forms. Text "1 error" (plural) |
| Focus              | B3-1                   | the gapped ring (§ 5.2)                                                                                                                                                                                                                                                                                                                                                                                  |

Error-circle glyph: circle r9 + `M12 7v6M12 16.5h.01`, registered as
`ICONS.ERROR` in the platform registry by #6405 (D16). It is a different glyph from the platform's existing
`ErrorCircle` (a circled **cross**, registered under `ICONS.CLOSE` for the
error notice): the board draws an exclamation mark, so `ErrorCircle` is not
reused and the two glyphs coexist.

**Scroll-spy (rules 4, 11; B4-3, B4-4, B1, B7-4).** The **activation line**
sits at the pinned bar's bottom edge + 16px + 4px tolerance, measured from
the top of the viewport (the drawn top-bar height 59 / 67 + bar height + 20). A jump lands a header's
top exactly 16px under the bar (B4-4), which is above the line, so the
jumped-to section is active straight away — matching B4 (Empty states active
with its header 16px under the bar) and B1 (header 14px under the bar, chip
active).

- Active = the **last** section whose header top is at or above the
  activation line.
- None active while the first section's header top is still below the line
  (top of the page, B7-4, U1, M1), and no chip has `aria-current`.
- **End of page:** when the page is scrolled to its end (within 2px), the
  last section whose header is inside the viewport becomes active, even if
  its header never reached the line (a short last section).
- A chip or summary-row activation sets its section active at once; the
  scroll-spy takes over again on the next user scroll.
- The scroll-spy never moves focus and never changes the URL.

### 8.5 From 768 to 1023 (M1, M2, M4; D11)

With the expanded 264px sidebar the area right of it is 504 wide at 768 and
556 at 820; inside SH1's 26px padding the content is 452 and 504.
"Jump to" plus both text buttons need about 260px, which leaves room for one
and a half chips, so this range keeps the desktop chips and takes the phone's
single icon button at desktop size:

| Element     | Values                                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unpinned    | the in-flow desktop card of § 8.1 (white, 1px #e5e7eb, radius 6, no shadow) under the page head; no active chip until the first section header passes (D19); every section loads collapsed with its summary rows (D9, D20)        |
| label       | "Jump to" **not shown**                                                                                                                                                                                                           |
| gap         | the bar's flex gap is **8** between the chip list, the divider and the icon button (M1, M2, M4 `.mbar`), not § 8.1's 12                                                                                                           |
| chips       | the desktop chip of § 8.1: **32 tall**, 13px/600, gap 8, border #878f9d; overflow per § 8.1 with a **28px** fade on each side that has more (M2)                                                                                  |
| divider     | `aria-hidden`, **1×24**, admin-line #e5e7eb                                                                                                                                                                                       |
| icon button | **32×32**, radius 4, 1px admin-control-line #878f9d, white, hover #fbfbfd; the unfold glyph; named "Expand all sections" / "Collapse all sections" as on the phone; it never scrolls — it stays at the right edge of the bar (M2) |
| tooltip     | the shared Tooltip (X1) with the button's current name; at the right edge Base UI's collision handling shifts it left to stay in the window (M4 "820 · keyboard focus and tooltip")                                               |
| pinned      | sticks at `top` 59, directly under the top bar (§ 5.3), edge to edge across the content column, no radius or side borders, `shadow-admin-bar`; padding **8px 26px** so the first chip lines up with the content                   |
| error chip  | the chip with an error swaps its count for the error pill (§ 8.4) and is the widest chip (190px at 820, M4); both of today's chips still fit                                                                                      |

From 1024 the column (708) fits "Jump to", two chips and both text buttons
(about 640px), so the bar is the § 8.1 bar (M4 "1024 · desktop form returns").
The form follows the window width, not the column (§ 3).

## 9. Sections (A39–A47, B1-12, B3-8, B5, B6-3, B7-2/3)

| #    | Element        | Values                                                                                                                                                                                                                   |
| ---- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A39  | stack          | column, **gap 28** between sections at every width from `md` (M1 draws 20 at 820; A's 28 applies); **16** below `md` (B1-11)                                                                                             |
| A40  | section        | `<section id="sec-…" aria-labelledby="<h2 id>">`, column. Header-to-body gap: collapsed **10**, expanded **12** at every width from `md` (M1 draws 8 at 820; A's values apply); **8** below `md` in both states (B1, B2) |
| A41  | header         | `<h2>` (margin 0) > `<button aria-expanded aria-controls="sec-…-body">`: flex, centred, gap 12, width 100%, **min-height 44**, padding **6px 8px 6px 4px**, no border, transparent, text-align left, admin-text          |
| A41  | chevron        | first: right (`M9 6l6 6-6 6`) when collapsed, down (`M6 9l6 6 6-6`) when expanded; 16×16 admin-muted width 2                                                                                                             |
| A41  | title block    | column: title "Error pages" / "Empty states", **16px/22px 600** admin-text; meta below                                                                                                                                   |
| A41  | meta           | **12.5px/18px** admin-muted: "5 fields · 1 customised"; "N fields · all default" when 0 (B7-2/3); "1 field · …" for one field; error: "6 fields · 1 field needs attention" in **admin-bad #b42318** (B6-3)               |
| A42  | collapsed body | the **summary list** (§ 10); `id="sec-…-body"` — **one id** that holds the summary while collapsed and the cards while expanded, so `aria-controls` always resolves (D14)                                                |
| A47  | expanded body  | the surface cards, column, **gap 24** from `md`; **16** below `md` (B1: Bookmarks 16 below Empty lists)                                                                                                                  |
| B3-8 | focus          | the gapped ring (§ 5.2) on the header button                                                                                                                                                                             |

A collapsed section **always** shows its summary list (rule 9). B7 draws its
two collapsed sections without one because the frame is a cropped excerpt
(D20).

Open state on first load: **every section collapsed**, except the section a
URL hash (`#sec-…` or a card id) points into, which opens and is scrolled to
as a chip jump would (D9).

**Ids (as drawn on board A; stable, because links and the first-load rule
depend on them).** They live in one `Record` map per key type in
`apps/platform/src/constants/voice.ts`, keyed by `VOICE_SECTION` /
`VOICE_SURFACE`, never spelled at a call site:

| Element              | Id                                                           |
| -------------------- | ------------------------------------------------------------ |
| Error pages section  | `sec-errors`; heading `sec-errors-t`; body `sec-errors-body` |
| Empty states section | `sec-empty`; heading `sec-empty-t`; body `sec-empty-body`    |
| Page not found card  | `s-notfound`; heading `s-notfound-t`                         |
| Error page card      | `s-error`; heading `s-error-t`                               |
| Empty lists card     | `s-lists`; heading `s-lists-t`                               |
| Bookmarks card       | `s-bookmarks`; heading `s-bookmarks-t`                       |

A section added later takes `sec-<slug>` and its cards `s-<slug>`, added to
the same maps.

**State across Save and a language switch (D38).** `VoiceSettings` re-keys
the card list on `${selectedLocale}-${revision}`, which remounts it after
every save and every locale switch. Section open / closed state therefore
lives **above** that key (in `use-voice-draft` beside `openListFieldId`):
which sections are open, and the open list row, survive Save and a language
switch exactly as they were. The "Show preview" state lives in the card and
resets to closed on both (today's behaviour). First load is the only time
the D9 rule applies. Board A shows
the page after the reader opened Empty states.

## 10. Collapsed summary list (A42–A44, B2-9…B2-15, B5)

### 10.1 Desktop (from `md`)

| #   | Element     | Values (board A wins over B5, D1)                                                                                                                                                                                                                                                                       |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A42 | list        | bg #fff, border 1px admin-line #e5e7eb, radius 6, **no shadow**                                                                                                                                                                                                                                         |
| A43 | row         | `<a href="#<card id>">`: flex, centred, gap 12, **min-height 48**, padding **10px 18px** at every width from `md` (M1 draws 10px 16px at 820; A's 18 applies), `text-decoration: none`, colour admin-text #12141a; the first row has no top border, every later row border-top 1px admin-line-2 #eef0f3 |
| A43 | name        | **width 180px** (**150px** from 768 to 1023, M1), flex none, 13.5px/600                                                                                                                                                                                                                                 |
| A43 | description | flex 1, min-width 0, 12.5px admin-muted, one line, ellipsis                                                                                                                                                                                                                                             |
| A43 | count       | 12px admin-muted, **margin-right 6**, nowrap: "3 fields" / "2 fields" / "5 lists" / "1 field"                                                                                                                                                                                                           |
| A43 | pill        | Customised / Default (§ 11.3)                                                                                                                                                                                                                                                                           |
| A43 | chevron     | right, 16px admin-muted, flex none                                                                                                                                                                                                                                                                      |
| —   | focus       | the gapped ring (§ 5.2)                                                                                                                                                                                                                                                                                 |

Activating a row (click, tap or Enter) opens the section, scrolls the card's
header to 16px under the bar, moves focus to the card heading and replaces the
URL hash with the card id (same as the chips, § 8.1). The card `<h3>` carries
`tabindex="-1"` so it can take focus; it shows no focus ring (it is a
heading, not a control).

Rows on today's data: Error pages → Page not found ("Shown at any address that
doesn't exist", 3 fields, Customised), Error page ("Shown when a page fails to
load", 2 fields, Default). Empty states → Empty lists ("Shown when a list has
nothing in it yet. Pick one to edit it." — the card's existing description,
D2; 5 lists), Bookmarks ("A reader's saved posts, before they save any",
1 field).

### 10.2 Phone (B2-9)

Row padding **10px 16px**, min-height 48, gap 12; name flex 1, min-width 0,
13.5px/600; then pill and chevron. **No description and no count.** Same top
borders, no underline, admin-text.

## 11. Surface cards (A48–A82)

### 11.1 Card frame

The card chrome is layout B's, owned by #6355 (X15) and global; Voice adds
only its ids, summary and body. F1–F3 draw it. The card `<section id>`, its
`aria-labelledby` and the h3's `tabindex="-1"` are #6417's, which
first links to them from the summary rows.

| #   | Element     | Values                                                                                                                                                                                                                                   |
| --- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A48 | card        | `<section id="s-…" aria-labelledby="<h3 id>">`: bg #fff, border 1px admin-line #e5e7eb, radius 6, `shadow-admin` (LB's two-layer small shadow). Ids are the summary-row anchors                                                          |
| A49 | header      | flex, wrap, centred, **gap 10**, **min-height 50**, padding **12px 18px**, bg admin-surface-head **#eef1f6**, border-bottom 1px admin-line **#e5e7eb**, top radius 6 (X15; V3a's white 14px 18px header with an #eef0f3 rule is dropped) |
| A49 | title       | `<h3>`, **14px/20px 600** admin-text (X15, every admin card)                                                                                                                                                                             |
| A49 | description | display block, margin-top 2, 12.5px/18px admin-muted                                                                                                                                                                                     |
| A49 | summary     | "5 lists · 2 customised", **12px/16px 400** admin-muted, margin-left auto; below `md`: margin-left 0, wraps under the title block (B1-13, F2)                                                                                            |
| A50 | body        | two equal columns `repeat(2, minmax(0,1fr))` from `lg`; one column below `lg`                                                                                                                                                            |
| A51 | left cell   | padding **18**, min-width 0 (from `md`)                                                                                                                                                                                                  |

### 11.2 List rows (Empty lists, A51–A64), from `md`

| #       | Element            | Values                                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A51     | list               | `ul` margin 0, padding 0, **border-bottom 1px admin-line-2**; every `li` border-top 1px admin-line-2                                                                                                                                                                                                                                                                                               |
| A51     | row                | `<h4>` (margin 0) > `<button aria-expanded>`: flex, **centred**, gap 12, width 100%, min-height 44, padding **12px 10px**, no border, radius 4, transparent, text-align left                                                                                                                                                                                                                       |
| A51     | label column       | width **130**, flex none, column, **gap 2**: name 13.5px/600 admin-text; route **JetBrains Mono 12px** admin-muted ("Shown at /blog")                                                                                                                                                                                                                                                              |
| A51     | value preview      | flex 1, min-width 0, 13.5px admin-muted, one line, ellipsis; `{name}` shown as raw text (no code chip). **Stays visible when the row is open** (A53)                                                                                                                                                                                                                                               |
| A51     | status             | inline-flex, centred, **gap 8**: unsaved dot (#6387's shared dot, `role="img" aria-label="Unsaved"`) when the row's draft differs from its saved value, then the pill                                                                                                                                                                                                                              |
| A51     | chevron            | right when closed, **down** when open, 16px admin-muted, flex none                                                                                                                                                                                                                                                                                                                                 |
| A53     | open row           | button bg **admin-surface-2 #fbfbfd**; panel bg admin-surface-2                                                                                                                                                                                                                                                                                                                                    |
| —       | one open row       | opening a row closes the other open row in the same card (A shows exactly one open; D29)                                                                                                                                                                                                                                                                                                           |
| A54     | panel              | padding **4px 10px 16px**, column, **gap 8**                                                                                                                                                                                                                                                                                                                                                       |
| A55     | panel head         | flex, centred, gap 8: hint (12px/16px admin-muted, flex 1) "A topic with no posts yet"; **Reset** (XS secondary Button, 28px; 44px below `md`) whenever the value differs from the default, saved or not, and the tenant is not archived (the F1 anatomy, § 11.8); a Default field's panel head is the hint alone. **No pill and no unsaved dot repeated in the panel** (both stay on the trigger) |
| A56–A60 | editor             | § 11.5                                                                                                                                                                                                                                                                                                                                                                                             |
| A61     | "Keep {name}" note | "Keep `{name}` — the site fills it in.", 12px/16px admin-muted, `{name}` JetBrains Mono **12px**, no background. Replaced by the error text while the field is invalid (§ 11.5, D27)                                                                                                                                                                                                               |

Rows (today's data): Blog index page / Shown at /blog / "Fresh notes are on
the way." / Customised; Topic page / Shown at /topics/… / "Nothing filed
under {name} yet — check back soon." / unsaved dot + Customised (open);
Tag page / Shown at /tags/… / "No posts tagged {name} yet." / Default;
Topics index page / Shown at /topics / "No topics yet." / Default;
Tags index page / Shown at /tags / "No tags yet." / Default.

**A closed row with an error (D39; drawn in E2).** Only one row is open per card,
so a second invalid row stays closed. It keeps today's collapsed-row note:
directly under its trigger, inside the same `li`, the error text 11.5px/16px
admin-bad, padding **0 10px 10px** from `md` (**0 4px 8px** below `md`),
linked to the trigger with `aria-describedby`. The note disappears when the
row opens (the field shows the error itself) and when the field is fixed.

**First open row (D40).** Today the first row (Blog index page) is open when
the page loads. Since every section starts collapsed (D9), the open row is
seen only once Empty states is opened; it stays the first row, as today.

### 11.3 Status pills

Pills are layout B's (X12), owned by #6356 and global. V3a's 22px badge at
12px/500 is dropped, as is the 22px pill F1 still copies.

| Pill       | Values                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| all        | inline-flex, centred, **height 20** (padding 2px 10px), radius 999, **11.5px/16px weight 600**, nowrap      |
| Default    | neutral tone: admin-muted #5b6472 on #eef0f3                                                                |
| Customised | `plan` tone: **admin-brand-strong #3730a3** on admin-brand-weak #eef2ff (#6409 maps `customised` to `plan`) |

The only Voice change to pills is the Customised tone (D31; the size change is
#6356's, every pill in the admin).

### 11.4 Phone list rows (below `md`, B1-14…B1-20)

| #     | Element           | Values                                                                                                                                                                                                                                                                                                                                    |
| ----- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1-14 | body              | padding **4px 14px 10px**, single column, no preview pane                                                                                                                                                                                                                                                                                 |
| B1-14 | list              | `ul` margin 0, padding 0, **no bottom border**                                                                                                                                                                                                                                                                                            |
| B1-14 | row               | `h4 > button` (D13), flex, centred, **gap 10, min-height 52, padding 8px 4px**, **no radius**, transparent; name flex 1 13.5px/600, then status (dot when unsaved, D22, then pill, gap 8), chevron. **No route, no value preview.** First row no top border; others border-top 1px admin-line-2                                           |
| B1-14 | open row          | same panel as § 11.2 (hint + Reset, editor, "Keep {name}" note), bg admin-surface-2                                                                                                                                                                                                                                                       |
| B1-20 | Show preview      | below the list: margin-top 6, width 100%, min-height 44, border 1px admin-control-line #878f9d, radius 4, bg #fff, 13.5px/600 admin-text. `aria-expanded` + `aria-controls` = the preview's id. Only on the **Empty lists** card, below `lg` (from `md` to below `lg` too, § 3); field cards never show it (D34). Pressed state: § 11.4.1 |
| B1-21 | Bookmarks (phone) | header with summary wrapped under; body padding **14**; the phone field anatomy of § 11.8 (label row, hint row, editor **with toolbar**, D3); **no preview pane and no Show preview button**                                                                                                                                              |

#### 11.4.1 Show preview, pressed (S1; D33)

Pressing "Show preview" flips its label to "Hide preview"
(`voiceSpecimen.hidePreview`), sets `aria-expanded="true"` and **keeps focus**
(S1 draws the ring on it). The preview opens **10px below the button**, full
width of the card body: a `role="group"` labelled by its preview label,
padding 14, bg admin-bg #f6f7f9, border 1px admin-line-2 #eef0f3, radius 6,
column, gap 10. Inside, in order:

- the preview label (mono 11px/15px, uppercase, .06em, 500, admin-muted):
  "Preview · <open row's label>", or the **first row's** label when no row is
  open — S1 shows "Preview · Blog index page" with every row closed;
- the specimen (the tenant's real site, min-height 260): S1 shows the Blog
  index page — "Blog", "All posts", "0 posts", "Fresh notes are on the way.";
- the note (12px/16px admin-muted), "The heading comes from Studio; only the
  message is yours here."

Pressing again hides it and restores "Show preview". The state resets to
hidden after a save or a language switch (§ 9, D38). The phone footer stays
pinned to the viewport bottom while the preview is open. No new strings.

### 11.5 Editor (A56–A60, A76–A80, B6-6)

| Part             | Values                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shell            | border 1px admin-control-line #878f9d, radius 4, bg #fff                                                                                                                                                                                                      |
| toolbar          | `role="toolbar" aria-label="Formatting"`; flex, **gap 2**, **padding 4**, border-bottom 1px admin-line-2, **bg #fff**                                                                                                                                         |
| toolbar buttons  | **28×28** (**44×44, 15px below `md`**, F2; D47), no border, radius 4, transparent, admin-text, **13px**: Bold "B" weight **700**; Italic "I" **italic, Georgia serif**; Link icon **14px, stroke 2**, admin-text; their tooltips are the shared one (#6370)   |
| body             | `role="textbox" aria-multiline="true"`; padding **8px 10px**, **min-height 56**, 13.5px/20px admin-text from `md`; **16px/24px, min-height 72 below `md`** (D12, F2)                                                                                          |
| `{name}` in body | JetBrains Mono 12.5px, padding 1px 4px, bg admin-line-2 #eef0f3, radius 3                                                                                                                                                                                     |
| invalid          | border **admin-bad-line #dd6152**; error text below, 11.5px/16px admin-bad: "Keep the placeholder {name} — the site fills it in." It **replaces** the "Keep {name}" note below the control (A61; B6, D27); the hint row (hint and Reset) and the toolbar stay |

Editor accessibility and focus:

- The textbox carries `aria-invalid="true"` while the field is invalid, and
  `aria-describedby` = the hint id, then the error id while invalid or the
  "Keep {name}" note id while valid (never both: the error replaces the
  note).
- The error is not a live region: on a failed save focus moves into the
  field (§ 13), so the screen reader reads the description once.
- Focus: the shell shows the gapped ring (§ 5.2) while the body has
  keyboard focus (`:focus-within` on the shell, keyboard only; F1 draws it on
  Supporting text); the invalid border stays #dd6152 under the ring. The
  toolbar buttons use the same ring on their own focus. The text input
  (§ 11.8) matches.
- Archived tenant: today's read-only control, no toolbar (§ 6.2, NA).

### 11.6 Preview pane (A65–A70, A81–A82), from `lg`

| #   | Element  | Values                                                                                                                                                                                                                                     |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A65 | pane     | padding **18**, bg admin-bg #f6f7f9, border-left 1px admin-line-2 #eef0f3, radius 0 0 6px 0, column, **gap 10**                                                                                                                            |
| A66 | label    | JetBrains Mono 11px, **letter-spacing .06em**, uppercase, admin-muted, weight 500 (not bold): "Preview · Topic page" (Empty lists: "Preview · <open row's label>"; with no row open, the first row, D29) or "Preview" (single-field cards) |
| A67 | specimen | the tenant's real site (`VoiceSpecimen`); body min-height **260** (Empty lists) / **150** (Bookmarks) / 300 and 240 as F1 draws Page not found and Error page; `{name}` substituted with a sample ("Design" on A69)                        |
| A70 | note     | 12px/16px admin-muted: "The heading comes from Studio; only the message is yours here." / A82 "The page title and panel heading are fixed." (existing `voiceSurfaceNotes`)                                                                 |

### 11.7 Bookmarks card (A71–A82)

Header (A71, A72): h3 "Bookmarks" 14px/20px 600, description "A reader's
saved posts, before they save any" 12.5px/18px admin-muted, summary
"1 field · all default" 12px/16px admin-muted at the right, on the § 11.1
chrome. Body: one field in the field anatomy of § 11.8 — label "Empty
bookmarks", hint "The bookmarks page, before anything is saved", the compact
editor with toolbar and body "No bookmarks yet — save a post to find it here."
(A76–A80). Right, from `lg`: preview pane per § 11.6 with the bare label
"PREVIEW", specimen min-height 150 (A81), note "The page title and panel
heading are fixed." (A82). Below `lg` no preview and no Show preview (D34).

A74 draws the Default state; the Reset position on Bookmarks was never drawn
on V3a and follows the field anatomy F1 draws (§ 11.8): **Reset sits on the
hint row**, not the label row.

**Phone Bookmarks toolbar (D3; decided 31 Oct).** B1-21 draws the phone Bookmarks editor without a toolbar, which
would remove bold, italic and link there. F2 and F3 keep the toolbar on the
phone field cards. Decided 31 Oct: keep the toolbar on every rich field at every width.

### 11.8 Field cards: Page not found and Error page (F1–F3; D32)

Drawn on `gap-voice-field-cards` at 1440 (F1) and 390 (F2, F3). Same tenant
state in every frame: Page not found has a saved custom Heading and an unsaved
edit to Supporting text; Error page is all default.

| Element             | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| card                | as § 11.1; summary "3 fields · 2 customised" (F1 prints "1 customised"; § 4, D46) / "2 fields · all default"                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| body                | from `lg` two equal columns: fields cell + preview pane (§ 11.6); below `lg` one column with **no preview and no Show preview** (D34)                                                                                                                                                                                                                                                                                                                                                                                                         |
| fields cell         | padding **18** from `md`, **14** below `md`; column, **gap 20** between fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| one field           | column, **gap 8**: label row, hint row, control                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| label row           | flex, centred, gap 8, min-height 20: label (13px/18px 600 admin-text, flex 1; **14px/20px below `md`**), then the unsaved dot (#6387's shared dot, `role="img" aria-label="Unsaved"`) while the draft differs from the saved value, then the pill (Default / Customised, § 11.3). An unsaved edit to a default field already reads Customised                                                                                                                                                                                                 |
| hint row            | flex, centred, gap 8, **min-height 28** (**44 below `md`**): the hint (12px/16px admin-muted, flex 1), then **Reset** at the end whenever the value differs from the default, saved or not, and the tenant is not archived. Reset restores the default into the draft; it does not save. XS secondary (28 tall) from `md`; **44 tall, min-width 64, padding 0 14, 13.5px** below `md` (D47)                                                                                                                                                   |
| default value       | a field at its default shows the default copy **as the control's value**, not as a placeholder (F1 Eyebrow "404", F3 Heading "Something went wrong"); TEXT and RICH alike                                                                                                                                                                                                                                                                                                                                                                     |
| text control (TEXT) | one-line input: height **36** from `md`, **44** below `md`; padding 0 10; border 1px admin-control-line #878f9d; radius 4; bg #fff; 13.5px/20px admin-text from `md`, **16px/24px** below `md`; invalid border admin-bad-line #dd6152; focus ring § 5.2                                                                                                                                                                                                                                                                                       |
| rich control (RICH) | the compact editor (§ 11.5) with Bold, Italic and Link on every width                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| below the control   | the "Keep {name}" note or the error text (§ 11.5) where the field has a placeholder                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| preview label       | bare "PREVIEW" (one surface per card, as on Bookmarks)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| specimen            | the tenant's real site; body min-height **300** (Page not found) and **240** (Error page), as F1 draws them. "The slot being edited" is the slot of the field whose control has focus (today's `focusedFieldId`, set on focus and cleared on blur): that slot alone is outlined with the specimen's dashed key frame (`VoiceKeyFrame`: 1px dashed #d9d1c2, radius 6, margin −6px −8px, padding 6px 8px). A card none of whose fields has focus shows no outline (F1 Error page); an unsaved or customised field without focus is not outlined |
| note                | the existing `voiceSurfaceNotes.NOT_FOUND` / `.ERROR`, 12px/16px admin-muted, under the specimen from `lg`; **below `lg` it closes the card under the last field** (F3)                                                                                                                                                                                                                                                                                                                                                                       |

Fields today, in order: Page not found → Eyebrow `notFoundEyebrow` (TEXT,
hint "Small label above the heading"), Heading `notFoundHeading` (TEXT, "Also
the browser tab title"), Supporting text `notFoundSupportingText` (RICH,
"Below the heading"); Error page → Heading `localeErrorTitle` (TEXT, "The
page's main heading"), Description `localeErrorDescription` (RICH, "Below the
heading"). Labels and hints are the existing `voiceFieldLabels.*` /
`voiceFieldHints.*`; the specimen copy is the site catalog's own (`notFound`,
`localeErrorPage`). No new strings.

F1 and F2 print the pre-edit counts; the counts of their state are § 4's
(D46): Page not found "3 fields · 2 customised", Error pages meta "5 fields ·
2 customised", chip "Error pages 2 customised", English "Default language · 4
customised".

F1's own CSS still draws 22px pills and an 8px amber dot: the rule's 20px pill
(X12) and #6387's dot apply.

## 12. Save bar

One shared bar (X16), built from V3a and LX, TH1 colours only. Its base is the
V3a docked bar below (#6413, the owner); #6388 then adds the
opt-in "in {card}" location and LX's edge-to-edge phone layout with Discard
for every other settings page; #6414 adds the Voice phone footer, which
has **no Discard** (B1-22, D4). Ship order: #6413 → #6388 →
#6414, then #6424 and #6422. Voice passes no location: its
bar never says "in {card}". The docked bar applies on every settings page from
`md` (D30).

**Save-bar breakpoint (D49; decided 31 Oct).** #6388's body (Look set) gives
the LX phone layout "below `lg`" on every settings page but Voice, which takes
768–1023 from the docked bar on Look, Email, Languages and Features, while this
spec (D11, D30) docks the bar from `md` on every settings page. Decided 31 Oct: the docked bar, in its
768–1023 form (§ 12.4), from `md` on every settings page; #6388's phone
layout below `md` on every page but Voice. `gap-voice-820` M1–M3 draw the
docked bar at 768–1023, and the LX phone frames are drawn at 390. #6388's
body says "below `md`".

### 12.1 Desktop docked, unsaved (≥ 1024; A83–A85, B4-7)

| Part         | Values                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bar          | `role="region" aria-label="Unsaved changes"`; fixed to the viewport bottom, **left edge = sidebar edge**, right 0, **height 64**; flex, centred, gap 12, padding **0 26px** (SH1's content edge; V3a drew 0 40 against its 40px gutter); bg #fff; border-top 1px admin-line #e5e7eb; `shadow-admin-dock`; no radius                                             |
| dot          | 8×8 admin-warn #8a5f00, `aria-hidden` (the bar's own dot; the row dot is #6387's)                                                                                                                                                                                                                                                                               |
| text         | "1 unsaved change", **13.5px/600** admin-text                                                                                                                                                                                                                                                                                                                   |
| shortcut     | "⌘S / Ctrl+S", 12px admin-muted, margin-left auto, **plain text** (no kbd box)                                                                                                                                                                                                                                                                                  |
| Discard      | height 36, padding 0 14, border 1px admin-control-line #878f9d, radius 4, bg #fff, 13.5px/600                                                                                                                                                                                                                                                                   |
| Save changes | height 36, padding 0 14, no border, radius 4, bg admin-brand #4f46e5, label the fixed white #fff (§ 5), 13.5px/600                                                                                                                                                                                                                                              |
| clean        | the bar **unmounts** when there are no unsaved changes (today's behaviour, D23). M1/M3 draw a docked "All changes saved" bar at 768–1023 — see § 12.4 (decided: unmount when clean from `md`)                                                                                                                                                                   |
| room         | the page keeps 120px bottom padding (§ 6 A19; owned by #6413) so the last content stays visible above the bar; also from 768 to 1023, where M1 draws 96 (§ 6 A19)                                                                                                                                                                                               |
| head status  | Voice shows **no** "All changes saved" status in the page head after a save (today `SettingsFormShell` renders one in `PageHeader`'s actions when `isSavedStatusShown`). No Voice board draws it, and the actions slot holds the language radiogroup; the phone footer is Voice's saved signal below `md` (D45, confirmed 31 Oct). Other settings pages keep it |

### 12.2 Error (B6-8)

Shape as drawn: flex, centred, **gap 10**, padding **10px 14px**, bg #fff,
border 1px admin-line, **radius 6**. Order: "1 field needs attention"
(13px/600 admin-bad), link "Go to the first one" (13px admin-brand, **hover
admin-brand-strong**), then margin-left auto "Not saved" (12.5px admin-muted).
**No warning icon** (today's bar shows one; the board draws none).

In the docked bar (D15): the error content replaces the dot, count and
shortcut on the left of the bar — **the dot, "1 unsaved change" and
"⌘S / Ctrl+S" are not rendered while the error shows**; Discard and Save stay
at the right; the bar keeps its own frame (64 tall, top border, dock shadow),
so the strip's own border and radius are not drawn there. Order in the bar:
"1 field needs attention", "Go to the first one", "Not saved" (margin-left
auto), Discard, Save changes.

"Go to the first one" is a link-styled button: 13px/16px admin-brand #4f46e5,
**underlined**, hover admin-brand-strong #3730a3, focus ring § 5.2. It runs
§ 13 steps 1–3.

**Saving (D41; drawn for the phone in E3, the same rule from `md`).** While a
save is in flight Save changes reads "Saving…" (`saveBar.saving`) at its
resting width, through the shared Button's pending behaviour: `aria-disabled`
and `aria-busy`, **never native `disabled`**, so the pressed button keeps
keyboard focus and presses are ignored; "Saving…" is announced once through the Button's visually
hidden `role="status"` (`aria-live="polite"`). Discard is disabled. The bar
carries `aria-busy="true"` and keeps its frame and other contents; the page
content is `inert`, with no dimming (today's behaviour). The inert element
wraps the page content only: the bar and the phone footer render **outside**
it (today `VoiceSettings` makes its own content `inert` and `SettingsFormShell`
renders the bar after it), never inside an inert `main`, which would take
focus off Save (E3: "The footer sits outside main, so focus stays on Save").

### 12.3 Phone footer (below `md`; B1-22, B2-16, E1–E5)

Voice's footer (#6414), not LX's edge-to-edge layout.

| State     | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| container | fixed bottom, left 0, right 0, padding **10px 16px**, bg #fff, border-top 1px admin-line, flex, centred, gap 10, **no shadow**; **65 tall** in one row                                                                                                                                                                                                                                                                                                                                                                                                                 |
| unsaved   | dot; "1 unsaved change" **13px/600**; Save changes margin-left auto, **min-height 44, min-width 116**, padding 0 14, radius 4, bg admin-brand, the fixed white label (§ 5), 13.5px/600. **No Discard, no shortcut** (D4)                                                                                                                                                                                                                                                                                                                                               |
| saved     | no dot; "All changes saved" 13px/600 admin-text; Save `disabled`, bg **admin-brand-line #c7d2fe**, text **admin-brand-strong #3730a3** (7.3:1). The footer **stays visible** on phone when clean — except for an archived tenant, where no footer renders (§ 6.2)                                                                                                                                                                                                                                                                                                      |
| error     | **two rows** (E1, E2; D24), `flex-wrap: wrap`, row-gap 2, **85 tall**. Row 1, full width: "1 field needs attention" / "2 fields need attention", **13px/18px 600 admin-bad #b42318** (6.4:1); no dot, no count, no icon, **no "Not saved"**. Row 2: "Go to the first one" (13px/16px admin-brand, underlined, **min-height 44**, hover #3730a3, focus ring § 5.2), then Save changes at the right, enabled, min 116×44. One row would need about 441px (16 + 155 + 10 + 118 + 10 + 116 + 16), which overflows 390 and 320. The board asks for a yes before #6414 (D24) |
| saving    | E3, E5: dot and "1 unsaved change" stay; the button reads "Saving…" at its 116px width with the saved-state colours #c7d2fe / #3730a3, `aria-disabled` + `aria-busy` (not `disabled`), keeps focus, announced once through the Button's `role="status"`; the footer carries `aria-busy="true"` and sits outside the inert page content (§ 12.2), so Save keeps focus; one row, 65 tall; page content inert, no dimming                                                                                                                                                 |
| content   | page bottom padding **96** while the footer is present (B1-11, P1); it clears the 85px error footer too (D21)                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| landmark  | `role="region"` named by its own visible status text through `aria-labelledby` ("1 unsaved change", "All changes saved" or "1 field needs attention"), so the name never contradicts what it shows; no new string (D42)                                                                                                                                                                                                                                                                                                                                                |

After a successful save the footer shows "All changes saved"; after a failure
it shows the error footer, or — with no field errors — keeps its unsaved state
under the server-error Alert (§ 6.2, NB).

### 12.4 From 768 to 1023 (M1–M3; D11)

The docked bar of § 12.1 with three changes:

| Item     | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shortcut | the "⌘S / Ctrl+S" hint is **hidden**; the shortcut still works. Long counts still fit ("12 unsaved changes" ≈ 135px)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| error    | the left content **stacks on two lines** (M3 "820 · save error", "768 · worst case, plural error"): a column. Line 1, "1 field needs attention", in the docked bar's status style **13.5px/20px 600** admin-bad #b42318. Line 2, a row, **gap 6**, **13px/18px**, nowrap: the "Go to the first one" link (admin-brand, underlined, hover admin-brand-strong, focus ring § 5.2), then a **"·" separator** in admin-muted #5b6472 that is a decorative `aria-hidden` glyph, not part of any string, then "Not saved" in admin-muted #5b6472. These sizes replace § 12.2's one-line ones (13px/16px count, 12.5px "Not saved") in this range only. Discard and Save stay at the right. At 768 the stacked block is ≈ 200px and the buttons 208px, so the plural fits (M3) |
| saving   | Save reads "Saving…" and Discard is disabled, as § 12.2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

From 1024 the hint returns and the error content goes back to one line (M3
"1024 · back to the desktop bar").

**Clean bar (decided 31 Oct).** M1 and M3 draw a docked "All changes saved" bar with
Discard and Save disabled at 768–1023, so "the page height never jumps"; D23
(confirm-only) unmounts the desktop bar when clean, and no board draws a clean
bar at 1024 or more. Decided 31 Oct: unmount when clean at every width from `md` (D23); a docked clean bar, if wanted, applies
from `md` at every width, never only between 768 and 1023.

## 13. Save error flow (B6, rule 10)

On Save with an invalid field:

1. The section containing the first invalid field opens (if collapsed).
2. Its list row opens (if a list row).
3. Focus moves to the field.
4. The field shows the invalid border and error text, which replaces the
   "Keep {name}" note below the control; the hint row stays (§ 11.5).
5. The section meta turns red: "6 fields · 1 field needs attention".
6. That section's chip swaps its count for the error pill "1 error", even when
   it is not the active chip and even when it is scrolled off on phone.
7. The save area shows the error content (§ 12.2 / § 12.3); "Go to the first
   one" repeats steps 1–3.
8. Fixing the field restores the meta, the chip count and the hint.

**Several invalid fields.** "First" is the first invalid field in page order
(`voiceErrorsInOrder`: section order, then card order, then field order).
Save and "Go to the first one" open **that** field's section and row only;
every other invalid list row stays closed and shows its collapsed-row error
note (§ 11.2, D39); every other invalid non-list field shows its error in
place. Each affected section's chip and meta show their own error counts
("2 errors", "6 fields · 2 fields need attention").

## 14. Behaviour rules (verbatim from the boards)

1. "The bar pins under the app header. Chips scroll sideways; the active one is scrolled into view, and the fades show there is more. One icon button expands or collapses everything."
2. "Four chips overflow the width. The bar scrolled itself so Confirmations sits in view; swipe the bar to reach the rest."
3. "Tab reaches the chips first, then Expand all and Collapse all, then the sections. Enter on a chip opens that section if it is collapsed, scrolls its header to just below the bar and moves focus to the header."
4. "The active chip follows scrolling and carries aria-current. It never takes focus by itself."
5. "Phone: the icon button's name is "Expand all sections" while anything is collapsed and "Collapse all sections" once everything is open. The tooltip shows on hover and on focus."
6. "Section headers are unchanged from V3: one button with aria-expanded. Focus ring is 2px admin-brand with a 2px offset."
7. "Live preview switch: two icon buttons with aria-pressed, named Light and Dark. … its tooltip shows on hover and on focus. On phone each button grows to 44px."
8. "Cards use the full content width now that the index column is gone. Once the bar reaches the top it pins under the header, runs edge to edge and gains a shadow."
9. "Collapse all leaves each section as its summary rows, so the whole page fits one screen."
10. "Saving opens the section and the row, then focuses the field. The chip swaps its count for "1 error" with an icon, so the problem is visible even when that chip is scrolled off on a phone."
11. "Chips carry names only." / "Before anything is customised no chip shows a count and none is marked active until the reader scrolls past the first section header."

Implementation notes that follow from them:

- Scroll target: the shell sets `scroll-padding-top` =
  `--spacing-admin-topbar` (**68**, X4) on `<html>`
  (`[html:has(&)]:scroll-pt-admin-topbar` in `shell-frame-variants.ts`), and
  scroll-padding and scroll-margin add up. The drawn top bar is 59 from `md`
  and 67 below (§ 5.3), so for a header to land 16px below the pinned bar
  (B4-4) each section and card has `scroll-margin-top` = top-bar height + bar
  height + 16 − 68: **bar height + 7** from `md`, **bar height + 15** below
  `md`. The bar's rendered height is read once mounted and on resize (a
  `ResizeObserver` writing a CSS variable on the section stack), because it
  differs by width: desktop pinned 8 + 32 + 8 + 1 = **49** (margin 56, also
  768–1023, M2), phone 8 + 44 + 8 + 1 = **61** (margin 76; the in-flow phone
  bar is 61 too, U1).
- Expand all opens every section; Collapse all closes every section and leaves
  open list rows as they are (D17).
- Collapsing a section with unsaved edits keeps the draft (the save bar still
  counts it).
- `prefers-reduced-motion: reduce`: every jump scrolls instantly — chips, summary
  rows, "Go to the first one", Save's reveal and the first-load hash (§ 5.3).

## 15. Accessibility

| Item            | Rule                                                                                                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmarks       | bar `role="region" aria-label="Sections"`; chips inside `<nav aria-label="Voice sections">`; save bar `role="region" aria-label="Unsaved changes"`; the shell's own landmarks are SH1's (X11)                                                       |
| Headings        | h1 Voice → h2 section header (button inside) → h3 card title → h4 list row (button inside), on desktop and phone                                                                                                                                    |
| Disclosure      | section header button `aria-expanded` + `aria-controls` = its one body id, present in both states                                                                                                                                                   |
| Chips           | links; active one `aria-current="true"`; never auto-focused; an unpinned bar never has an active chip                                                                                                                                               |
| Expand/Collapse | `aria-controls` lists every section body id; the icon button below 1024 is named by its state ("Expand all sections" / "Collapse all sections")                                                                                                     |
| Light/Dark      | `role="group" aria-label="Preview colour scheme"`, buttons `aria-pressed`, names Light / Dark                                                                                                                                                       |
| Language        | `role="radiogroup" aria-label="Language"`, `role="radio" aria-checked`, arrow keys, one tab stop                                                                                                                                                    |
| Tooltips        | the shared Tooltip (X1): after Base UI's hover delay from the pointer, at once on keyboard focus; hide on leave, blur and Escape; `aria-hidden`, the trigger's `aria-label` is the name, so it is not announced twice; not focusable; none on touch |
| Unsaved dot     | `role="img" aria-label="Unsaved"` in rows and field label rows; `aria-hidden` in the save bar beside the text                                                                                                                                       |
| Invalid field   | `aria-invalid="true"`; `aria-describedby` = hint + error (the error replaces the "Keep {name}" note); a closed list row with an error points its trigger's `aria-describedby` at the collapsed-row note (§ 11.2)                                    |
| Read-only       | archived tenant: each read-only editor and input points at the notice with `aria-describedby` (§ 6.2)                                                                                                                                               |
| Show preview    | `aria-expanded` + `aria-controls` = the preview group, which is `role="group"` labelled by its preview label; the button keeps focus when pressed                                                                                                   |
| Save pending    | Save uses `aria-disabled` + `aria-busy`, never `disabled`, so it keeps focus; "Saving…" announced once through the Button's `role="status"`; the bar or footer carries `aria-busy`                                                                  |
| Phone footer    | `role="region"` named by its visible status text (§ 12.3)                                                                                                                                                                                           |
| Server error    | the Alert is `role="alert"`; archived and draft notices are `role="status"` (§ 6.2)                                                                                                                                                                 |
| Focus ring      | the gapped ring (§ 5.2, #6337) on chips, buttons, headers, icon buttons, summary rows, radios, list rows, the editor shell, text inputs and links; card `<h3>` takes programmatic focus (`tabindex="-1"`) with no ring                              |
| Targets         | 44px minimum below `md` (chips 44, icon button 44, Light/Dark 44, language options 44, rows 52, summary rows 48, Save 44, Show preview 44, Reset 44, editor toolbar buttons 44, text inputs 44, "Go to the first one" 44)                           |
| Tab order (A)   | language radios → Light, Dark → chips → Expand all → Collapse all → section header → summary rows → next header → list rows (Reset, B, I, Link, editor inside an open row) → field inputs, Reset, toolbar, editor → Discard → Save changes          |

## 16. Copy

All strings are **platform UI copy: fixed, never Voice**. New keys are added to
every platform locale (`de`, `en`, `es`, `fr`, `nl`).

Reuse: today's `surfaceSummary` already spells "N lists / N fields" and
"all default / N customised". Rather than copy those clauses into new keys,
they are split into `surfaceCount` and `customisedStatus`, and
`surfaceSummary` becomes the join `{count} · {status}`. The chip count, the
card summary, the section meta and the error meta are all built from those
three keys plus the existing `saveBar.fieldsNeedAttention`. The planned
`chipCustomised` and `sectionNeedsAttention` keys are dropped.

| String                                                                                        | Key                                                                                   | Status                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Voice                                                                                         | `voiceSettings.heading`                                                               | existing                                                                                                                                                                                                          |
| Reword the site's page-level messages. …                                                      | `voiceSettings.description`                                                           | existing                                                                                                                                                                                                          |
| Buttons, menus and labels are translated …                                                    | `voiceSettings.fixedCopyNote`                                                         | existing                                                                                                                                                                                                          |
| Editing {language} — other languages keep their own text.                                     | `voiceSettings.editingLanguageNote`                                                   | existing                                                                                                                                                                                                          |
| Default language · 3 customised / All default / 1 customised                                  | `languagePicker.optionDescription`                                                    | existing                                                                                                                                                                                                          |
| Live preview                                                                                  | `previewModeControl.livePreviewHeading`                                               | existing (new position)                                                                                                                                                                                           |
| Light / Dark / Preview colour scheme                                                          | `previewModeControl.modeLight` / `modeDark` / `previewColorSchemeAriaLabel`           | existing                                                                                                                                                                                                          |
| Sections                                                                                      | `voiceSettings.sectionsRegionLabel`                                                   | **new**                                                                                                                                                                                                           |
| Voice sections                                                                                | `voiceSettings.sectionsNavLabel`                                                      | **new**                                                                                                                                                                                                           |
| Jump to                                                                                       | `voiceSettings.jumpTo`                                                                | **new**                                                                                                                                                                                                           |
| Error pages / Empty states                                                                    | `voiceSections.ERROR_PAGES` / `EMPTY_STATES`                                          | **new**                                                                                                                                                                                                           |
| {count} customised (chip count)                                                               | `voiceSettings.customisedStatus` (shared with the metas below)                        | **new**: `{count, plural, =0 {all default} other {# customised}}`; the chip renders it only when count > 0                                                                                                        |
| {count, plural, one {# error} other {# errors}}                                               | `voiceSettings.chipErrors`                                                            | **new**                                                                                                                                                                                                           |
| Expand all / Collapse all                                                                     | `voiceSettings.expandAll` / `collapseAll`                                             | **new**                                                                                                                                                                                                           |
| Expand all sections / Collapse all sections                                                   | `voiceSettings.expandAllSections` / `collapseAllSections`                             | **new**                                                                                                                                                                                                           |
| 5 fields · 1 customised / N fields · all default / 5 lists · 2 customised                     | `voiceSettings.surfaceSummary`                                                        | **changed** in every locale to `{count} · {status}`: the caller passes `count` = `surfaceCount` and `status` = `customisedStatus` (card summary, section meta) or `saveBar.fieldsNeedAttention` (error meta)      |
| 6 fields · 1 field needs attention / 6 fields · 2 fields need attention                       | `voiceSettings.surfaceSummary` with `status` = existing `saveBar.fieldsNeedAttention` | existing (reused; no new key)                                                                                                                                                                                     |
| 3 fields / 2 fields / 5 lists / 1 field (summary rows, and the first half of every meta)      | `voiceSettings.surfaceCount`                                                          | **new**: `{unit, select, lists {{total, plural, one {# list} other {# lists}}} other {{total, plural, one {# field} other {# fields}}}}` — the first clause of today's `surfaceSummary`, moved, so it exists once |
| Page not found / Error page / Empty lists / Bookmarks                                         | `voiceSurfaces.*`                                                                     | existing                                                                                                                                                                                                          |
| Summary-row descriptions                                                                      | `voiceSurfaceDescriptions.*`                                                          | existing (D2)                                                                                                                                                                                                     |
| Customised / Default / Unsaved / Reset                                                        | `fieldStatus.*`                                                                       | existing                                                                                                                                                                                                          |
| Shown at /blog …                                                                              | `voiceSettings.listRoute`                                                             | existing                                                                                                                                                                                                          |
| Field labels, hints, notes                                                                    | `voiceFieldLabels.*`, `voiceFieldHints.*`, `voiceSurfaceNotes.*`                      | existing                                                                                                                                                                                                          |
| Keep {name} — the site fills it in.                                                           | `voiceSettings.keepPlaceholder`                                                       | existing                                                                                                                                                                                                          |
| Keep the placeholder {name} — the site fills it in.                                           | `voiceSettings.fieldError.MISSING_PLACEHOLDER`                                        | existing                                                                                                                                                                                                          |
| PREVIEW · TOPIC PAGE / PREVIEW (uppercased by CSS)                                            | `voiceSettings.previewLabel`                                                          | **new**, one key: `{hasField, select, true {Preview · {field}} other {Preview}}`; `field` is the open row's `voiceFieldLabels.*`                                                                                  |
| Show preview / Hide preview                                                                   | `voiceSpecimen.showPreview` / `hidePreview`                                           | existing                                                                                                                                                                                                          |
| Unsaved changes / 1 unsaved change / All changes saved / ⌘S / Ctrl+S / Discard / Save changes | `saveBar.*`                                                                           | existing                                                                                                                                                                                                          |
| 1 field needs attention / Go to the first one / Not saved                                     | `saveBar.fieldsNeedAttention` / `goToFirstField` / `notSaved`                         | existing                                                                                                                                                                                                          |

None of the gap frames adds a string. Every one of them (P, U, F, S, E, N, M)
uses only the keys above or existing ones (`archivedTenantNotice`,
`draftRecovery`, `voiceSettings.alertError`, `voiceSettings.draftFieldLabel`,
`voiceFieldLabels.*`, `voiceFieldHints.*`, `voiceSurfaceNotes.*`, the site
catalog's `notFound` and `localeErrorPage`). The strings the boards mark as not
yet in `en.json` are exactly this table's **new** rows. The tooltips repeat
each trigger's existing `aria-label`, so they add no copy.

## 17. Code mapping

Paths relative to `apps/platform/src/` unless noted. The "Owner" column names
the ticket that builds each piece; a ticket from another set is consumed here,
never rebuilt (resolutions § 2).

| Area              | Today                                                                                                                                         | Change                                                                                                                                                     | Owner        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Tokens            | `styles/admin-theme.css`                                                                                                                      | `brand-line`, `brand-hover` (D6), `shadow-admin-bar`, `-dock`, `-xs` (§ 5); after #6381 in the admin-theme chain                                           | #6403        |
| Mono font         | `config/font-loaders/jetbrains-mono-font.ts` (no variable)                                                                                    | admin mono font and `font-admin-mono`                                                                                                                      | #6288 (X24)  |
| Tooltip           | inline in the editor toolbar's toggle button                                                                                                  | shared `components/shared/tooltip/`, LB look, Base UI timing; the editor toolbar adopts it                                                                 | #6370 (X1)   |
| Focus ring        | three different forms                                                                                                                         | one gapped ring helper per ground                                                                                                                          | #6337 (X13)  |
| Page heading      | shared `PageHeader` with a white band                                                                                                         | 24/32 heading on the page background, global                                                                                                               | #6357 (X19)  |
| Card chrome       | shared `Card`                                                                                                                                 | 50px #eef1f6 header, 14/20 title, global                                                                                                                   | #6355 (X15)  |
| Pill size         | `components/shared/status-badge/`                                                                                                             | 20px LB pill, global                                                                                                                                       | #6356 (X12)  |
| Pill tone         | `utils/status-tone/status-tone.ts` maps `customised` to `brand`                                                                               | `customised` → `plan` (#3730a3)                                                                                                                            | #6409        |
| Icon sizes        | `components/shared/icon/` 16/18/24                                                                                                            | 10/12 sizes and a stroke override                                                                                                                          | #6361        |
| Glyphs            | `packages/config/src/constants/icon.ts`; `packages/ui/src/components/atoms/icon/icon-registry.ts` (`Record<TIconName, …>`); platform registry | new keys + `@blog/ui` glyphs in one PR (#6404); platform registrations in the next (#6405): UNFOLD, ERROR, TICK, the LX glyphs; SUN and MOON registered    | #6404, #6405 |
| Icon toggle       | `components/shared/preview-mode-control/` renders a text `SegmentedControl`                                                                   | `IconToggleGroup` (generic); #6390 builds the preview's Colour scheme group on it                                                                          | #6382        |
| Voice switch      | Voice renders `PreviewModeControl`'s text control                                                                                             | #6390's Colour scheme group moves out of `preview-frame/` into its own shared folder; Voice renders it (no icon look on `PreviewModeControl`)              | #6406        |
| Language          | `components/shared/language-picker/` → `SegmentedControl` (ToggleGroup, aria-pressed); Voice and Email                                        | radio variant of `SegmentedControl` (after #6385 restyles the control); `LanguagePicker` adopts it                                                         | #6407        |
| Note              | `components/shared/alert/` INFO                                                                                                               | `note` appearance; the Voice info note adopts it                                                                                                           | #6408        |
| Button XS         | `components/shared/button/` SM is the smallest; `field-status/` renders Reset at SM                                                           | XS size (28; 44 below `md`); `FieldStatus` is split into dot + pill, and Reset is a separate XS Button placed by `voice-field` and `email-template-editor` | #6410        |
| Unsaved dot       | `components/shared/unsaved-dot/`                                                                                                              | 7px brand dot, app-wide                                                                                                                                    | #6387        |
| Accordion         | `components/shared/accordion/` (only Voice uses it)                                                                                           | chevron right rotating 90°, centred, top borders + list bottom border, open bg, heading-level prop, phone form, #6337 ring                                 | #6411        |
| Editor            | `components/shared/portable-text-editor/` min-h 140, toolbar bg surface-2                                                                     | compact size (§ 11.5) incl. its phone form; Voice fields adopt it                                                                                          | #6412        |
| Save bar          | `components/shared/settings-form-shell/components/save-bar/` floating card                                                                    | docked bar from `md`, error content, pending state, 768–1023 form                                                                                          | #6413        |
| Save bar location | same                                                                                                                                          | opt-in "in {card}", LX phone layout                                                                                                                        | #6388        |
| Voice footer      | same                                                                                                                                          | Voice phone footer: no Discard, stays when clean, error and saving states                                                                                  | #6414        |
| Grouping          | `utils/voice-draft/voice-draft.ts`                                                                                                            | `VOICE_SECTION`, section order, surfaces by section, derived page order (§ 4)                                                                              | #6415        |
| Page head         | `components/features/voice/voice-settings/`, `voice-page-content/`; `components/shared/settings-form-shell/` (root `gap-6`)                   | head content, note row (§ 6–7), phone head, shell notices order (§ 6.2); the shell's opt-in 20 / 16 stack gap (§ 6)                                        | #6416        |
| Sections          | same + `components/shared/disclosure/` + new `VoiceSection`, `VoiceSectionSummary`; `constants/voice.ts` id maps                              | Disclosure `section` variant; § 9–10; per-section counts; split copy keys (§ 16)                                                                           | #6417        |
| Cards             | `voice-surface-card/`, `voice-list-row/`                                                                                                      | Empty lists body, list rows, preview pane, Show preview (§ 11.2–11.4.1, 11.6)                                                                              | #6418        |
| Field cards       | `voice-surface-card/`, `voice-field/`                                                                                                         | Page not found, Error page, Bookmarks bodies (§ 11.7, 11.8)                                                                                                | #6419        |
| Chip bar ≥ 1024   | new `VoiceSectionBar`                                                                                                                         | § 8.1, 8.2, 8.4                                                                                                                                            | #6420        |
| Chip bar < 1024   | same                                                                                                                                          | § 8.3 (phone) and § 8.5 (768–1023): the icon button, swipeable chips, unpinned phone bar                                                                   | #6421        |
| Error flow        | `voice-settings/use-voice-draft.ts` `revealError`                                                                                             | § 13                                                                                                                                                       | #6422        |

## 18. Decisions: status after the precedence rule and the gap frames

Every D-entry the earlier draft put to the user, with what settles it now.
"Board" = a drawn frame settles it; "Rule" = the precedence rule or a repo rule
settles it; "Confirm-only" = no board answers and the recommendation has no
rival, approved in one batch; "Decided 31 Oct" = the product choice was put to the user and approved as drafted.

| #   | Question                                         | Status and answer (written into the tickets)                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Tickets             |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| D1  | B5 vs A spacing                                  | Board: A wins on desktop; phone values from B1/B2                                                                                                                                                                                                                                                                                                                                                                                                                                             | 15                  |
| D2  | Empty lists summary description                  | Board: the card's existing description (A); no new string                                                                                                                                                                                                                                                                                                                                                                                                                                     | 15                  |
| D3  | Phone Bookmarks editor without a toolbar (B1-21) | Decided 31 Oct (Q18): keep the toolbar on every rich field at every width, as F2/F3 draw (#6412 builds the 44px phone toolbar)                                                                                                                                                                                                                                                                                                                                                                | 10, 21, 20          |
| D4  | Phone footer has no Discard                      | Board (B1-22)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 12                  |
| D5  | h1 and card title change shared components       | Rule (X19, X15): global, owned by #6357 and #6355; no Voice-only prop                                                                                                                                                                                                                                                                                                                                                                                                                         | dash-1, dash-3      |
| D6  | Hover colours                                    | Rule: TH1 tokens only. Light/Dark hover = #6381's #e2e5ea. **Active chip hover: decided 31 Oct (Q19)** (theme spec § 20 item 3): `admin-brand-strong` is #c7cdfd in Dark, white on it 1.55:1. Decided: a `brand-hover` token #3730a3 / #6159ee (5.03:1), light value by #6403, dark by #6291                                                                                                                                                                                                  | 1, 17, 20           |
| D7  | Top-bar height                                   | Rule: SH1 draws 59 / 67 (#6375, #6376); `--spacing-admin-topbar` stays 68 (X4), so the bar's `top` is the drawn height and its scroll margin subtracts the 68 (§ 5.3, § 14)                                                                                                                                                                                                                                                                                                                   | 17, 18              |
| D8  | #6290 widening the Voice preview                 | Rule (X25): #6290 keeps only its lock-icon half; Voice keeps two equal columns; no Voice ticket depends on #6290                                                                                                                                                                                                                                                                                                                                                                              | —                   |
| D9  | Open state on first load                         | Board (B7): every section collapsed, except one a URL hash points into                                                                                                                                                                                                                                                                                                                                                                                                                        | 15                  |
| D10 | Phone head and note row                          | Board: P1–P3 (§ 6.1, § 7.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 14                  |
| D11 | 768–1023                                         | Board: M1–M4 (§ 8.5, § 12.4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 11, 18              |
| D12 | Phone editor text size                           | Rule: 16px/24px below `md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 10                  |
| D13 | `h4 > button` on phone rows                      | Confirm-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 9, 16               |
| D14 | One body id for `aria-controls`                  | Confirm-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 15                  |
| D15 | Error content in the docked bar                  | Board (B6-8): replaces the left content; Discard and Save stay                                                                                                                                                                                                                                                                                                                                                                                                                                | 11                  |
| D16 | Chip error icon                                  | Board: `ICONS.ERROR` with the exclamation glyph; key in #6404, platform glyph in #6405                                                                                                                                                                                                                                                                                                                                                                                                        | ICONS-2, 19         |
| D17 | Collapse all leaves open rows                    | Confirm-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 17                  |
| D18 | Tooltip and icon toggle owned by other sets      | Rule: #6370 and #6382 own them; NEW-voice-2 is withdrawn and #6406 narrowed to Voice rendering #6390's Colour scheme group on #6382's primitive                                                                                                                                                                                                                                                                                                                                               | 3                   |
| D19 | Active chip at the top of the page               | Board (B7-4, U1–U2): none until the first header is scrolled past                                                                                                                                                                                                                                                                                                                                                                                                                             | 17, 18              |
| D20 | Collapsed sections show summary rows             | Board (B5, M1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 15                  |
| D21 | Content bottom padding                           | Board: 96 below `md` (P1), 120 from `md`; 48 when archived (NA). One owner per value: 120 and 48 from `md` #6413, 96 and 48 below `md` #6414                                                                                                                                                                                                                                                                                                                                                  | 11, 12              |
| D22 | Unsaved dot on phone rows                        | Board (F2, E-frames): the dot shows wherever a draft differs, every width                                                                                                                                                                                                                                                                                                                                                                                                                     | 16, 21              |
| D23 | Desktop bar when clean                           | Confirm-only, approved 31 Oct (Q31); the M1/M3 conflict is decided 31 Oct (Q20, § 12.4): unmount when clean from `md`                                                                                                                                                                                                                                                                                                                                                                         | 11, 20              |
| D45 | Saved status in the page head                    | Confirmed 31 Oct (§ 12.1 "head status"): Voice shows none; other settings pages unchanged                                                                                                                                                                                                                                                                                                                                                                                                     | 11                  |
| D24 | Phone footer error                               | Decided 31 Oct (Q21): E1, E2 and E4 draw two rows, 85 tall: two rows (one row needs ≈ 441px)                                                                                                                                                                                                                                                                                                                                                                                                  | 12, 20              |
| D25 | Phone bar before it pins                         | Board (U1–U3): in-flow card, 61 tall, pins at 67                                                                                                                                                                                                                                                                                                                                                                                                                                              | 18                  |
| D26 | Icon button glyph once all open                  | Confirm-only: the unfold glyph in both states                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 18                  |
| D27 | Error text replaces the "Keep {name}" note       | Board (B6): the note below the control is replaced; the hint row (hint and Reset) stays                                                                                                                                                                                                                                                                                                                                                                                                       | 19                  |
| D28 | Language option min-widths                       | Confirm-only (P1–P2 draw 150 / 120 too)                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 4                   |
| D29 | One open row; preview with none open             | Confirm-only; S1 draws "Preview · Blog index page" with none open                                                                                                                                                                                                                                                                                                                                                                                                                             | 16                  |
| D30 | Save bar global                                  | Rule (X16)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 11                  |
| D31 | Pill change global                               | Rule (X12): size by #6356; Voice adds only the Customised tone                                                                                                                                                                                                                                                                                                                                                                                                                                | 6                   |
| D32 | Page not found and Error page expanded           | Board: F1–F3 (§ 11.8)                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 21                  |
| D33 | Show preview pressed                             | Board: S1 (§ 11.4.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 16                  |
| D34 | Show preview only on Empty lists                 | Board (B1-20, B1-21, F2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 16, 21              |
| D35 | Hover and motion                                 | Rule for colour (TH1 `surface-2`); motion confirm-only                                                                                                                                                                                                                                                                                                                                                                                                                                        | 9, 15               |
| D36 | Notices and the archived state                   | Board: NA, NB, NC1, NC2 (§ 6.2)                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 14                  |
| D37 | Desktop chip overflow                            | Board for 768–1023 (M2: `scrollLeft`, 28px fades); confirm-only from 1024 (same rule)                                                                                                                                                                                                                                                                                                                                                                                                         | 17, 18              |
| D38 | State across Save and a language switch          | Confirm-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 15, 16              |
| D39 | Second invalid list row                          | Board (E2: Tag page closed with its collapsed-row note)                                                                                                                                                                                                                                                                                                                                                                                                                                       | 16, 19              |
| D40 | First open row                                   | Confirm-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 16                  |
| D41 | Saving state                                     | Board (E3, M3): `aria-disabled` + `aria-busy` pending Save, keeps focus; Discard disabled                                                                                                                                                                                                                                                                                                                                                                                                     | 11, 12              |
| D42 | Phone footer landmark name                       | Board (E-frames)                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 12                  |
| D43 | Editor toolbar tooltips                          | Rule (X1): #6370 moves the editor tooltip into the shared one; no ARROW appearance                                                                                                                                                                                                                                                                                                                                                                                                            | SH1-1               |
| D44 | Chip activation and the URL hash                 | Confirm-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 15, 17              |
| D46 | Customised counts and unsaved edits              | Decided 31 Oct (Q22, § 4): F1/F2 print saved-only counts beside draft-based pills; every count (chip, section meta, card summary, language sub-line) counts the draft, saved or not, as today                                                                                                                                                                                                                                                                                                 | 15, 21, 20          |
| D47 | 44px phone Reset and toolbar buttons             | Decided 31 Oct (Q21): `gap-voice-phone-footer-states` and `gap-voice-field-cards` F2 draw them 44 tall and flag it against § 11.5 / A55. 44 below `md` (Reset min-width 64), 28 from `md`                                                                                                                                                                                                                                                                                                     | 7, 10, 21, 20       |
| D48 | `brand-line` beside #6381's `note-line`          | Decided 31 Oct (Q23, § 5); #6403 still owns the duplicate check: keep both (opaque #c7d2fe also fills the disabled phone Save; Dark values differ)                                                                                                                                                                                                                                                                                                                                            | 1                   |
| D49 | Save-bar breakpoint                              | Decided 31 Oct (Q24, § 12): docked from `md` on every settings page; #6388's phone layout below `md`, its body changed from "below `lg`"                                                                                                                                                                                                                                                                                                                                                      | 11, 12, 20, look-27 |
| D50 | Near-duplicate glyphs                            | Decided 31 Oct (Q2): MONITOR (theme) and DESKTOP (LX) are both monitors; TICK (onboarding) and CHECK_STROKE (Look) are near-identical ticks. Decided: one key per pair, `MONITOR` and `TICK`, each use setting its stroke through #6361's `strokeWidth`; the Look and theme sets repoint DESKTOP and CHECK_STROKE before filing                                                                                                                                                               | ICONS, ICONS-2      |
| D51 | Admin-only glyphs in `@blog/ui`                  | Decided 31 Oct (Q2): the new keys are admin-only, and CLAUDE.md says nothing is added to `@blog/ui` for `apps/platform`. Alternative: a platform-owned icon-name const (`apps/platform/src/constants/icon.ts`) with the platform registry keyed on `TIconName` plus its union, which withdraws #6404. Decided: shared `ICONS` keys, since `ICONS` is the platform `Icon`'s one name vocabulary and already carries admin-only keys (BOLD, ITALIC, STUDIO, MENU_ROWS) in `@blog/ui`'s registry | ICONS, ICONS-2      |

Confirm-only batch, approved 31 Oct (Q31) as drafted: D13, D14, D17, D21, D22,
D23 (unmount), D26, D28, D29, D35 (motion), D37 (from 1024), D38, D39, D40,
D41, D42, D44. D45 is stated in the tickets with the batch but is not named in
Q31. #6407 (D28), #6411 (D13, D35), #6413 (D23, D45),
#6417 (D14, D35, D38, D44), #6418 (D13, D29, D38, D40),
#6420 (D17, D37, D44), #6421 (D26, D37) and #6423, which
checks them, state its answers as settled behaviour.

The other items are decided 31 Oct and written into their tickets: D3 (Q18)
into #6412, #6419 and #6423; the D23 M1/M3 clean-bar conflict (Q20) into
#6413 and #6423; D6 (Q19, the `brand-hover` token, theme spec § 20 item 3)
into #6403, #6420 and #6423; D24 and D47 (Q21: two-row phone error footer,
44px phone controls) into #6414, #6410, #6412, #6419 and #6423; D46 (Q22, counts
include unsaved edits) into #6417, #6419 and #6423; D48 (Q23, `brand-line`
beside `note-line`) into #6403; D49 (Q24, save-bar breakpoint) into
#6413, #6414 and #6423, with #6388 in the Look set; D50 and D51 (Q2,
glyphs) into #6404 and #6405.

## 19. Ticket order

Every ticket depends on **#6314** (the six reconciled specs and
`2026-10-30-admin-redesign-resolutions.md` on `main`). Below, "after" means that ticket must be merged
first, for the shared file or symbol named.

| Step | Ticket | What                                                                         | After (besides #6314)                                                                                                                                                       |
| ---- | ------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | #6403  | brand-line, brand-hover (D6) + three shadows                                 | #6381 (`admin-theme.css` chain: #6321 → #6288 → #6381 → #6403 → #6357 → #6291)                                                                                              |
| 2    | #6404  | new glyph keys in config and `@blog/ui`'s registry                           | —                                                                                                                                                                           |
| 2b   | #6405  | the platform registry registers them                                         | #6404 (keys), #6361 (`shared/icon/*`)                                                                                                                                       |
| 3    | #6406  | #6390's Colour scheme group moves to its own shared folder; Voice renders it | #6390 (the group, `preview-frame/`; itself after #6382), #6337 (ring helper)                                                                                                |
| 4    | #6407  | language radio group (Voice, Email)                                          | #6403 (`shadow-admin-xs`), #6385 (`segmented-control/`), #6337 (ring helper)                                                                                                |
| 5    | #6408  | Alert note (+ Voice note adopts)                                             | #6403 (`brand-line`)                                                                                                                                                        |
| 6    | #6409  | Customised pill tone                                                         | #6356 (the 20px pill its criteria check; the `plan` tone is already on `main`)                                                                                              |
| 7    | #6410  | Button XS (+ FieldStatus Reset adopts)                                       | #6358 (`button/`)                                                                                                                                                           |
| 8    | #6411  | Accordion                                                                    | #6337 (ring helper)                                                                                                                                                         |
| 9    | #6412  | compact editor (+ Voice fields adopt)                                        | #6370 (`portable-text-editor/`), #6403, #6337 (ring helper, control and invalid borders)                                                                                    |
| 10   | #6413  | save bar docked + error content + pending + 768–1023                         | #6403 (`shadow-admin-dock`), #6337 (ring helper)                                                                                                                            |
| 11   | #6414  | Voice phone footer                                                           | #6388 (`settings-form-shell/`; itself after #6413)                                                                                                                          |
| 12   | #6415  | Voice sections data                                                          | —                                                                                                                                                                           |
| 13   | #6416  | Voice head + note row (desktop and phone)                                    | #6406, #6407, #6408, #6357 (the global heading it checks; no `page-header/` file)                                                                                           |
| 14   | #6417  | Voice sections + summary (+ Disclosure section variant)                      | #6409, #6411, #6415, #6416                                                                                                                                                  |
| 15   | #6418  | Empty lists card                                                             | #6410, #6411, #6412, #6417, #6387                                                                                                                                           |
| 16   | #6419  | field cards (Page not found, Error page, Bookmarks)                          | #6418                                                                                                                                                                       |
| 17   | #6420  | Voice chip bar from 1024                                                     | #6419, #6375 (59px top bar, § 5.3)                                                                                                                                          |
| 18   | #6421  | Voice chip bar below 1024 (phone and 768–1023)                               | #6420, #6370, #6376 (67px phone top bar), #6405 (UNFOLD)                                                                                                                    |
| 19   | #6422  | Voice save-error flow                                                        | #6421, #6414, #6405 (ERROR)                                                                                                                                                 |
| 20   | #6423  | manual test, Light and Dark                                                  | #6422, #6291 (X27; `prio:next` per X30), and what its steps check outside the set: #6287, #6288, #6372 (content edge), #6375 / #6376 (59 / 67 top bar), #6355 (card chrome) |

Every PR ships alone and is merged before the next starts (CLAUDE.md "One
layer at a time"). #6404 and #6405 are two PRs: only config and
`@blog/ui` must land together (`ICON_REGISTRY` is a full
`Record<TIconName, …>`); the platform registry is `satisfies
Partial<Record<TIconName, …>>`, so its registrations merge green alone.
Steps 1–11 touch different shared files and may be taken in
any order their "after" column allows; steps 12–19 are one sequence on the
Voice feature files. Withdrawn: NEW-voice-2 (the shared Tooltip is #6370),
NEW-voice-8 (merged into #6417), NEW-voice-22 (widened into #6404 and
#6405).
Every ticket is a sub-issue of the epic #6319 (parent, not a blocker).

Never in parallel with another set's ticket on the same files (resolutions
§ 4): `segmented-control/` (#6407 with #6337, #6339, #6343,
#6384, #6385, #6325); `button/` (#6410 with #6337,
#6358, #6327); `preview-frame/` (#6406 with #6390, #6426,
#6332); `settings-form-shell/` (#6413, #6388,
#6414, #6424, #6416, #6422); `accordion/` (#6411, then
#6386). No Voice ticket edits `page-header/` (#6357, #6391):
#6416 reaches its `actions` slot through `SettingsFormShell`'s `headerActions`.

## 20. Acceptance checklist

Tick each against the build at the frame's width, side by side with the
board, in Light; the D-section repeats the colour checks in Dark. The
manual-test issue (#6423) carries a copy. Every element id this
document defines has a box. Where a frame still draws a value the rule
overrides, the box states the rule's value.

### G · global (every frame)

- [ ] The shell around Voice is SH1 in TH1 colours, as `gap-shell-sh1-in-th1` draws it (264 sidebar, 59 / 67 top bar), not V3a's dark sidebar
- [ ] Line heights as § 5.1 (language option ≈ 43 tall from `md`, list row ≈ 58, summary row 48) — none taller than the board
- [ ] Every mono element (route, `{name}` chips, preview label) in JetBrains Mono 500, not the system mono
- [ ] Every focus ring is the gapped ring: 2px gap in the ground's colour, then 2px #4f46e5 — no white band on #f6f7f9, #eef0f3, #eef1f6 or #fbfbfd
- [ ] Every control border is #878f9d (none #818a99)
- [ ] Tooltips: the shared dark tooltip, 6px below, after the hover delay from the pointer, at once on keyboard focus, gone on Escape; none on touch
- [ ] Hover: none on section headers; #fbfbfd on summary rows and list rows; chevrons rotate 90° on open; reduced motion removes all motion
- [ ] Reduced motion: every jump (chip, summary row, "Go to the first one", Save's reveal, a hash on load) scrolls instantly, and so does the chip list's sideways scroll
- [ ] Pills 20px tall, 11.5px/600; Customised #3730a3 on #eef2ff, Default #5b6472 on #eef0f3
- [ ] Unsaved dots on rows and field labels are the shared dot (#6387); the save bar's own dot is 8px #8a5f00

### A · 1440 desktop

- [ ] A19 content in SH1's column: starts at the sidebar edge, 26 padding, bottom 120, vertical gap 20 (content 1124 wide)
- [ ] A20 head row: #6357 row, gap 16, top-aligned, language group in the actions slot right of the title block
- [ ] A21 h1 "Voice" 24/32 600 on the page bg, no white band; description 13.5/20 muted, 4 below
- [ ] A22 language radiogroup: track #eef0f3 radius 6 no border, padding 3, gap 2
- [ ] A23 English selected: white, shadow-xs, min-width 150, name 13/600 + "Default language · 3 customised" 12 Inter muted
- [ ] A24 Nederlands "All default", min-width 120, transparent
- [ ] A25 Français "1 customised", min-width 120, transparent
- [ ] A26 note row gap 16, stretch; switch group gap 8, centred against the note
- [ ] A27 note: role note, info icon 16 brand, #eef2ff, #c7d2fe border, radius 6, padding 10/14, no shadow, 13/19 text, bold "English"
- [ ] A28 "Live preview" 12 muted beside the switch, right of the note, same row
- [ ] A29 track #eef0f3, border #878f9d, radius 5, padding 2, gap 2
- [ ] A30 Light 32×32 sun (#6382's size; A draws 30), pressed: white plate, #3730a3 icon, inset 1.5px brand-ink #4f46e5 ring; hover keeps the pressed look; shared tooltip "Light"
- [ ] A31 Dark 32×32 moon, unpressed #5b6472; hover #12141a on #e2e5ea; shared tooltip "Dark"
- [ ] A32 bar: white, border all round, radius 6, padding 8/10/8/14, gap 12; once pinned it sits directly under the 59 top bar with no gap (not at the 68 token)
- [ ] A33 "Jump to" 12/600 muted, nowrap
- [ ] A34 chips 8 apart, no scrollbar visible
- [ ] A35 chip Error pages + "1 customised": 32 tall, pill, #878f9d border, 13/600 #12141a, no underline, name-count gap 8
- [ ] A36 active chip (only once its header is scrolled past): brand fill, fixed-white text and count, aria-current; hover `admin-brand-hover` #3730a3 (D6)
- [ ] A37 "Expand all" / A38 "Collapse all": 28 tall, 12.5/600, no shadow, 6 apart, always enabled
- [ ] A39 sections 28 apart
- [ ] A40 collapsed section header-to-list gap 10; A45 expanded header-to-cards gap 12
- [ ] A41 Error pages header: chevron right first, 16/22 title, "5 fields · 1 customised" 12.5/18 muted, min-h 44
- [ ] A42 summary list white, border, radius 6, no shadow
- [ ] A43 Page not found row: name 180 / description ellipsis / "3 fields" / Customised / chevron, min-h 48, padding 10/18, no underline
- [ ] A44 Error page row: border-top #eef0f3, "2 fields", Default
- [ ] A46 Empty states header: chevron down, "6 fields · 2 customised"
- [ ] A47 cards 24 apart
- [ ] A48 card: white, #e5e7eb border, radius 6, shadow-admin
- [ ] A49 Empty lists header: min-h 50, padding 12/18, gap 10, bg #eef1f6, bottom border #e5e7eb; h3 14/20 600, description 12.5/18, "5 lists · 2 customised" 12/16 right
- [ ] A50 two equal columns; A51 left cell padding 18
- [ ] A51 list bottom border, every row top border
- [ ] A52 Blog index page row: label column 130 (name + mono route, gap 2), ellipsis value, Customised, chevron right, padding 12/10, centred
- [ ] A53 Topic page row open: #fbfbfd, value still shown, unsaved dot + Customised gap 8, chevron down
- [ ] A54 panel padding 4/10/16, gap 8, #fbfbfd
- [ ] A55 hint "A topic with no posts yet" + Reset XS (no pill, no dot in panel)
- [ ] a Default row's open panel shows the hint alone, no Reset
- [ ] A56–A59 editor toolbar white, gap 2, padding 4: B (700), I (italic serif), Link (14) 28×28
- [ ] A60 editor body padding 8/10, min-h 56, 13.5/20, `{name}` code chip
- [ ] A61 "Keep {name} — the site fills it in." with mono 12 token, no chip background
- [ ] A62–A64 Tag page / Topics index page / Tags index page rows with Default
- [ ] A65 preview pane padding 18, #f6f7f9, border-left #eef0f3, gap 10
- [ ] A66 "PREVIEW · TOPIC PAGE" mono 11 uppercase .06em, weight 500
- [ ] A67 the specimen is the tenant's real site (VoiceSpecimen); Light / Dark switches it
- [ ] A69 specimen min-height 260, `{name}` substituted ("Design")
- [ ] A70 note "The heading comes from Studio; only the message is yours here."
- [ ] A71 Bookmarks header on the #eef1f6 chrome: h3 "Bookmarks" 14/20 600, description "A reader's saved posts, before they save any" 12.5/18 muted
- [ ] A72 Bookmarks header "1 field · all default" 12/16 muted, right
- [ ] A74 label row "Empty bookmarks" 13/18 600 + Default; A75 hint row; A76–A80 editor with toolbar
- [ ] A81 "PREVIEW", specimen min-height 150; A82 "The page title and panel heading are fixed."
- [ ] A83 save bar docked at the sidebar edge, 64 tall, top border, upward shadow, no radius, padding 0 26
- [ ] A83 dot, "1 unsaved change" 13.5/600, "⌘S / Ctrl+S" 12 muted plain text pushed right
- [ ] A84 Discard 36 outlined #878f9d; A85 Save changes 36 brand
- [ ] last card stays visible above the bar when scrolled to the end
- [ ] chip click and Enter both open, scroll 16 under the bar, focus the header and set the URL hash `#sec-errors` / `#sec-empty`
- [ ] summary row click sets the hash `#s-notfound` / `#s-error` / `#s-lists` / `#s-bookmarks` and focuses the card heading (no ring)
- [ ] reloading with `#sec-empty` or `#s-lists` opens Empty states; with no hash every section is collapsed
- [ ] the active chip turns on as its header reaches 16 under the bar; at the end of the page the last section's chip is active
- [ ] after Save, and after switching language, open sections and the open row stay as they were; Show preview is closed
- [ ] saving: "Saving…" on Save at its width, Save keeps focus (aria-disabled, not disabled), Discard disabled, page not editable

### F · field cards (`gap-voice-field-cards` F1–F3)

- [ ] F1 Error pages expanded at 1440: Page not found and Error page cards, fields left, preview right, two equal columns
- [ ] F1 fields cell padding 18, fields 20 apart; each field label row, hint row, control, 8 apart
- [ ] F1 Eyebrow: label + Default; hint "Small label above the heading"; one-line input 36 tall, #878f9d border, 13.5/20
- [ ] F1 Heading: label + Customised; hint "Also the browser tab title" + Reset XS at the end of the hint row
- [ ] F1 Supporting text: label + unsaved dot + Customised; hint "Below the heading" + Reset; compact editor with B, I, Link, focus ring on the shell
- [ ] F1 Page not found preview "PREVIEW", the real site at min-height 300 with only the focused field's slot (Supporting text) outlined dashed, note "The return button is fixed and translated for you."
- [ ] F1 a Default field shows its default copy as the control's value (Eyebrow "404"), not as a placeholder
- [ ] F1 no chip is active and none has `aria-current` at the top of the page (§ 8.4 wins over F1)
- [ ] F1 Error page: Heading and Description, both Default, no dot and no Reset; preview "PREVIEW" at min-height 240 with no slot outlined; note "The buttons are fixed and translated for you."
- [ ] F1 card summaries "3 fields · 2 customised" / "2 fields · all default" (§ 4, D46; F1 prints the pre-edit "1 customised")
- [ ] F1 counts include the unsaved Supporting text edit: chip "Error pages 2 customised", meta "5 fields · 2 customised", English "Default language · 4 customised"; Reset on Heading takes them back to 1, 1 and 3
- [ ] F2 390 Page not found: one column, body padding 14, fields 20 apart, label 14/20, inputs 44 at 16/24, Reset 44 (min-width 64) on the hint row, toolbar buttons 44, editor 16/24 min-h 72, no preview, no Show preview
- [ ] F3 390 Error page: hint rows single-line, the card's note closes it under the last field
- [ ] 820: field cards one column, no preview, no Show preview
- [ ] a customised field shows Reset whenever its value differs from the default, saved or not; Reset puts the default back into the draft without saving

### P · 390 phone head (`gap-voice-phone-head` P1–P3)

- [ ] P1 content padding 14/16/96, gap 16; h1 22/28 −.01em; description 13.5/20 muted 4 below, full width
- [ ] P1 language track 12 below the title block, full width (358), padding 3, gap 2, #eef0f3, radius 6; options ≥ 44 tall, min-widths 150 / 120
- [ ] P1 a 28px fade from the theme-track token (#eef0f3 in Light) on the side that has more options; no scrollbar
- [ ] P1 note full width; 12 below it the Live preview row right-aligned, label 12/16, gap 8, Light / Dark 44×44 (track 50)
- [ ] P2 choosing Français scrolls it fully into view without moving the page; the note says "Editing Français"
- [ ] P3 single-language site: no track; the note is one sentence
- [ ] P1–P3 below the note row: every section collapsed on load, each with its summary list (D9 and D20 win over the boards' crop)
- [ ] on touch no tooltip shows on Light / Dark

### U · 390 chip bar before it pins (`gap-voice-phone-chipbar-unpinned` U1–U3)

- [ ] U1 bar in flow after the Live preview row: 358 wide, white, 1px #e5e7eb, radius 6, no shadow, 61 tall; no chip active (U1 draws Error pages already opened; on load every section is collapsed with its summary list, D9)
- [ ] U1 chips 44 tall, gap 8, track inset 8; divider 1×28; icon button 44×44
- [ ] U2 10 short of the top bar: still in-flow look, still no active chip
- [ ] U3 pinned directly under the 67 top bar, no gap: full 390 width, bottom border only, no radius, shadow, track inset 16; Error pages active once its header has passed; nothing jumps when it pins
- [ ] scrolling back past its place unpins it and clears the active chip

### B1 · 390 phone, Empty states

- [ ] B1-3 bar pinned, bottom border only, shadow, padding 8/16/8/0, gap 8, no "Jump to"
- [ ] B1-4 chip list starts 16 in, swipes sideways, no scrollbar
- [ ] B1-5/6 chips 44 tall, 13.5px; active chip scrolled into view without the page moving
- [ ] B1-7 left fade 28 only when cut off left; B1-8 right fade 36 only when cut off right
- [ ] B1-9 divider 1×28
- [ ] B1-10 icon button 44×44 radius 6, #878f9d border, unfold icon 18, "Expand all sections"
- [ ] B1-11 content padding 14/16/96, gap 16
- [ ] B1-12 section header Empty states, chevron down, 8 above its first card
- [ ] B1-13 card summary wraps under the title on the #eef1f6 header
- [ ] B1-14 body padding 4/14/10; rows min-h 52, padding 8/4, gap 10, no radius, name + (dot) + pill + chevron only, no route, no value; first row no top border, no list bottom border
- [ ] B1-15…19 five rows with their pills; a row with an unsaved edit shows the dot
- [ ] B1-20 "Show preview" full width, 44, 6 below the list; only on Empty lists
- [ ] B1-21 Bookmarks card 16 below Empty lists: field anatomy of § 11.8, editor with toolbar (D3), no preview, no Show preview
- [ ] B1-21 editor text 16px
- [ ] B1-22 footer: dot, "1 unsaved change" 13/600, Save 44; no Discard, no shortcut, no shadow; a region named by its status text

### S · Show preview pressed (`gap-voice-show-preview-pressed` S1)

- [ ] S1 the button reads "Hide preview", aria-expanded true, keeps focus with the ring
- [ ] S1 the preview 10 below: padding 14, #f6f7f9, #eef0f3 border, radius 6, gap 10
- [ ] S1 with no row open: "PREVIEW · BLOG INDEX PAGE", the Blog index specimen ("Blog", "All posts", "0 posts", "Fresh notes are on the way."), min-height 260, then the note
- [ ] pressing again restores "Show preview" and hides the group; the footer stays pinned throughout

### B2 · 390 phone, saved

- [ ] B2-2 chips without counts where nothing is customised
- [ ] B2-9 collapsed summary rows: padding 10/16, name, pill, chevron; no description, no count
- [ ] B2-16 footer "All changes saved", no dot, Save disabled #c7d2fe / #3730a3, footer stays visible

### E · 390 phone footer (`gap-voice-phone-footer-states` E1–E5)

- [ ] E1 after Save with one invalid field: Empty states opened, Topic page opened and focused; chip "1 error"; meta red
- [ ] E1 footer two rows, 85 tall: "1 field needs attention" 13/18 600 #b42318; then "Go to the first one" underlined (44 tall) and Save changes at the right; no dot, no count, no "Not saved"
- [ ] E2 two errors: Tag page closed with its collapsed-row note; chip "2 errors"; meta "6 fields · 2 fields need attention"; focus on "Go to the first one" shows the ring; activating it reopens Topic page and focuses it
- [ ] E3 saving: dot and "1 unsaved change" stay; the button reads "Saving…" at 116 wide in #c7d2fe / #3730a3, keeps focus, is announced once; 65 tall; page inert, not dimmed
- [ ] E4 at 320 the error footer is two rows, 85 tall; E5 at 320 saving is one row, 65 tall
- [ ] the page's 96 bottom padding clears the 85 error footer

### N · notices (`gap-voice-notices` NA–NC2)

- [ ] NA archived: warning notice under the head, above the note row; language, Light / Dark, chips, Expand / Collapse, headers, summary rows, list rows and Show preview all work
- [ ] NA editors and inputs read-only, in the open Topic page row as in the field cards: no toolbar, #eef0f3 fill and border, #5b6472 text, described by the notice; the hint and the "Keep {name}" note stay; no Reset, no dot, no save bar, no phone footer; bottom padding 48
- [ ] NB save failed with no field errors: error Alert, title only, as wide as its text, role alert, under the head; the bar stays "1 unsaved change" with Discard and Save; the row keeps its dot; no chip error pill, chips keep their counts and metas their "N customised"
- [ ] NC1 draft offered back: warning banner with "Restore 2 changes" and "Discard them"; saved values shown, no dot, no save bar (phone: the footer reads "All changes saved"); on load every section is collapsed (D9), and opening Empty states for the first time opens its first row (D40) — NC1 and NC2 draw it after that row was closed
- [ ] at 390 the notices sit after the language track and before the note, each 16 from its neighbours
- [ ] NC2 saved since the draft: error-tone banner, "Review the difference" open with Field / Saved / Your draft, "Restore anyway" and "Discard my draft"
- [ ] each notice keeps today's Alert look; buttons ≈ 37 tall from `md`, 44 below

### B3 · keyboard focus

B3 is a composite 490 frame. Check B3-1…B3-4 and B3-8 at 1024 or wider (the
desktop bar, #6420), B3-6 and B3-7 at 490 (the phone bar, #6421),
and B3-10 at both.

- [ ] B3-1 chip focus ring, not clipped top or bottom
- [ ] B3-2 Tab order: chips → Expand all → Collapse all → sections; Enter on a chip opens, scrolls 16 under the bar, focuses the header
- [ ] B3-3 Expand all focus ring
- [ ] B3-4 active chip follows scroll, never takes focus
- [ ] B3-6 phone icon button focus shows the ring and the shared tooltip with its name at once; Escape hides the tooltip, and so do blur and pointer leave
- [ ] B3-7 name flips to "Collapse all sections" when all open; glyph unchanged
- [ ] B3-8 section header focus ring
- [ ] B3-10 Dark focused: ring + shared tooltip "Dark"; 44px on phone

### B4 · 1280 scrolled

- [ ] B4-3 pinned bar edge to edge, radius 0, bottom border, padding 8/26, shadow, directly under the 59 top bar with no gap
- [ ] B4-4 jumped-to header 16 below the bar
- [ ] B4-6 card full content width (964), two equal columns
- [ ] B4-7 save bar from the sidebar edge to the right edge

### M · 768–1023 (`gap-voice-820` M1–M4)

- [ ] M1 820 top of the page: bar in flow (white, border, radius 6), no "Jump to", two 32px chips, a 1×24 divider and a 32×32 icon button (radius 4, #878f9d border, unfold glyph), chip list, divider and button 8 apart; every section collapsed with its summary rows; no chip active
- [ ] M1 summary rows: padding 10px 18px (A's; M1 draws 16), name column 150, description ellipsis, count and pill keep their width
- [ ] M1 sections 28 apart and header-to-body 10 (A's; M1 draws 20 and 8); head row gap 16 (M1 draws 12 / 24); bottom padding 120 (M1 draws 96)
- [ ] M1 the language group wraps under the title once the column is under ≈ 720
- [ ] M2 pinned directly under the 59 top bar, no gap: edge to edge, no radius or side borders, shadow, padding 8/26; with today's two sections nothing scrolls and no fade shows (M2 draws four, two of them examples); the icon button never scrolls
- [ ] M3 save bar 820: docked at the sidebar edge, padding 0 26, no shortcut hint; unsaved "1 unsaved change", Discard, Save changes
- [ ] M3 saving: "Saving…", Discard disabled; error: "1 field needs attention" (13.5/20 600 red) over a row, gap 6, 13/18: "Go to the first one" underlined, a muted "·" hidden from screen readers, "Not saved" muted; Discard and Save at the right; 768 plural error fits
- [ ] M3 1024: the hint returns and the error content is one line again
- [ ] M4 768 pinned: both chips fit without scrolling; 820 error chip "1 error" fits beside the other; 820 focus on the icon button shows "Collapse all sections" and the tooltip stays in the window; Escape hides the tooltip
- [ ] M4 1024: "Jump to", two chips and both text buttons — the 1280 bar
- [ ] collapsing the sidebar at 820 does not switch to the 1024 form

### B5 · collapsed overview (values from A, D1)

- [ ] B5-1 chips on one line with Expand all / Collapse all (two sections today)
- [ ] B5 every section collapsed shows its summary rows; whole page fits one screen
- [ ] no chip active at the top of the page

### B6 · save error

- [ ] B6-2 chip shows the error pill "1 error" with icon (12, stroke 2.5) instead of its count; white pill 20 tall inside the active chip
- [ ] B6-3 section meta "6 fields · 1 field needs attention" in red
- [ ] B6-5 row opened, B6-6 editor border #dd6152, focus in the field
- [ ] B6-7 error text 11.5/16 red, in place of the "Keep {name}" note; the hint row stays
- [ ] B6-8 save bar: "1 field needs attention" red, "Go to the first one" underlined link (hover #3730a3), "Not saved" right, then Discard and Save; no dot, no "1 unsaved change", no shortcut, no warning icon
- [ ] the invalid editor has aria-invalid and its description reads the error, not the "Keep {name}" note
- [ ] two invalid list rows: the first opens; the other stays closed with its error under the trigger; chip "2 errors", meta "6 fields · 2 fields need attention"
- [ ] fixing the field restores the count, the meta and the "Keep {name}" note

### B7 · nothing customised

- [ ] B7-1 chips without counts, none active, no aria-current
- [ ] B7-2/3 headers "5 fields · all default" / "6 fields · all default", each with its summary list
- [ ] B7-4 a chip becomes active only after the first header is scrolled past

### D · Dark (after #6291; `gap-theme-token-dark-values`)

- [ ] chip tones in Dark match the specimen: rest, hover, active, active with "1 error"; the active chip's text and count stay the fixed white #ffffff on #5850ec (never `admin-surface`); its hover is `admin-brand-hover` #6159ee with white text 5.03:1 (D6); the error pill inside it is #fca5a0 on `admin-surface` #171a20
- [ ] the Save changes label stays white #ffffff on #5850ec in Dark
- [ ] every fade is built from its ground's token, so in Dark it fades the ground and draws no white or light-grey band: the chip-list fades from the bar's `admin-surface` (#171a20), the phone language-track fades from `admin-theme-track` (#0f1115), each to zero alpha (the "Phone index · fade to fade-end" specimen and its note)
- [ ] the note border, the disabled phone Save fill and the saving button use `brand-line` #343a78
- [ ] the pinned bar, docked bar and selected language option carry the Dark shadows (`rgba(0,0,0,.45)`, `.4`, `.4`)
- [ ] the Light / Dark track is the TH1 theme track #0f1115; the hovered button #22262f; the pressed plate #323845 with an inset 1.5px brand-ink ring #a5b4fc (5.89:1) and a #c7cdfd icon (7.60:1)
- [ ] every focus ring is #a5b4fc with its gap in the dark ground
- [ ] every text pair on the page reaches 4.5:1 and every control border, track and ring 3:1

## Out of scope (optional follow-up)

Nothing in this set built only a page a board drew as a backdrop, so no Voice
ticket was removed for that reason. Withdrawn because another set owns the
primitive (not follow-ups): NEW-voice-2 → #6370; NEW-voice-22 → #6404
(kept in this set, widened); the Light/Dark buttons of #6406 →
#6382; the mono font of #6403 → #6288; the 22px badge of
#6409 → #6356.

Drawn on Voice boards as backdrop, not filed:

- The example sections **Confirmations** and **Sign-in** and their example
  rows (B2, B5, M2) — the surfaces do not exist.
- V3a's dark 240px sidebar, its 56px header and dark phone header (A1–A18,
  B1-1, B2-1, and the copies in F2, F3, S1) — the shell is SH1's.
- M1's Studio status line and Leads "2 new" pill, which M1 deliberately left
  out — the Studio line is #6362 / #6363's.
- The editor toolbar's own tooltip look — #6370 moves it into the shared
  tooltip.

## Addenda (review fixes)

- Save bar: `saveError` (SaveBar warning branch, shell prop, `TSettingsForm.saveError`, Look's `use-look-save-errors.ts` / `use-look-form-state.ts`) is removed by #6413; a failed save with no field errors shows only the shell's error Alert.
- Focus clearance: `scroll-padding-bottom` on the shell scroller (#6413 from 768, #6414 below), `scroll-margin-top` on fields under the chip bar (#6420/#6421).
- The Empty lists preview column sticks under the top bar plus the pinned chip bar, max-height net of both and the save bar (#6420).
- Default copy shown as the control's value: the draft model is unchanged; text equal to the default is stored as the empty value and reads Default (#6419).
