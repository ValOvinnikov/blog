# Look page: grouped folding cards, a jump index and a device-frame preview (LX + G2 for Free)

Design of record for the Look page redesign chosen on 30 Oct: direction **LX**
(L2's jump index and folding cards, L3's Style / Site parts grouping and compact
preset strip, PV2's device-frame preview), **LXG** where it differs, and **G2**
for the Growth note on a Free site. The agreed canvas is the visual reference:
https://claude.ai/artifact/LVch29ZcSE9Lh5T3Cocm9J. Every value below is copied
from the board source, never rounded. This revision applies the 30 Oct
precedence rule (§ 3 item 0), the cross-set resolutions (X1–X30 and one owner
per shared primitive) and the gap boards drawn for the states the chosen boards
left out. What is still open is the short list at the end of § 22.

| Board file                            | Canvas title                                                          | Size      | Role                                                                    |
| ------------------------------------- | --------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `look-LX-combined-desktop`            | "LX · Jump nav + groups + device preview (chosen) · Desktop"          | 1440×1290 | Paid site, desktop. **Layout source.**                                  |
| `look-LX-combined-states`             | "LX · Jump nav + groups + device preview (chosen) · States and phone" | 1440×6574 | Frames A–H. **Layout source.**                                          |
| `look-LXG-free-growth-desktop`        | "LX + G2 · Free site with Growth · Desktop"                           | 1440×1454 | Free site, desktop. Wins over G2 except the note.                       |
| `look-LXG-free-growth-states`         | "LX + G2 · Free site with Growth · States and phone"                  | 1440×2864 | Frames A–F on a Free site.                                              |
| `growth-G2-growth-card-desktop`       | "G2 · Growth note, opens in place · Desktop"                          | 1440×1651 | **Source for the Growth note and its disclosure only.**                 |
| `growth-G2-growth-card-states`        | "G2 · Growth note, opens in place · States and phone"                 | 1440×3870 | Note states 1–6. Frames 7–10 are reference (§ 15.8).                    |
| `look-PV2-device-frame-desktop`       | "PV2 · Device frame + width toggle · Desktop"                         | 1440×1000 | Device frame reference only; LX supersedes its layout.                  |
| `look-PV2-device-frame-states`        | "PV2 · Device frame + width toggle · States and phone"                | 1440×4392 | Device frame reference only.                                            |
| `gap-look-fullscreen`                 | "Full-screen preview dialog"                                          | 1440      | Frames GF-A–GF-D: the full-screen dialog (D-20, § 12.4).                |
| `gap-look-collapse-all`               | "Look collapse all"                                                   | 1440×3980 | Frame GC: every row open after Expand all (D-15).                       |
| `gap-look-savebar-multi-card`         | "Save bar several cards"                                              | 1440      | Frames GS-A–GS-C: the save bar with changes in several cards (D-21).    |
| `gap-look-follow-states`              | "Look follow states"                                                  | 1440×3861 | Frames GO-A–GO-E: the follow states LX left undrawn (D-22, D-35).       |
| `gap-look-mid-widths`                 | "Look mid widths"                                                     | 1440      | Frames GW-A–GW-C: a 1024 and a 1280 window with the sidebar (D-37).     |
| `gap-theme-token-dark-values`         | "Token dark values"                                                   | 1440      | Light and Dark values of every token #6381 adds (§ 5). Theme set.       |
| `gap-onboarding-device-frame-preview` | "Wizard device-frame preview"                                         | 1440      | What onboarding takes from the shared preview (§ 12.6). Onboarding set. |
| `gap-shell-sh1-in-th1`                | "SH1 shell in TH1 colours"                                            | 1440      | The shell around every Look frame (§ 6.1, context only). Shell set.     |

Frame ids used throughout: **LX-D** (LX desktop), **LX-A…LX-H** (LX states
frames), **LXG-D**, **LXG-A…LXG-F**, **G2-1…G2-10** (G2 states figures),
**GF-A…GF-D** (full screen), **GC** (collapse all), **GS-A…GS-C** (save bar,
several cards), **GO-A…GO-E** (follow states), **GW-A…GW-C** (mid widths).

**Filing rule.** This document lands on `main` with the other five reconciled
specs and the resolutions file in #6314, which every ticket depends on, so
every Design link and "spec § n" reference resolves for the agent or cloud
session that starts from it. Every resolved row of § 22 is already written into
the carrying tickets' criteria as an observable outcome. The rows § 22 still
lists as open are put to the user before filing; an answer that differs from
the recommendation rewrites the carrying ticket's criteria before filing,
never after. The epic and its sub-issues are filed through `board-keeper` in
one batch, epic first.

**Relation to other docs and issues.**

- `docs/superpowers/specs/2026-10-27-look-header-footer-account-design.md`
  decides **which** account, busy-button, header and footer settings exist and
  their option vocabulary (epics #6056, #6065, #6073, #6082). This document
  decides only **where and how** the Look page lays those settings out. Neither
  supersedes the other: the 10-27 doc retires when its four epics close; this
  one retires with the final ticket of its own epic (§ 20 "Feature doc").
- **Primitives another set owns** (resolutions § 2). This set depends on them
  and never builds a second copy: the Tooltip (#6370, X1); icon sizes and
  the stroke-width prop (#6361); new glyphs (#6404); the TH1 light
  palette, control borders, popover tokens and JetBrains Mono (#6288); the one
  gapped focus ring (#6337, X13); the page heading on the page background
  (#6357, X19, global); the 20 px status pill (#6356, X12); the
  accordion base (#6411); the docked save bar (#6413, then
  #6414, X16).
- **Primitives this set owns**, which other sets adopt: the segmented control
  in LX geometry and TH1 colours, app-wide (#6385, X17); locked mode
  (#6384); the icon toggle group and toolbar primitive (#6382;
  Voice's Light / Dark switch #6406 adopts it); the unsaved dot
  (#6387); the save-bar location and the LX phone layout (#6388);
  and the **shared device-frame preview** (#6390). Look adopts that
  preview in #6426; the onboarding wizard adopts it afterwards in
  #6332 (X21), with a readout of the chosen site address above the frame
  and without the reader switch or the follow control (§ 12.6). The W2
  boards' browser-chrome preview is not a target anywhere.
- #6291 (theme) gives every admin token a Dark value. The admin token chain is
  #6321 → #6288 → #6381 → #6403 → #6291, one at a time
  (`admin-theme.css`). #6381 adds Light values; the Dark values #6291
  writes for them are drawn on gap-theme-token-dark-values and recorded in § 5.
- #6297 (Look polish) is closed: PR #6302 shipped "each card is a group named
  by its title" (`Card` takes `aria-labelledby` and renders `role="group"`), so
  fields are announced with their card's name; #6391 keeps that when the
  cards become folding rows (each open row's body is a group named by the row
  title). #6302 left "the sample footer uses its phone layout at Mobile width"
  for a follow-up because it needed a `@blog/ui` `Footer` change; #6306 (issue
  #6304, merged 30 Oct) made that change — the `Footer` lays out by its
  container's width — so § 22 D-9b keeps only the Footer's top row and the post cards. § 22 D-41
  records this; nothing is asked of #6297.

**How tickets use this document.** Tickets do not copy the value tables below.
Each ticket names the sections and boards it builds, and its acceptance
criteria name every visible element and state, so nothing drawn can be left
out silently; the values live here once. A reviewer checks the build against
the board side by side, with the § 24 checklist.

## 1. Why

The Look page today is one long column of always-open cards beside a 50/50
text-toggled preview that lays the site out at whatever width the pane has.
Earlier admin redesigns shipped without parts that were drawn (the onboarding
stepper on W2 is the known case). This document therefore names every element,
every state and every value, and § 24 is a checklist a reviewer ticks against
the built page, frame by frame, side by side with the boards.

## 2. Goals and non-goals

Goals:

- One form: a **compact preset strip**, then a **Style** group (Colour, Brand,
  Type, Shape, Buttons) and a **Site parts** group (Header, Footer, Language
  switcher). Each card is a **folding row** that shows a one-line summary of its
  values while folded.
- A **sticky jump index** listing both groups and their cards, scroll-spy,
  unsaved dots, and **Expand all**.
- A **device-frame preview**: the sample laid out at the true device width
  (1280 / 820 / 390 px) and scaled to fit, with an **icon toolbar** (device,
  colour scheme, reader, follow, full screen), every switch an icon button with
  an `aria-label` and a tooltip. The frame, its heading row and the Device and
  Colour scheme switches are one **shared preview** the onboarding wizard
  also uses (§ 12.6).
- **Follow**: opening or focusing a Site parts card scrolls the frame to that
  part and outlines it with its name.
- A **preset strip that scales** to any number of presets (frame LX-H).
- On a **Free** site: the **G2 Growth note**, collapsed by default and opening
  in place; **Growth badges** in place of the lock line; locked controls stay
  visible, `aria-disabled` and show the preset's value.
- A **phone** layout (390) for every region.

Non-goals:

- The app shell: sidebar, workspace switcher, top bar and account menu. They
  follow SH1 in TH1 colours and belong to the shell set; § 6.1 lists them only
  so a reviewer does not flag them as missing from this set.
- G2's own page layout (stacked section cards, tiles, text preview toggles,
  Kitchen Table Recipes sample, G2-7 long page, G2-10): superseded by LX.
- G2-8 "Operator viewing a Free tenant" and G2-9 "Downgraded tenant": not on
  any LXG board. Out of scope (§ 22 D-4, § 25).
- Hypothetical presets (LX-H names 3–12): drawn to test the scaling rule only;
  they appear in test fixtures and local manual-test setups, never in the registry (§ 22 D-3).
- The admin Dark theme itself (#6291). This set's new tokens carry their Dark
  values (§ 5), and the preview's own Light / Dark switch is in scope.
- PV2 E (busy drawing while Buttons is edited): superseded; the LX sample
  always shows one static busy button (§ 14).

## 3. Precedence

0. **The 30 Oct precedence rule** (approved by the user). Shell structure
   comes from SH1; colour and tokens from TH1 (control borders `#878f9d`,
   popover tokens, the gapped focus ring, the Light / Dark palettes); cards,
   status pills and the page heading from dashboard layout B; the tooltip
   takes layout B's look and opens after Base UI's hover delay, at once on
   keyboard focus. The Look page itself is LX, LXG where it differs, and G2
   for the Growth note. Where an LX, LXG or G2 board draws a value the rule
   assigns elsewhere (every `#818a99` border, the 400 ms tooltip with an
   arrow, the dark sidebar), the rule wins and this document states the rule's
   value.
1. **LX** is the layout.
2. **LXG** is LX on a Free site; it wins over G2 everywhere **except** the
   Growth note and its disclosure, where **G2** is the source (task context,
   30 Oct). § 15.1 lists every value where the two differ so a reviewer does not
   flag the G2 values.
3. **PV2** is reference for the device frame only. Where PV2 and LX differ
   (bezel, browser bar height, part chip, frame border), LX wins.
4. LX-G draws an older lock-icon badge (`.gbadge`), the lock line "Fields
   marked Growth keep your preset's value." and the Language switcher summary
   "Not shown with one language". LXG replaces all three (text-only `.gb`
   badge, "… keep the Editorial preset's value.", "… · One language"). LXG
   wins; LX-G is a source only for what LXG does not redraw (the 520 + 600
   Free layout with Footer open).
5. Where neither LX nor LXG draws an element open and G2 desktop does (Free
   locked fields on Colour, Shape and Header — § 15.5), G2 desktop is the
   source for **which fields carry a badge and the locked control's value**;
   the field, badge and control styling stay LX / LXG.
6. The app shell drawn on every board (sidebar, workspace switcher, top bar,
   account) belongs to the shell set and is never compared by this set's
   checks (§ 6.1, § 24).
7. **Gap boards** (GF, GC, GS, GO, GW) were drawn after the chosen boards for
   the states those left out. They settle those states. They copy the LX
   shell and sample, so where they repeat a value item 0 replaces, item 0
   still wins. GS-B's second phone frame draws illustrative folded summaries
   ("Rounded · Comfortable", "Solid · Pill"); § 9.3's rule governs them.

## 4. Frames and breakpoints

| Frame  | Size / width          | What it shows                                                                                                  |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| LX-D   | 1440×1290, shell 1060 | Paid site, Desktop preview, Footer open, 1 unsaved change (Background), following Footer.                      |
| LX-A   | edit 520, preview 600 | Phone selected, Footer open; frame scrolled to the footer; "Top of page".                                      |
| LX-B   | 426 + 426             | Phone selected, Header open; frame back at the top; "Show on Desktop" hint.                                    |
| LX-C   | 426 + 426             | Tablet selected, Header open; tablet frame fits one screen; outline only.                                      |
| LX-D2  | 426                   | Phone, Footer open, frame scrolled by hand; Follow off, paused status with "Back to Footer". (Board letter D.) |
| LX-E1  | 390×844               | Phone Look page, Edit tab: index chips, Site parts, Footer open, sticky unsaved bar.                           |
| LX-E2  | 390×844               | Phone Look page, Preview tab: one row of 44 px switches, readout + follow + full screen, phone frame at 62%.   |
| LX-F   | card 560              | Keyboard focus on the icon toolbar: Tablet focused with tooltip; Dark focused with tooltip.                    |
| LX-G   | 520 + 600             | Free plan, Footer open (badge style superseded by LXG).                                                        |
| LX-H   | 500 / 460 / 390 cells | Preset strip with 2, 5 and 12 presets at 1440, 1280 and phone; picker open (desktop popover, phone sheet).     |
| LXG-D  | 1440×1454, shell 1204 | Free site, desktop: note collapsed, Type open, Desktop preview at top.                                         |
| LXG-A  | 560                   | Note expanded — the Growth card opens in place.                                                                |
| LXG-C  | 560                   | Folded overview — one badge per all-Growth row.                                                                |
| LXG-B  | 520 + 600             | Site parts — Footer open, Phone preview following to the footer.                                               |
| LXG-D2 | 390×844               | Phone, Edit tab, first view. (Board letter D.)                                                                 |
| LXG-E  | 520                   | Keyboard focus order through the note.                                                                         |
| LXG-F  | flex                  | Language switcher on Free.                                                                                     |
| G2-1…6 | desktop / 390 phone   | Note collapsed, expanded, focus, phone collapsed, phone expanded, locked-field anatomy.                        |
| GF-A   | 1440×900              | Full-screen dialog opened from the keyboard: Desktop at 100%, focus and tooltip on the pressed Desktop button. |
| GF-B   | 1440, head only       | Tab past the toolbar lands on Close; end-aligned tooltip "Close full screen".                                  |
| GF-C   | 390×844               | Full screen on a phone: Phone at 91%, focus on the pressed Phone button.                                       |
| GF-D   | 390×844               | Full screen on a phone: Desktop at 100%, panned both ways; Close focused.                                      |
| GC     | 1440×3980             | Every row open after Expand all; the index button reads "Collapse all"; Preset current; Footer unsaved.        |
| GS-A   | 1440                  | Colour, Type and Footer unsaved: "4 unsaved changes in 3 cards".                                               |
| GS-B   | 390×844, two frames   | The same changes on the phone Edit tab: Footer open, then every card folded.                                   |
| GS-C   | strip                 | The bar for 1 card, 1 card with several changes, 2 cards and 6 cards, desktop and phone.                       |
| GO-A   | 1440                  | First load: every row folded, Preset current, Desktop frame at the top, nothing outlined.                      |
| GO-B   | 1440                  | Desktop, Header opened first: the frame does not move; outline and tag only.                                   |
| GO-C   | two columns, Phone    | Follow off, Footer open: nothing scrolls, nothing outlined.                                                    |
| GO-D   | two columns, Phone    | After Top of page: following paused, "Back to Footer".                                                         |
| GO-E   | 1440                  | Footer, then Language switcher: frame back at the top, header outlined, tag "Language switcher".               |
| GW-A   | 1024, sidebar open    | Content area 704: Edit tab, desktop index scrolled to the current Footer with fades at both ends, save bar.    |
| GW-B   | 1024, sidebar open    | Preview tab: the desktop toolbar and a 670 px desktop frame at 52%.                                            |
| GW-C   | 1280, sidebar open    | Content area 960: two columns 460 + 24 + 476; the index just overflows (right fade only).                      |

| Range           | Layout                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two columns     | When the page's **content area** (the box right of the sidebar, inside its 28 px side padding) is at least **900 px** wide (§ 22 D-37, GW-C): edit column **500** fixed from a 1440 window, **460** below it (§ 22 D-12; states frames draw 520/600 and 426/426 as crops), gap **24**, preview `minmax(0,1fr)` (596 at 1440, 476 at 1280). Icon buttons 32 (§ 22 D-6), solo 34, chips 40, rows 52.                                                                                                                                                                                                                                                                                             |
| Tabs            | Content area under 900 px (every phone and tablet, and a 1024–1219 px window with the sidebar open — GW-A, GW-B): Edit / Preview tabs (44) in a tablist named "Look view". **Below `lg`**: the index is the sticky phone chip row (§ 7.2), rows two-line 56 (LX-E1), segmented options a 2-column grid of 44 px buttons, the save bar edge to edge below 768 (#6388; from 768 to 1023 it is #6413's docked bar, § 11), and the Preview tab puts every switch in one row of 44 px buttons (LX-E2). **From `lg`** (GW-A, GW-B): the desktop shell, visible page heading, desktop index bar (scrolling with fades, § 7.1), 32 px controls and desktop toolbar stay; only the columns become tabs. |
| Targets         | 44 px controls below `lg` (1024) and on touch (`pointer: coarse`), whichever layout is showing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Sample in frame | Lays out at the device width. The sample header switches at the site's `lg` (64 rem) by a container query on the frame's width (§ 22 D-9): 1280 the full header; 820 and 390 the bar (brand + account circle + menu). The `@blog/ui` Footer lays out by its own container's width (#6306), so inside the frame its groups grid and bottom row follow the device width; its top row (a column until the container reaches 64 rem) and the `@blog/ui` post cards: § 22 D-9b.                                                                                                                                                                                                                     |

## 5. Tokens

Colour and tokens follow TH1 (§ 3 item 0). Existing tokens the boards use,
with the Light values #6288 gives them: `bg` #f6f7f9, `surface` #fff,
`surface-2` #fbfbfd, `line` #e5e7eb, `line-2` #eef0f3, **`control-line`
#878f9d** (every `#818a99` the LX, LXG and G2 boards draw is this token, X14),
`control-line-tint` #7c8493 on grey grounds, `text` #12141a, `muted` #5b6472,
`faint` #8a93a3, `brand` #4f46e5, `brand-strong` #3730a3, `brand-weak`
#eef2ff, `brand-ink` (focus ring), warn #8a5f00 / #fbf3df, `popover` /
`popover-line` / `popover-hover`, `theme-track` #eef0f3, `shadow-admin`
(`0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)`),
`shadow-admin-lg` (`0 12px 40px rgba(16,24,40,.14)`), radius 6 / 4, text sizes
11–24. Their Dark values are #6291's.

**Indigo by role** (gap-theme-token-dark-values, Dark "Preview toolbar"
specimen). The boards write every indigo as a literal; each is a token by
what it does, so Dark follows the specimen: a **ring, outline or border**
that marks focus or a pressed, checked or selected state (the focus ring;
the inset ring of a pressed toolbar button, segmented option or solo; a
pressed solo's border; a checked preset chip's or option's border; the phone
segmented pressed border) is `brand-ink` (#4f46e5 Light, #a5b4fc Dark); the
**icon or text** of a pressed or selected control (`#3730a3`) is
`brand-strong` (#c7cdfd Dark); a **pressed solo's fill** (`#eef2ff`) is
`brand-weak` (#23244a Dark); a **fill that marks something** (the unsaved
dots, the open row's 3 px bar, the follow outline and tag, Ask about Growth)
is `brand` (#5850ec Dark). Wherever a section below writes `#4f46e5` for a
ring or border it means `brand-ink`, and for a fill `brand`.

Board values that map onto an existing TH1 token and get **no** new token
(gap-theme-token-dark-values, "Already in TH1"):

| Board value                           | Token                    | Light                          | Dark                        |
| ------------------------------------- | ------------------------ | ------------------------------ | --------------------------- |
| Toolbar and segmented track `#eef0f3` | `theme-track`            | #eef0f3                        | #0f1115                     |
| Popover border `#d0d4db`              | `popover-line`           | #e5e7eb                        | #4a5260                     |
| Popover shadow (two layers)           | `shadow-admin-lg`        | 0 12px 40px rgba(16,24,40,.14) | 0 12px 40px rgba(0,0,0,.55) |
| Sheet scrim `rgba(18,20,26,.45)`      | TH1 scrim                | rgba(10,12,15,.35)             | rgba(10,12,15,.35)          |
| Pressed toolbar button `#fff`         | TH1 checked theme button | #ffffff                        | #323845                     |
| Control borders `#818a99`             | `control-line`           | #878f9d                        | #737d8d                     |

New tokens (one ticket, #6381; names as gap-theme-token-dark-values
proposes them, `--admin-` prefix). #6381 adds the Light value; the Dark
column is the value #6291 writes for the same token:

| Token                  | Light                          | Dark                        | Role                                                                        |
| ---------------------- | ------------------------------ | --------------------------- | --------------------------------------------------------------------------- |
| `hover`                | #e2e5ea                        | #22262f                     | Icon-button hover                                                           |
| `note-line`            | rgba(79,70,229,.3)             | rgba(165,180,252,.3)        | G2 note border and panel divider                                            |
| `control-line-locked`  | #c5cad3                        | #424956                     | Locked control border                                                       |
| `frame-dot`            | #d5d9e0                        | #3a404b                     | Browser-bar dots                                                            |
| `frame-track`          | rgba(18,20,26,.08)             | rgba(232,234,239,.14)       | Frame scrollbar track; follows the preview's Light / Dark, not the admin    |
| `frame-thumb`          | #5b6472                        | #a3abb8                     | Frame scrollbar thumb; follows the preview's Light / Dark                   |
| `fade-end`             | rgba(246,247,249,0)            | rgba(15,17,21,0)            | Phone index fade end stop: the page ground (`bg`) at zero alpha             |
| `fade-end-surface`     | rgba(255,255,255,0)            | rgba(23,26,32,0)            | Desktop index fade end stop: `surface` at zero alpha (the bar is `surface`) |
| `shadow-admin-frame`   | 0 6px 20px rgba(16,24,40,.10)  | 0 6px 20px rgba(0,0,0,.45)  | Device frame                                                                |
| `shadow-admin-sheet`   | 0 -8px 24px rgba(16,24,40,.18) | 0 -8px 24px rgba(0,0,0,.55) | Bottom sheet                                                                |
| `shadow-admin-index`   | 0 1px 2px rgba(16,24,40,.05)   | 0 1px 2px rgba(0,0,0,.4)    | Jump index bar                                                              |
| `shadow-admin-unsaved` | 0 -4px 12px rgba(16,24,40,.08) | 0 -4px 12px rgba(0,0,0,.45) | Phone unsaved bar                                                           |
| font-weight 650        | —                              | —                           | Preview h2                                                                  |

| Radius | Role                                       |
| ------ | ------------------------------------------ |
| 2      | Sheet handle, sheet scroll thumb (§ 8.4)   |
| 3      | Segmented button, icon button, chip swatch |
| 5      | Icon track, solo icon button               |
| 8      | Tablet bezel inner radius (§ 12.3)         |
| 10     | Growth badge, count pill                   |
| 12     | Sheet top corners                          |
| 14, 18 | Tablet / phone bezel                       |
| 22     | Phone index chips                          |

Contrast pairs (gap-theme-token-dark-values, Light / Dark, WCAG 2.2): hovered
icon on `hover` 14.58 / 12.58; resting icon on the track 5.24 / 8.17; resting
icon on `hover` 4.74 / 6.55; pressed icon on its plate 9.93 / 7.60; pressed
ring 5.51 / 5.89; track border on the card 3.26 / 4.19; pressed solo icon
8.88 / 9.54; locked text on the page 5.58 / 8.17; focus ring on the track
5.51 / 9.48. Locked borders, the note border and the frame dots have no
minimum (disabled, or decoration).

`fade-end-surface` is not on gap-theme-token-dark-values: the desktop index
bar sits on `surface`, not the page ground, so its fades run from `surface`
to `surface` at zero alpha, and its Dark value is `surface`'s Dark (#171a20)
at zero alpha, which #6291 writes with the others. `fade-end` stays the phone
chip row's, on the page ground.

Not tokens: `#c7d2fe` (LXG's note border) is not built (§ 15.1). #6403
adds `brand-line` (#c7d2fe / #343a78) later in the token chain; `note-line` on
`brand-weak` renders 1.18:1 from it, so #6403 checks whether the two
merge. The 500 / 460 px edit column is a one-page layout value in
`look-form-variants.ts` (§ 6.2), not a theme token.

Typography: admin UI `Inter, system-ui, sans-serif`; mono `JetBrains Mono`
500 (#6288); sample serif `Fraunces` (opsz 9..144, wght 500/600). Focus ring:
the one gapped ring (#6337, X13) — a 2 px gap in the ground's colour, then
a 2 px `brand-ink` ring — which is what the boards draw as "2px `#4f46e5`,
offset 2"; rows draw it inset (offset −2, radius 4).

## 6. Page frame

### 6.1 Shell (context only — shell set)

The shell around every frame is SH1's in TH1 colours (gap-shell-sh1-in-th1,
shell set): the grey 264 px sidebar with the account menu at its foot; a
sticky, translucent top bar 59 px tall from `md` (67 px on a phone) holding the
Collapse sidebar toggle first and then the breadcrumb "Field Notes › Look";
on a phone, the 44 px Menu button with the account at the Menu's foot. The LX,
LXG and G2 boards draw an older dark sidebar, a 68 px top bar with the account
at its right and a 56 px phone top bar with "Open navigation"; those drawings
are context only. Nothing here is built by this set, and the shell is excluded
from every board comparison (§ 3 item 6): the reviewer compares from the
content area's top-left corner (desktop: the h1; phone: the tablist)
downwards. Sticky offsets below read the top bar's height token, never a
number.

### 6.2 Title and columns

| Element     | Value                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| content     | padding **26 28**, flex column, gap **18** (title → index → columns)                                                    |
| h1          | "Look", 24px / 32px, 600, margin 0, on the page bg `#f6f7f9`, no white band (#6357's page heading, X19)                 |
| subtitle    | "Theme this site. The preview shows your changes — nothing is live until you save.", margin 4 0 0, 13.5 / 20, `#5b6472` |
| columns     | flex, gap **24**, align start                                                                                           |
| edit column | width **500**, flex column, gap **20**                                                                                  |
| preview     | `section aria-labelledby=<h2 id>`, width 596 at 1440 (flex remainder), flex column, gap **12**, sticky (below)          |

Sticky stacking (desktop, the window scrolls as today):

- Jump index: `position: sticky`, top = the admin top bar height
  (`top-admin-topbar`), z-index 20 (above rows and the preview, below the
  tooltip's 30 and the save bar), on the page bg so rows never show through.
- Preview column: sticky, top = top bar + the index bar's height (46: padding
  6 + 32 + 2 × 1 border) + the 18 content gap, so the preview never slides
  under the index; its max-height shrinks by the same 64 px (today
  `calc(100dvh-160px)`).
- Save bar room (§ 22 D-40): the desktop unsaved bar is #6413's
  docked bar (§ 11), 64 px tall at the window's bottom edge across both
  columns, so the preview column's max-height also leaves **80 px** at the
  bottom (the 64 px bar + a 16 px gap) **at all times**, dirty or not, so the
  status line, "Back to {part}" and "Top of page" are never under the bar and
  the frame's scale never jumps when the form turns dirty. (LX-D's 92 px
  came from its floating bar, ≈ 60 + a 16 bottom offset + 16, which the
  docked bar supersedes.)
- Page bottom padding is not Look's: from 768 it is #6413's (120 px on
  every settings page, 48 for an archived tenant), which lets the edit
  column's last row scroll clear of the bar; below 768 it is #6388's
  (§ 16 "Edit body").

Sticky stacking in the tabbed layout from `lg` (GW-A, content area under
900 px, the window scrolls):

- Tablist ("Look view", § 16): `position: sticky`, top = the top bar height
  (`top-admin-topbar`), z-index **21**, opaque white bar. Its height is
  **46** (44 px tabs + 2 × 1 px border).
- Jump index (desktop bar, § 7.1): `position: sticky`, top = top bar + **46**
  (the tablist's height), z-index **20**, so it stacks directly under the
  tablist and never over it. The 18 px content gap between them shows only
  before they stick; once both are stuck the index meets the tablist with no
  gap, so rows never show between them. The two-column rule above (index
  `top` = top bar height) does not apply in this layout.
- Edit tab only: on the Preview tab the index is hidden (§ 11) and the
  tablist alone sticks.

Phone (< lg): no visible h1 or subtitle (LX-E1, LX-E2, LXG-D2 draw the tablist
directly under the phone top bar; G2-4's visible title is G2 page layout,
superseded per § 3). The h1 stays as an sr-only heading (§ 22 D-28). In the
tabbed layout from `lg` the h1 and subtitle stay visible (GW-A, GW-B).

## 7. Jump index

### 7.1 Desktop (LX-D, LXG-D)

`<nav aria-label="Look sections">`, sticky (annotation 1; top and z-index in
§ 6.2), above both columns.

| Element      | Value                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| bar          | flex, align center, gap 4, padding 6, `#fff`, border 1px `#e5e7eb`, radius 6, shadow `0 1px 2px rgba(16,24,40,.05)`                      |
| `ul`         | flex, align center, gap 2, flex 1, min-width 0, no bullets                                                                               |
| card link    | `<a>` flex gap 6, height 32, padding 0 10, radius 4, 13px 500 `#5b6472`, nowrap; hover bg `#f6f7f9`, `#12141a`                           |
| current link | `aria-current="location"`, bg `#eef2ff`, `#3730a3`, 600                                                                                  |
| group link   | `<a>` to the group's section: height 32, padding 0 6 0 10, 11px 600, letter-spacing .06em, uppercase, `#5b6472`, nowrap; hover `#12141a` |
| divider      | 1×20 `#e5e7eb`, margin 0 4, inside `<li aria-hidden="true">`; one more free-standing before Expand all                                   |
| dirty marker | `.dot` (7×7 `#4f46e5`, `aria-hidden`) + sr-only ", unsaved changes" inside the link                                                      |
| Expand all   | ghost button: height 32, padding 0 10, 13px 600 `#3730a3`, "Expand all"; reads "Collapse all" once every row is open (GC)                |

Order: **Preset** · divider · **STYLE** · Colour · Brand · Type · Shape ·
Buttons · divider · **SITE PARTS** · Header · Footer · Language switcher ·
divider · Expand all.

States drawn: LX-D Footer current with dot; LXG-D Type current, no dots; GC
every row open, Preset current, Footer dot, "Collapse all"; GS-A dots on
Colour, Type and Footer; GW-A scrolled with both fades; GW-C right fade only.

Overflow (§ 22 D-37; drawn GW-A, GW-C): the items need about 840 px. When the
bar is narrower, the `ul` scrolls sideways inside it with no visible
scrollbar. Fades (`aria-hidden`, width 40; left `linear-gradient(to right,
surface, fade-end-surface)`, right `linear-gradient(to left, surface,
fade-end-surface)`: the bar is `surface`, so in admin Dark they run from
#171a20, never white) show at the left only once scrolled and at the right only while more lies
right. Expand all and its divider sit outside the scroller, pinned at the
right, so they never scroll away. The current link is scrolled into view
(GW-A: Footer, so both fades show); wheel, trackpad and arrow-key focus move
the list. Items never wrap or truncate. GW-C (1280 window, about 835 px for
the list): nothing scrolled, the right fade only, over Language switcher. From
about a 1300 px window everything fits and both fades go. In the tabbed layout
from `lg` (GW-A) the index keeps this desktop bar, directly under the tablist,
sticking at top bar + 46 under the tablist's z-index (§ 6.2, tabbed layout).

### 7.2 Phone (LX-E1, LXG-D2)

| Element      | Value                                                                                                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nav          | sticky below the tabs; relative, bg `#f6f7f9`, padding 10 0 10 16, border-bottom 1px `#e5e7eb`                                                                                                                   |
| `ul`         | flex, gap 6, overflow hidden (horizontal scroll), scrolled to keep the current chip visible (LX-E1 drawn at `margin-left:-560px`)                                                                                |
| chip         | `<a>` height 44, padding 0 14, border 1px `#878f9d`, radius 22, bg `#fff`, `#12141a`, 13.5px 500, nowrap                                                                                                         |
| current chip | bg `#eef2ff`, `#3730a3`, border `#4f46e5`, 600, `aria-current="location"`, dot + sr text when dirty                                                                                                              |
| group label  | `<li aria-hidden="true">` 11px 600 .06em uppercase `#5b6472`, padding 0 2 0 6 — **not** links on phone                                                                                                           |
| fades        | `aria-hidden`, absolute, width 40: left `linear-gradient(to right, bg, fade-end)` (`bg` #f6f7f9, the chip row's ground) when scrolled (LX-E1); right `linear-gradient(to left, …)` when more lies right (LXG-D2) |

Order as desktop, with **no Expand all and no dividers on phone** (LX-E1 and
LXG-D2 draw neither). LX-E1 current **Footer** with dot; LXG-D2 current
**Preset**, not scrolled; GS-B Colour, Type and Footer with dots. The tabs
stick under the top bar and the chip row under the tabs (§ 22 D-26): their
`top` is the top bar's height, then that plus the 44 px tabs.

### 7.3 Behaviour

- **Current link = the card being edited, not the topmost card in view.**
  Every drawn case says so: LX-D (Preset and every folded row on screen,
  Footer current because Footer is open), LX-E1 (Header above Footer in view,
  Footer current), LXG-D (Type open, Type current), LXG-D2 (nothing open,
  Preset current). The rule:
  1. The current card is the row the owner **last opened, focused (row
     button or any field inside it) or reached through the index**, as long
     as that row is still open.
  2. When that row folds, or no row is open (first load, after Collapse all,
     after Expand all before any row is touched), the current link is the
     **topmost card whose row is in view** below the sticky index, and it
     updates as the page scrolls — Preset at the top of the page.
  3. Group links (STYLE, SITE PARTS) are never current.
- Clicking a card link opens that row (if folded), scrolls to it, and moves
  focus to its row button; that row becomes current by rule 1.
- Expand all opens every row. The same ghost button then reads "Collapse all"
  (same size, colour and place, about 8 px wider; nothing else in the bar
  moves) and folds every row; as soon as any one row is folded by hand it
  reads "Expand all" again (GC). After Expand all, until a row is opened,
  focused or reached through the index, the current link follows rule 2
  (GC: Preset).
- LXG-E focus order: § 22 D-2 (decided 31 Oct: visual order, index then note).

## 8. Preset strip

### 8.1 Compact strip (LX-D, LX-A, LX-G, LXG-\*)

| Element         | Value                                                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| card            | `.card` + `role="radiogroup" aria-labelledby="preset-l"`; flex, align center, gap 12, padding 12 14, wrap                                                                                                                                             |
| header row      | flex 1 1 100%, align center, gap 12: column (flex 1, gap 2) of title + description, then Reset                                                                                                                                                        |
| title           | `#preset-l` "Preset", 14px 600                                                                                                                                                                                                                        |
| description     | "Sets accent hue, heading and body fonts, radius, and density.", 12.5px `#5b6472`                                                                                                                                                                     |
| Reset to preset | `btn-sec btn-sm`: height 32, padding 0 12, border 1px `#878f9d`, radius 4, `#fff`, 13px 600 `#12141a`. **Absent on every Free board** (LX-G, LXG-\*); newly hidden on Free, where today it shows whenever the accent hue diverges. Paid rule § 22 D-8 |
| chip            | `role="radio" aria-checked`; flex gap 8, height **40**, padding 0 12 0 6, border 1px `#878f9d`, radius 4, `#fff`, 13.5px 600 `#12141a`                                                                                                                |
| chip swatch     | `aria-hidden`, 28×28, radius 3, centred. Console: bg `#eef1f5`, ">\_" JetBrains Mono 600 11px `#12141a`. Editorial: bg `#f6efe4`, "Aa" Fraunces 600 15px `#3b2a14`                                                                                    |
| checked chip    | border 1.5px `#4f46e5`, `box-shadow: 0 0 0 3px #eef2ff`, trailing check 16, stroke `#4f46e5` 2.4, path `M5 12.5l4.5 4.5L19 7`                                                                                                                         |
| keyboard        | Arrow keys move between chips and select (radio group); Tab leaves                                                                                                                                                                                    |

Drawn: Console unchecked, Editorial checked.

### 8.2 Scaling rule (LX-H) — verbatim

"**Rule.** The preset strip is one row that never wraps: when every preset fits,
every preset is a chip (today's two always fit, phone included); when they do
not, it shows as many chips as fit in registry order, with the selected preset
always among them, then a More presets button that opens a grid of every
preset; below lg an overflowing strip becomes one Preset button that opens a
sheet."

| Element      | Value                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| row `.prow`  | flex 1 1 100%, align center, gap 12, nowrap, min-width 0; the radiogroup `.prg` flex gap 12 nowrap; chips flex none, never shrink or truncate                                                                                                                                                                                                                                            |
| More presets | flex none, inline-flex gap 6, height 40, padding 0 10 0 12, border 1px `#878f9d`, radius 4, `#fff`, `#3730a3` 13px 600; hover bg `#f6f7f9`; expanded bg `#eef2ff`, border `#4f46e5`; focus 2px `#4f46e5` offset 2. `aria-haspopup="dialog"`, `aria-expanded`, `aria-label="More presets, {n} more"`. Grid icon 16 stroke `#3730a3` 2 (four 6×6 rx1 squares at 4,4 / 14,4 / 4,14 / 14,14) |
| count pill   | `aria-hidden`, min-width 20, height 20, padding 0 6, radius 10, bg `#eef2ff`, `#3730a3`, 11.5px 600                                                                                                                                                                                                                                                                                      |
| phone button | `.psel`: flex 1 1 100%, min-height **56**, padding 8 10, gap 10, border 1px `#878f9d`, radius 4, `#fff`; expanded border `#4f46e5` + ring 3px `#eef2ff`. `aria-haspopup="dialog"`, `aria-labelledby` = label + value. Contents: swatch 32×32; name 14px 600 / description 12.5px ellipsis; "{n} presets" 12.5px `#5b6472`; chevron 18 `#5b6472`                                          |
| phone Reset  | full-width `btn-sec`, height 44, centred, under the chips / button                                                                                                                                                                                                                                                                                                                       |
| phone chips  | height 44 when all fit                                                                                                                                                                                                                                                                                                                                                                   |
| phone card   | the Preset card's padding is **12** below `lg` (LX-H phone cells), not § 8.1's 12 14                                                                                                                                                                                                                                                                                                     |

Cells drawn:

| Presets           | 1440 (edit 500)                       | 1280 (edit 460)              | Phone 390                                                                    |
| ----------------- | ------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| 2 (today)         | Console, Editorial✓, no button        | Console, Editorial✓          | chips h44 + Reset                                                            |
| 5                 | Console, Editorial✓, More presets "3" | Editorial✓, More presets "4" | `.psel` Editorial / "Serif, warm and magazine-like." / "5 presets" + Reset   |
| 12, Almanac (5th) | Console, Almanac✓, More presets "10"  | Almanac✓, More presets "11"  | `.psel` Almanac / "Classic serif, dense and orderly." / "12 presets" + Reset |

### 8.3 Picker — desktop popover (LX-H "Picker open")

`role="dialog" aria-labelledby="pk-t"`, absolute under the strip, left 14 right
14 (as wide as the edit column), bg `popover` (#fff), border 1px
`popover-line` (#e5e7eb; LX-H draws `#d0d4db`), radius 6, `shadow-admin-lg`
(TH1 popover tokens, X7). Header padding 14 16 10, space-between: "Choose a preset" 14px
600 / "12 presets" 12.5px `#5b6472`. Listbox `role="listbox"
aria-activedescendant tabindex="0"`, 2-column grid `minmax(0,1fr)`, gap 6,
padding 0 10 10, outline none. Option: flex gap 10, min-height **64**, padding
8 10, border 1px `#878f9d`, radius 4, `#fff`; hover bg `#fbfbfd`, border
`#5b6472`; selected border 1.5px `#4f46e5` + ring 3px `#eef2ff` + check;
keyboard focus outline 2px `#4f46e5` offset 2. Option = swatch 36×36 + name
13.5px 600 + description 12.5px / 17px `#5b6472`.

Options in registry order (3–12 hypothetical, test fixtures only):

| #   | Name       | Swatch bg / fg        | Glyph                  | Description                                  |
| --- | ---------- | --------------------- | ---------------------- | -------------------------------------------- |
| 1   | Console    | `#eef1f5` / `#12141a` | JetBrains 600 11 ">\_" | Mono, precise and technical.                 |
| 2   | Editorial  | `#f6efe4` / `#3b2a14` | Fraunces 600 15 "Aa"   | Serif, warm and magazine-like.               |
| 3   | Journal    | `#eaf3ee` / `#1f3b2e` | Inter 600 14 "Aa"      | Clean sans, airy and personal.               |
| 4   | Studio     | `#efecfa` / `#2e1f5c` | Inter 800 14 "Aa"      | Bold grotesk and big headings.               |
| 5   | Almanac    | `#f3efe6` / `#3a3226` | Georgia 500 15 "Aa"    | Classic serif, dense and orderly. (selected) |
| 6   | Gazette    | `#f0f0f0` / `#111111` | Georgia 700 15 "Aa"    | Newspaper columns, tight and busy.           |
| 7   | Atelier    | `#fbeee7` / `#5a2a17` | Fraunces 500 15 "Aa"   | Soft corners and warm neutrals.              |
| 8   | Ledger     | `#ecf1f6` / `#1d2b3a` | JetBrains 600 11 "0.0" | Tabular figures, plain and exact. (focused)  |
| 9   | Notebook   | `#fbf4dd` / `#4a3b12` | Georgia italic 500 15  | Relaxed spacing, an informal feel.           |
| 10  | Broadsheet | `#ececec` / `#1a1a1a` | Fraunces 600 15 "Aa"   | Large serif headlines, sharp edges.          |
| 11  | Zine       | `#fce6ee` / `#6b0f2e` | Inter 800 14 "Aa"      | Loud colour and compact cards.               |
| 12  | Harbour    | `#e6f0f7` / `#12354f` | Inter 500 14 "Aa"      | Muted blues and generous spacing.            |

### 8.4 Picker — phone sheet (LX-H)

Scrim absolute inset 0, the TH1 scrim `rgba(10,12,15,.35)` (LX-H draws
`rgba(18,20,26,.45)`). Sheet `role="dialog"
aria-modal="true" aria-labelledby="sh-t"`: absolute left/right/bottom 0,
max-height 85%, bg `#fff`, radius 12 12 0 0, shadow `0 -8px 24px
rgba(16,24,40,.18)` (`shadow-admin-sheet`), column, overflow hidden. Handle 36×4 radius 2 `#878f9d`,
margin 8 auto 0. Header padding 6 8 6 16: "Choose a preset" 16px 600 + Close
44×44, border 0, transparent, `aria-label="Close"`, X 20 stroke `#12141a` 2
(`M6 6l12 12M18 6L6 18`), tooltip "Close". Listbox border-top `#eef0f3`; row:
flex gap 12, min-height **64**, padding 8 16, border-bottom 1px `#eef0f3`;
selected bg `#eef2ff` + `inset 3px 0 0 #4f46e5` + check. Row contents are the
popover option's (LX-H phone cells): swatch 36×36, then a column (gap 2) of
the name 13.5px 600 `#12141a` and the description 12.5px / 17px `#5b6472`.
Scroll thumb right 3, top 6, width 4, height 58%, radius 2, `#878f9d`.

### 8.5 Picker behaviour — verbatim bullets (LX-H)

1. "The strip is one row that never wraps. Width is measured on resize, so the same 5 presets show two chips at 1440 and one at 1280. Chips never shrink or truncate to squeeze one more in."
2. "Chips keep registry order. The selected preset is always a chip: when it falls past the cut it takes the last chip slot, and the order of the others does not change."
3. "More presets sits after the radio group, outside it, so Arrow keys move only between chips and Tab reaches the button next. Its name says how many are hidden: "More presets, 10 more"."
4. "The picker is a popover dialog under the strip, as wide as the edit column, so the preview stays in view. Focus starts on the selected preset."
5. "Arrow keys move through the grid in both directions, Home and End jump to the ends. Enter or Space chooses and closes. Choosing works like a chip: it re-applies that preset to the form, and nothing is live until Save changes."
6. "Escape, Tab out, or a click outside closes with no change and returns focus to More presets; after a choice focus lands on the chosen chip."
7. "Focus is the 2 px indigo outline; selected is the ring plus the check, so neither rests on colour. Descriptions are 6.0:1 on white, option and button borders 3.5:1."
8. "Phone: the Preset button is 56 px tall, each sheet row 64 px. The sheet is modal, scrolls past 85% of the screen height, and closes with the Close button, Escape or a swipe down."

## 9. Groups and folding rows

### 9.1 Group

| Element     | Value                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| section     | `<section aria-labelledby="g-style">` / `"g-parts"`                                                                                     |
| group label | `<p id>` "Style" / "Site parts": margin 0 0 8 2, 11px / 14px 600, letter-spacing .06em, uppercase, `#5b6472`; it also labels the `<ul>` |
| list        | `<ul aria-labelledby>` as a `.card` (bg `#fff`, border 1px `#e5e7eb`, radius 6, `shadow-admin`); `li + li` border-top 1px `#eef0f3`     |

Order: **Style** = Colour, Brand, Type, Shape, Buttons. **Site parts** =
Header, Footer, Language switcher. (Today: Preset, Colour, Type, Shape,
Header, Buttons, Footer, Brand, Language switcher.)

### 9.2 Row (desktop)

`<h3 class="rh">` (margin 0) > `<button aria-expanded aria-controls=<body id>>`:

| Element     | Value                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| button      | width 100%, flex, align center, gap 12, min-height **52**, padding 0 16, weight 400; hover bg `#fbfbfd`; focus outline 2px `#4f46e5` offset −2, radius 4 |
| chevron     | 16, stroke `#5b6472` 2; folded `M9 6l6 6-6 6` (points right), open `M6 9l6 6 6-6` (points down)                                                          |
| title       | flex none, width **132**, flex gap 8, 14px 600 `#12141a`; holds the row dot when dirty                                                                   |
| row dot     | `.dot` 7×7 `#4f46e5`, `role="img" aria-label="Unsaved changes"`                                                                                          |
| summary     | flex 1, min-width 0, ellipsis nowrap, 13px 400 `#5b6472`, flex gap 8; **empty when the row is open**                                                     |
| trailing    | optional Growth badge (Free, § 15.4)                                                                                                                     |
| open `li`   | bg `#fff`, `box-shadow: inset 3px 0 0 #4f46e5`                                                                                                           |
| body        | id = `aria-controls`; padding **2 16 18 44**, flex column, gap **16** (indent 44 aligns under the title)                                                 |
| description | first child of the body, margin 0, 12.5px / 18px `#5b6472` (moved from today's card header)                                                              |

**Opening a row folds the others** (GO-E: opening Language switcher folds
Footer, and only Language switcher has `aria-expanded="true"`). Opening a
folded row — by its button, from the index, from the save-bar link or from a
Growth note link — folds every other open row. Several rows are open at once
only after Expand all (GC); from there, folding a row by hand leaves the
others open, and opening a folded row again folds every other open row.
Collapse all folds every row. The shared accordion's `multiple` mode holds
the open set; Look applies this rule to it.

LX-B and LX-C (426 px cells) draw the open Header as a compact excerpt: a
plain card with a 14 px chevron, "Header" and a muted "· open", no `h3`, no
button. It is a crop of the § 9.2 row so the field fits the cell, not a
narrow-pane row style; nothing in it is built (confirm: § 22 D-31). In those
frames the open Header row is the ordinary § 9.2 row.

### 9.2a Initial open state

Every row is folded when the page loads, on every plan (§ 22 D-16: LXG-C
"every card folded"; drawn GO-A and LXG-D2). LX-D and LX-E1 draw the page
mid-edit, after the owner opened Footer.

### 9.3 Summaries (folded) — drawn values

| Row               | Paid (LX-D)                                                       | Free (LXG-D / LXG-C)                                                                                                               |
| ----------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Colour            | 14×14 swatch radius 3 `#0d6466` + "Hue 192 · logo follows accent" | same (phone swatch 12×12)                                                                                                          |
| Brand             | "Logo uploaded · No favicon"                                      | same                                                                                                                               |
| Type              | "Fraunces · Inter"                                                | "Fraunces · Inter" + badge                                                                                                         |
| Shape             | "Medium · Default · Accent bar · Outlined"                        | "Small · Compact · Outlined · Outlined" + badge                                                                                    |
| Buttons           | "Busy label · Follow the preset"                                  | same + badge                                                                                                                       |
| Header            | "Classic · Full width · Dropdown · Pill with label"               | same + badge                                                                                                                       |
| Footer            | (open)                                                            | "Columns · Brand tint · Full width · Cookie button shown", no badge                                                                |
| Language switcher | "Menu with globe"                                                 | "Menu with code · One language" + badge (§ 22 D-7; LXG draws "Menu with globe · One language", LX-G "Not shown with one language") |

Summary rule: the current form values (unsaved edits included), option labels
(`lookForm.*OptionLabel`) joined by " · ", using **exactly these fields in
this order** — not every field of `CARD_FIELDS`, and not always its order:

| Row               | Parts, in order                                                                                                                                                            | Fields left out                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Colour            | 14×14 swatch of the accent; "Hue {accentHue}"; then "logo follows accent" when `logoHue` follows, else "Logo hue {logoHue}"                                                | —                                            |
| Brand             | "Logo uploaded" / "No logo"; "Favicon uploaded" / "No favicon"                                                                                                             | —                                            |
| Type              | `headingFont` name; `bodyFont` name                                                                                                                                        | —                                            |
| Shape             | `radiusScale`; `density`; `cardStyle`; `headerControlStyle`                                                                                                                | —                                            |
| Buttons           | `busyButtonStyle`; `spinnerStyle`                                                                                                                                          | —                                            |
| Header            | `headerLayout`; **`headerBarStyle`**; **`headerSubmenuStyle`**; `accountButtonStyle` (bar before sub-menus, as drawn: "Classic · Full width · Dropdown · Pill with label") | `accountPanelStyle`, `accountPhonePlacement` |
| Footer            | `footerLayout`; `footerBackground`; `footerSurface`; "Cookie button shown" / "Cookie button hidden"                                                                        | —                                            |
| Language switcher | `languageSwitcherStyle`; then "One language" when the site publishes one language                                                                                          | —                                            |

Strings not drawn ("Logo hue {hue}", "No logo", "Favicon uploaded", "Cookie
button hidden") follow the same pattern. On a site without reader accounts the
Header summary still names `accountButtonStyle` (the value is stored; the
board draws no other case). Free sites summarise the effective (preset) values
(§ 15.5). GS-B's second phone frame draws illustrative summaries; this rule
governs them (§ 3 item 7).

## 10. Fields inside open rows

| Element             | Value                                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| field               | flex column, gap **6**; children in this order: label, hint, control (LX-D, LX-B, LX-E1)                                                                                                                                                                                                      |
| label               | flex gap 8, 13px / 18px 600 `#12141a`; holds the field dot / Growth badge                                                                                                                                                                                                                     |
| field dot           | 7×7 `#4f46e5` `role="img" aria-label="Unsaved change"` (LX-D Background)                                                                                                                                                                                                                      |
| hint                | margin 0, 12.5px / 18px `#5b6472`                                                                                                                                                                                                                                                             |
| segmented           | `role="group"`, inline-flex, align-self start, padding 2, gap 2, bg `#f6f7f9`, border 1px `#878f9d`, radius 4, wrap                                                                                                                                                                           |
| segmented button    | `aria-pressed`; height 30, padding 0 12, radius 3, 13px 500 `#5b6472`                                                                                                                                                                                                                         |
| pressed             | bg `#fff`, `#12141a`, 600, `inset 0 0 0 1.5px #4f46e5`                                                                                                                                                                                                                                        |
| segmented, two-line | when the options carry descriptions (Shape › Header buttons, GC): each button padding 6 10, max-width 146, flex column, align start, gap 2, text left; label 13px / 18px; description 11.5px / 16px 400 `#5b6472`, inside the button. The field's hint stays one fixed line above the control |
| select trigger      | `aria-haspopup="listbox"`; align-self start, space-between, gap 12, min-width 220, height 36, padding 0 10 0 12, border 1px `#878f9d`, radius 4, `#fff`, 13.5px `#12141a`; chevron 16 (LXG 14) stroke `#5b6472` 2. Type font selects are full width                                           |
| text link `.lnk`    | inline-flex gap 6, 12.5px 600 `#3730a3`, underline offset 2                                                                                                                                                                                                                                   |

### 10.1 Footer (LX-D, LX-A)

Description "How the bottom of your site is arranged, its background, and a
floating way back to cookie settings."

| Field                  | Hint                                                                                                                   | Control (pressed)                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Footer layout          | "Where the brand, link groups and fine print sit. Compact shows no groups, about text or address."                     | segmented `aria-label="Footer layout"`: **Columns**, Centred, Compact, Big wordmark (today a dropdown) |
| Background + field dot | "The footer's colour. Each follows the reader's light or dark theme."                                                  | Plain, **Shaded**, Brand tint                                                                          |
| Surface                | "Whether the footer spans the page or sits as a card."                                                                 | **Full width**, Card                                                                                   |
| Cookie settings button | "A round button in the bottom-left corner that reopens cookie settings, once a reader has answered the cookie banner." | Hidden, **Shown**                                                                                      |

The existing banner-off note (`cookieSettingsButtonBannerOff`) stays.

### 10.2 Header (LX-B, LX-C)

Field "Layout" / "Where the logo, links and buttons sit on wide screens.
Phones always get the bar with a menu button." / select "Classic". When the
preview device is not Desktop, a note under it (12.5px, `#12141a`, flex wrap
gap 8): "The preview is on Phone, so it shows the bar with a menu button." /
"The preview is on Tablet, so it shows the bar with a menu button." +
"Show on Desktop", a `<button type="button">` styled as the `.lnk` text link
(LX-B and LX-C draw `<button class=lnk>`: it changes the device, it does not
navigate), with a monitor icon 14 `#3730a3`; it sets the preview device to
Desktop. The other Header fields are drawn open on GC: § 10.5.

### 10.3 Type (LXG-D)

Description "Each font is shown in its own face." Fields "Heading font" (value
in its own face, Fraunces 600 15px) and "Body font" (Inter 400 13.5px), full
width selects. Free state in § 15.

### 10.4 Language switcher (LXG-F)

Paid: unchanged controls, description "How the language switcher looks on
desktop, in the header and footer." Field "Style" (a new label, drawn on GC
and GO-E): Menu with code / Menu with globe / Compact codes. Free state in § 15.6.

### 10.5 Colour, Brand, Shape, Buttons and the other Header fields (GC)

Drawn open on gap-look-collapse-all (GC). Every string below is today's
`en.json` copy (`lookForm`, `logoHueField`, `assetUploadField`; GC's Strings
note), so none is new. Field anatomy is § 10's (label, hint, control, gap 6).

**Colour.** Description "Only the hue changes, so text stays readable."

| Field      | Hint                                                                     | Control                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accent hue | "Colours links, buttons and highlights across your site."                | a row, align center, gap **14**: a 40×40 radius-4 swatch of the accent (`aria-hidden`); the shared `HueSlider` (flex 1) — track 10 px, radius 5, a hue gradient (`oklch`, the real palette), `inset 0 0 0 1px rgba(16,24,40,.12)`; the range input sr-only, named by the label; then the mono readout "hue 192°" (`logoHueField.hueValue`), 62 px wide, flex none |
| Logo hue   | "Tints your wordmark. Follows the accent hue unless you choose another." | a `fieldset` with `legend` "Logo hue"; the shared `Switch` "Follow accent hue", label 13px `#12141a`, gap 8, checked track `brand`, white thumb. GC draws a 16 px native checkbox (accent-color `#4f46e5`); that control is not built — Logo hue is the Switch on every plan (§ 22 D-39). Unchecked, today's hue slider for the logo shows under it               |

GC's knob (20 px white, 2 px `#12141a` border, `0 1px 3px rgba(16,24,40,.25)`)
differs from the onboarding set's thumb (1 px `rgba(16,24,40,.12)` border, the
same shadow), which #6330 builds on the shared `HueSlider` for both pages.
The thumb is #6330's alone: the Look page shows whatever thumb #6330
ships, and no Look ticket builds or compares GC's knob (§ 22 D-43 is carried
by #6330). The slider track geometry above is #6393's. The 40×40
swatch is #6330's shared `AccentSwatch` at a 40 px size (radius 4), as
are the folded Colour row's 14×14 (desktop) and 12×12 (phone) swatches
(#6392); no Look ticket builds a swatch of its own.

**Brand.** Description "Images are used exactly as uploaded — nothing is
resized or cropped.", then the formats line "Logo: PNG, JPEG, WebP or SVG.
Favicon: a square image." (`brandFieldsHint`, hint style) 8 px under it.

| Field   | Label tag                      | Control                                                                                                                                                                                                                                                                        |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Logo    | "optional", 12px 500 `#5b6472` | asset row, align center, gap **12**: a 52×52 thumb (`surface-2` #fbfbfd, 1 px `line`, radius 4) showing the logo; then (wrap, gap 8) "Replace logo" (`btn-sec btn-sm` with a leading 14 px upload icon, stroke 2: `M12 16V4`, `m7 9 5-5 5 5`, `M4 20h16`) and "Remove" (ghost) |
| Favicon | "optional", 12px 500 `#5b6472` | the same row with an **empty** thumb (1 px dashed `control-line` on white, `aria-hidden`) and "Upload favicon" (`btn-sec btn-sm`, same icon)                                                                                                                                   |

No logo shows the empty thumb and "Upload logo" in the same row. The asset row
is an opt-in layout of the shared `AssetUploadField` (#6393); Email's
logo field keeps today's.

**Shape.** Description "Corners, spacing, and how cards and header buttons are
framed."

| Field          | Hint                                                                                                            | Control                                                                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radius scale   | "Corner roundness across every surface."                                                                        | segmented Small / **Medium** / Large / Extra large                                                                                                                                                                                            |
| Density        | "Spacing and control size."                                                                                     | segmented **Default** / Compact                                                                                                                                                                                                               |
| Card style     | "How post, topic and quote cards are framed across the site."                                                   | segmented **Accent bar** / Outlined                                                                                                                                                                                                           |
| Header buttons | "The language, theme, menu and Sign in buttons, at every screen size." (fixed; `headerControlStyleDescription`) | two-line segmented (§ 10): **Outlined** / "A thin outline around each button"; Soft / "A grey fill, no outline"; Plain / "No outline until hovered" — each option's own description inside its button (`headerControlStyleOptionDescription`) |

**Buttons.** Description "How buttons look while they work, and the spinner
they show."

| Field      | Hint                                                                                     | Control                                                               |
| ---------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| While busy | "What a button shows while it saves or sends. It keeps its place and stays full colour." | segmented **Busy label** / Label kept / Progress edge                 |
| Spinner    | "The spinner on your site's buttons and loading states."                                 | select trigger (§ 10, min-width 220, align start) "Follow the preset" |

**Header** (after Layout, § 10.2). Description "How the top bar of your site is
arranged and how its sub-menus open."

| Field                       | Hint                                                                                                                                            | Control (segmented)          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Sub-menus                   | "How a link with sub-items opens on wide screens."                                                                                              | **Dropdown** / Wide panel    |
| Bar                         | "Whether the bar spans the page or floats above it as a card."                                                                                  | **Full width** / Floating    |
| Account button              | "The control readers sign in with and open their account from, on wide screens. Phones follow the “On phones, the account sits” setting below." | **Pill with label** / Circle |
| Account panel               | "What the account button opens once a reader is signed in."                                                                                     | **Card** / Profile / Hub     |
| On phones, the account sits | "In the bar as a circle, or as the menu's last row."                                                                                            | **In the bar** / In the menu |

Free states of every field here: § 15.5.

## 11. Unsaved state

| Element                     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unsaved dot                 | 7×7 circle `#4f46e5` on every page that uses it (#6387; today 8px amber `bg-admin-warn`; § 22 D-11)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| bar                         | The shared save bar (X16). Its position, chrome and docked desktop form come from #6413 (V3a's docked bar); Look adds only the location and the LX phone layout (#6388). LX-D's floating values (absolute left 292 right 28 bottom 16, radius 6, `shadow-admin-lg`) are superseded where they differ. In the tabbed layout from `lg` it is the same docked bar — fixed from the sidebar's edge to the window's right edge, 64 tall, padding 0 26 (#6413) — on the Edit tab only (GW-A). GW-A draws LX's floating bar inset 28 px inside the content area (left 292, right 28, bottom 16, radius 6, `shadow-admin-lg`); that inset is LX-D's floating geometry and is superseded here as it is on LX-D, so no Look ticket builds a 28 px inset. |
| desktop content             | 13.5px, gap 8: dot · "{count} unsaved change(s)" (600) · location · kbd "⌘S / Ctrl+S" (Inter 12px `#5b6472`, border 1px `#e5e7eb`, radius 4, padding 2 6, bg `#fbfbfd`) · "Discard" (btn-sec) · "Save changes" (btn-pri)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| location, one card          | "in" (`#5b6472`) then the card's name as a link: 600, `brand` (#4f46e5), underlined, hover `brand-strong` (#3730a3) (the boards' global link style, LX-D, GS-C). It opens the row, scrolls to it and moves focus to its row button. Holds for one card with several changes too (GS-C: "1 unsaved change in Footer", "3 unsaved changes in Footer")                                                                                                                                                                                                                                                                                                                                                                                            |
| location, two or more cards | "in {cards} cards" as plain muted text (`#5b6472`, 6.3:1 on white): no link and no card names, so the bar never wraps (GS-A "4 unsaved changes in 3 cards"; GS-C "2 unsaved changes in 2 cards", "9 unsaved changes in 6 cards"). The dots in the index and on each row say which cards                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| phone bar                   | edge to edge at the bottom, no radius, `#fff`, border-top `#e5e7eb`, `shadow-admin-unsaved`, padding 10 16 14, gap 8: one 13px line (dot · count in **700** · location; the desktop count is 600), then a 2-column grid gap 8: Discard, Save changes, each height 44; no keyboard hint (LX-E1, GS-B, GS-C)                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| no location                 | a caller that passes no location shows today's line with no "in" and no link                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| hidden                      | a caller can hide the bar (Look: while the Preview tab is selected); #6388 adds the option, #6424 passes it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Save, Discard and ⌘S / Ctrl+S act on every card at once.

Phone layout scope (§ 22 D-11, X16): the LX phone layout (edge to edge,
Discard and Save changes as two 44 px columns, no keyboard hint) is the shared
bar's layout **below 768** on every settings page that uses it except Voice,
whose phone footer has no Discard (#6414). From 768 every settings
page, Look included, shows #6413's docked bar; from 768 to 1023 that
bar hides the shortcut hint and stacks its error content (#6413), so
768 is the one switch-over for the shared bar and no two tickets draw a
different bar in the same range. The location is opt-in. Bottom padding
below 768 on those pages is #6388's: 120 px while the bar shows, 24
when it does not (hidden, clean or archived) — LX-E1, LXG-D2.

**Preview tab** (phone LX-E2, and a 1024 window GW-B): no unsaved bar and no
index, both hidden while the Preview tab is selected and back on Edit. The
Preview tab shows no other unsaved marker (none drawn; GW-B notes the tab bar
dot is neither drawn nor proposed); Save is reached from Edit.

## 12. Preview

### 12.1 Heading row

flex, baseline, space-between, gap 12. `<h2 id>` margin 0, 15px, weight 650:
"Live preview" (LX-D, LX-A, LX-G, LXG-\*) or "Preview" (LX-B, C, D2).
Readout `role="status"`, JetBrains Mono 12px `#5b6472`, nowrap:

| Device  | Long form (≥ lg wide pane)    | Short form (narrow pane / phone tab)              |
| ------- | ----------------------------- | ------------------------------------------------- |
| Desktop | "1280 px wide · shown at 44%" | —                                                 |
| Tablet  | —                             | "820 px · 48%"                                    |
| Phone   | "390 px wide · shown at 72%"  | "390 px · 72%"; phone tab "390 px · shown at 62%" |

The percentage is the live scale × 100, rounded to a whole number. Tablet in a
596 px pane (not drawn) reads "820 px wide · shown at 52%" (§ 12.3 rule);
Desktop in a 476 px section reads "1280 px wide · shown at 35%" (GW-C) and in
the 704 px Preview tab "1280 px wide · shown at 52%" (GW-B).

Which form shows: the boards draw the long form and "Live preview" in every
preview section 476 px or wider (GW-C at 476; LX-D, LX-A, LX-G, LXG-D, LXG-B
at 596–600; GW-B at 704) and the short form and "Preview" in every 426 px pane
(LX-B, LX-C, LX-D2). Switch-over (§ 22 D-25, confirm-only): the short form and
"Preview" when the preview section is under 476 px. On the phone Preview tab
the readout is "{width} px · shown at {percent}%" and there is **no visible
h2** (LX-E2); an sr-only h2 "Live preview" names the section (§ 22 D-28).

### 12.2 Toolbar

`role="toolbar" aria-label="Preview options"`, flex wrap, align center, gap 8.
One Tab stop; Arrow Left/Right move through every button, Home/End jump to the
ends; Tab leaves. Arrows stop at the ends (no wrap).

**Where Tab lands** (LX-F1 "Tab lands on the pressed device"): the first time
Tab enters the toolbar, focus goes to the **pressed button of the first group**
(Device) — Phone when Phone is pressed, never simply the first button. After
that the toolbar remembers the last button that had focus inside it, and Tab
(or Shift+Tab) back into the toolbar returns there. Pressing a button with
Enter or Space keeps focus on it. When the toolbar is re-rendered with a
different set of groups (reader group added or removed), the remembered stop
resets to the pressed device.

| Group / button     | Name (`aria-label`)                               | Tooltip                     | Icon (16, stroke 1.8)                                                                                                      |
| ------------------ | ------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| group              | "Preview device"                                  | —                           | —                                                                                                                          |
| Desktop            | "Desktop"                                         | "Desktop · 1280 px"         | monitor: `rect 3,4 18×12 rx1.5`; `M8 20h8M12 16v4`                                                                         |
| Tablet             | "Tablet"                                          | "Tablet · 820 px"           | `rect 5,3 14×18 rx2`; `M11 18h2`                                                                                           |
| Phone              | "Phone"                                           | "Phone · 390 px"            | `rect 7,3 10×18 rx2`; `M11 18h2`                                                                                           |
| group              | "Preview colour scheme"                           | —                           | —                                                                                                                          |
| Light              | "Light"                                           | "Light"                     | sun: circle r4 + rays `M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4` |
| Dark               | "Dark"                                            | "Dark"                      | moon `M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z`                                                                        |
| group              | "Reader" (omitted when reader accounts are off)   | —                           | —                                                                                                                          |
| Signed out         | "Signed out"                                      | "Signed out"                | user: circle 12,8 r4; `M4 21a8 8 0 0 1 16 0`                                                                               |
| Signed in          | "Signed in"                                       | "Signed in as Robin Hale"   | user-check: circle 10,8 r4; `M2.5 21a7.5 7.5 0 0 1 15 0`; `M16 11l2 2 4-4`                                                 |
| spacer             | `flex:1`                                          |                             |                                                                                                                            |
| Follow (solo)      | "Follow the card you are editing", `aria-pressed` | same, right-aligned tooltip | crosshair: circle r7, circle r2.5, `M12 2v3M12 19v3M2 12h3M19 12h3`                                                        |
| Full screen (solo) | "Open preview full screen", no `aria-pressed`     | same, right-aligned tooltip | `M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7`                                                                                   |

| Element       | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| track (group) | `role="group"` + aria-label; inline-flex, padding 2, gap 2, bg `theme-track` (#eef0f3), border 1px `#878f9d`, radius 5, flex none                                                                                                                                                                                                                                                                                                                                                                     |
| icon button   | 32×32 from `lg` (§ 22 D-6; the boards' CSS draws 30), radius 3, centred, `muted` (#5b6472); hover `text` (#12141a) on bg `hover` (#e2e5ea); pressed: the TH1 checked plate (#fff), icon `brand-strong` (#3730a3), `inset 0 0 0 1.5px` `brand-ink`; focus 2px `brand-ink` offset 2 (§ 5 "Indigo by role"; Dark: ring #a5b4fc, icon #c7cdfd)                                                                                                                                                            |
| solo button   | 34×34, border 1px `control-line` (#878f9d), radius 5, bg `surface` (#fff), icon `text` (#12141a); hover bg `hover` (#e2e5ea / #22262f Dark), border `control-line`, icon `text` (#12141a / #e8eaef) — gap-theme-token-dark-values draws "Open preview full screen" hovered in both themes; pressed bg `brand-weak` (#eef2ff / #23244a), icon `brand-strong`, border and `inset 0 0 0 1px` `brand-ink` (#4f46e5 / #a5b4fc)                                                                             |
| phone         | every icon and solo button 44×44                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| tooltip       | the shared Tooltip (#6370, X1): bg `#12141a`, `#fff` 12px / 1.5 500, padding 4 8, radius 4, `shadow-admin-lg`, 6 px below the trigger, no wrap, no pointer events; opens after Base UI's default hover delay and **at once** on keyboard focus; Escape hides it; `aria-hidden` (the button's aria-label carries the name). Follow, Full screen, Close full screen and Signed in align their tooltip to the trigger's end edge (LX's "right-aligned"). LX's arrow and 400 ms delay are superseded (X1) |

LX-F bullets, verbatim:

1. "One toolbar (role toolbar, labelled Preview options): Tab enters it once, Arrow Left and Right move through every button, Home and End jump to the ends, Tab leaves it."
2. "Enter or Space presses a button. In each group exactly one button is pressed (aria-pressed); the follow button toggles on and off."
3. "Every button has an aria-label. The tooltip shows on hover and on keyboard focus, after 400 ms on hover and at once on focus, and Escape hides it. It is aria-hidden, so the name is not read twice."
4. "Pressed is drawn three ways: white fill, indigo ring and indigo icon, so it never rests on colour alone. Resting icons are 5.3:1 on the track, the group border 3.5:1."
5. "32 px buttons from lg; 44 px below it and on touch." (§ 22 D-6 settles 32.)

Bullet 3's "after 400 ms" is superseded by Base UI's default hover delay (X1).

Phone Preview tab (LX-E2 markup): the `role="toolbar"` holds only the three
groups (Device, Colour scheme, Reader) and is one Tab stop with arrow keys
inside it. Follow and Full screen are **outside** the toolbar, in a separate
`span` beside the readout on row 2, so each is its own Tab stop after the
toolbar. The Signed-in, Follow and Full screen tooltips are right-aligned. On
desktop (LX-D, LX-F) and in the tabbed layout from `lg` (GW-B) the solos are
inside the toolbar after the spacer and the arrow keys reach them.

Shared and Look-only parts: the roving-focus toolbar, the Device and Colour
scheme groups and the end slot are the shared preview (#6390, § 12.6).
The Reader group (#6426), Follow (#6398) and Full screen
(#6399) are Look's.

### 12.3 Stage and device frames

Stage: bg `#eef0f3`, radius 6, padding **16** (phone Preview tab **10**), flex
centred, relative.

| Frame   | Chrome                                                                                                                                                                                                                                                                                                                                                                                                                                        | Viewport  | Content laid out at | Scale     |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------- | --------- |
| Desktop | border 1px `#878f9d`, radius 6, overflow hidden, `#fff`, `shadow-admin-frame` (`0 6px 20px rgba(16,24,40,.10)`). Browser bar: height 28, padding 0 10, gap 10, `#fff`, border-bottom `#e5e7eb`; three 8px dots `frame-dot` (#d5d9e0) gap 5 (`aria-hidden`); URL flex 1 centred, JetBrains 500 11.5px `#5b6472` = the site host ("fieldnotes.valstack.dev"), which a caller can leave out so the bar shows its dots only (§ 12.6); 39px spacer | see below | 1280×800            | see below |
| Tablet  | border 1px `#878f9d`, radius 14, padding 6, `#fff`, same shadow; inner radius 8, overflow hidden                                                                                                                                                                                                                                                                                                                                              | see below | 820×1180            | see below |
| Phone   | border 1px `#878f9d`, radius 18, padding 6, `#fff`, same shadow; inner radius 12                                                                                                                                                                                                                                                                                                                                                              | see below | 390×844             | see below |

**Chrome colours follow the admin theme** (gap-theme-token-dark-values, Dark
"Device frame"): the bezel and browser-bar fill is `surface` (#fff Light,
#171a20 Dark), the bar's bottom border `line` (#e5e7eb / #2b303a), the host
text `muted` (#5b6472 / #a3abb8) and the frame border `control-line` (#878f9d /
#737d8d). Only the scrollbar (`frame-track`, `frame-thumb`) follows the
preview's Light / Dark. The literals in the table above are the Light values
of those tokens.

**Scale rule** (§ 22 D-33; reproduces every drawn value). The frame fits by
width **and** height:

`scale = min(availableWidth / deviceWidth, availableHeight / deviceHeight)`

- `availableWidth` = the stage's inner width (stage width − 2 × stage
  padding) minus the bezel (tablet and phone: 2 × (6 padding + 1 border) =
  14).
- `availableHeight` in the two-column layout and on the Preview tab from
  `lg` = **608 px** (the tallest viewport the boards draw, LX-A); the frame
  never grows taller, whatever the pane width. On the phone Preview tab = the room left in the window under
  the top bar, tabs, rows 1–2 and the status line, with stage padding 10
  (523 px in a 390×844 window).
- Never above 1. Viewport size = device size × scale, both rounded to whole
  px; the readout percentage is the scale rounded.

| Device  | Pane (preview section) | Viewport | Scale  | Bound  | Board       |
| ------- | ---------------------- | -------- | ------ | ------ | ----------- |
| Desktop | 596                    | 564×352  | 0.4406 | width  | LX-D        |
| Desktop | 426                    | 394×246  | 0.3078 | width  | not drawn   |
| Tablet  | 596                    | 422×608  | 0.515  | height | not drawn   |
| Tablet  | 426                    | 394×566  | 0.48   | width  | LX-C        |
| Phone   | 600                    | 281×608  | 0.72   | height | LX-A        |
| Phone   | 426                    | 281×608  | 0.72   | height | LX-B, LX-D2 |
| Phone   | phone Preview tab 358  | 242×523  | 0.62   | height | LX-E2       |
| Desktop | 476 (1280 window)      | 444×278  | 0.3469 | width  | GW-C        |
| Desktop | Preview tab 704 (1024) | 670×419  | 0.5234 | width  | GW-B        |

- `role="img" aria-label="Sample page at {1280|820|390} px"` on the page.
  In full screen (§ 12.4) the frame has **no** `role="img"` and no name: the
  stage region carries "Sample page at {w} px", so the name is read once,
  never on two nested nodes (the board's inner `role="img"` is not built
  there).
- The scale is recomputed when the stage resizes (ResizeObserver) and the
  frame stays centred in the stage.
- The sample is **inert** (no clicks, no focus; links `tabindex="-1"`); wheel,
  trackpad and touch scroll the frame (LX-D2 note).
- The sample lays out at the device width without an iframe (§ 22 D-9,
  decided 30 Oct): the sample header switches by a container query on the
  frame's width at the site's `lg` (64 rem), so at 820 and 390 it is the bar
  (brand, account circle, menu) and the `isNarrow` prop goes. LX annotation 3
  argued for an iframe because `@blog/ui`'s Footer and MediaCard switch on
  viewport media queries. The Footer no longer does: #6306 (merged 30 Oct)
  lays its groups grid and bottom row out by its own container's width, so
  inside the frame those follow the device width. Its top row stays a column
  until the container reaches 64 rem (its padding is `@blog/ui`'s
  `px-gutter py-10`), and the post cards still switch on the viewport;
  § 22 D-9b (decided 31 Oct): they do not follow the frame now; an optional
  `@blog/ui` container-query follow-up is not filed. The post cards follow
  the admin window, and the Footer's top row and the post cards' columns are
  not built or compared at 820 and 390.
- Scrollbar (`aria-hidden`): absolute right 3, top 4, bottom 4, width 5, radius
  3, track `frame-track`; thumb radius 3 `frame-thumb`, top / height from the
  scroll position. Both follow the preview's Light / Dark, not the admin theme
  (§ 5). None when the sample fits (LX-C).

Drawn thumbs: LX-D top 14% height 86%; LX-A / LXG-B / LX-E2 top 22% height
78%; LX-B top 0 height 78%; LX-D2 top 30% height 78%; LXG-D top 0 height 86%.

### 12.3a Icon set used by this page

Every glyph is a 24-unit viewBox, `fill="none"`, `stroke="currentColor"` (or
the colour given), round caps and joins. This set adds no size and no glyph:
the sizes and the `strokeWidth` prop come from #6361 (10 / 12 / 14 / 15 /
17 / 20 px beside today's 16 / 18 / 24) and the glyphs from #6404
(resolutions § 2). This page needs:

| Size | Stroke | Where (board)                                                                                                                             |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 12   | 2.5    | Growth note button chevron down / up (G2-1, G2-2)                                                                                         |
| 14   | 2      | "Show on Desktop" monitor (LX-B, LX-C), "Back to Footer" crosshair (LX-D2), "Top of page" arrow (LX-A), LXG locked-select chevron (LXG-D) |
| 16   | 1.8    | Every toolbar icon (§ 12.2)                                                                                                               |
| 16   | 2      | Row chevrons (§ 9.2), status crosshair / pause (§ 12.5), More presets grid (§ 8.2), note info icon (§ 15.1), select chevron (§ 10)        |
| 16   | 2.4    | Preset chip and picker check `M5 12.5l4.5 4.5L19 7` (§ 8.1)                                                                               |
| 18   | 2      | Phone Preset button chevron (§ 8.2)                                                                                                       |
| 20   | 2      | Sheet Close X `M6 6l12 12M18 6L6 18` (§ 8.4)                                                                                              |

Glyphs that exist in the registry but are drawn differently on the boards
(§ 22 D-23, decided 31 Oct: the registered outlines stay):

| Key           | Board                                             | Registry today                                      |
| ------------- | ------------------------------------------------- | --------------------------------------------------- |
| GRID          | four 6×6 rx1 squares at 4,4 / 14,4 / 4,14 / 14,14 | four 8×8 rx1.6 squares at 3,3 / 13,3 / 3,13 / 13,13 |
| ARROW_UP      | `M12 19V5M5 12l7-7 7 7`                           | `M12 19 V5`, `M6 11 L12 5 L18 11`                   |
| CHEVRON_RIGHT | `M9 6l6 6-6 6`                                    | `M9 5 L16 12 L9 19`                                 |
| CHEVRON_DOWN  | `M6 9l6 6 6-6`                                    | `M5 9 L12 16 L19 9`                                 |

Keys: `ICONS.SUN`, `MOON`, `USER`, `PHONE`, `CHEVRON_UP` and `X` already
exist in `packages/config/src/constants/icon.ts` and are only registered in
the platform registry (by #6404). New keys, added by #6404: `DESKTOP`, `TABLET`, `USER_CHECK`,
`CROSSHAIR`, `MAXIMIZE`, `PAUSE`, `CHECK_STROKE`. The crosshair gets its own
key rather than reusing `TARGET`, because `TARGET` is a `FEATURE_ICONS` member
that `@blog/ui` renders with its own glyph, and one key must not mean two
shapes. `ICONS.CLOSE` keeps mapping to the error circle; the plain X is
`ICONS.X`. `INFO` already matches the board.

### 12.4 Full screen (gap-look-fullscreen, GF-A–GF-D)

The dialog is Look's: it lives under `components/features/look/` and is
built by #6399, after Follow (§ 22 D-20). The frame's full-screen fit
(width only, panning) and its horizontal scrollbar are `DeviceFrame`'s,
introduced with it by #6390, so #6399 edits no shared preview
file.

- **Opens from** "Open preview full screen": the solo at the end of the desktop
  toolbar (LX-D) and beside the readout on the phone Preview tab (LX-E2). The
  page behind is unchanged and comes back as it was.
- **Dialog**: `role="dialog"`, `aria-modal="true"`, named by its own "Live
  preview" heading. It covers the whole window — sidebar, top bar and save bar
  included; everything behind it is inert and the page does not scroll. No
  open or close animation.
- **Which head**: the dialog fills the window, so the head switches on the
  window width at `lg` (1024), like every other Look layout rule — the
  one-row desktop head from `lg`, the three-row phone head below it. The
  stage padding (24 / 10) switches with it. Target size follows § 4
  "Targets", not the head: from `lg` on touch (`pointer: coarse`) the
  one-row head stays and its toolbar buttons and Close are 44×44, which the
  60 px row holds; below `lg` they are 44×44 on every input. So a 1024 window
  shows the one-row head with 32 px buttons and a 34×34 Close (on a mouse),
  and the head needs at most about 830 px at 44 px targets with Reader shown,
  so it never wraps from `lg`.
- **Head, desktop** (GF-A, GF-B, from `lg`): one 60 px row — the heading, the readout (a
  polite live region), then the toolbar and Close at the right, split by a
  1 px `line` rule. Values: padding 0 16 0 24, gap 16, bg `surface` (#fff),
  border-bottom 1px `line` (#e5e7eb); the h2 "Live preview" is 15px / 20px,
  weight 650, `#12141a`, `white-space: nowrap` (the page's 15 / 650 with a
  fixed 20 px line-height, GF-A, GF-B); the toolbar does not wrap
  (`flex-wrap: nowrap`); the rule is an `aria-hidden` 1×24 span in `line`.
  Close sits **outside** `role="toolbar"`, in its own span, so arrow keys never
  reach it (GF-B note).
- **Head, phone** (GF-C, GF-D, below `lg`): three rows — heading and Close; the toolbar as
  one row of 44 px buttons; the readout. Close follows the toolbar in the DOM
  and a grid places it in the heading row. Values: grid columns
  `minmax(0,1fr) auto`, first row `minmax(44px,auto)`, column-gap 12, row-gap
  8, padding 8 16 10, bg `surface`, border-bottom 1px `line`; the h2 is 16px /
  22px 600 (not the page's 15 / 650); the readout spans both columns, line-height 18.
- **Stage** padding 24 from `lg`, 10 below it; border-radius 0, flex 1
  (fills the dialog under the head); the frame is aligned to the **top**
  (`align-items: flex-start`), not centred as on the page stage; the stage
  shows its own `:focus-visible` ring (2px `brand-ink` inset, offset −2).
- **No status line**: the status slot is not rendered in full screen (no card
  is followed; GF-A–GF-D draw none).
- **Horizontal scrollbar** while the frame pans (GF-D, Desktop on a 390 phone):
  `aria-hidden`, absolute left 4, right 12, bottom 3, height 5, radius 3,
  track `frame-track`, thumb `frame-thumb` (GF-D: width 29%), its left / width
  from the scroll position; the vertical one beside it keeps right 3. None
  when the frame does not pan.
- **Toolbar**: the page toolbar minus Follow — Device, Colour scheme and
  Reader (Reader only with reader accounts on). There is no card to follow,
  so the frame opens at the top of the page. It shares state with the page
  preview: a device or scheme picked here is still picked after closing.
- **Scale** (differs from § 12.3): fits by width only and never above 100%;
  the frame fills the height and scrolls. If fitting would drop under 50%
  (Desktop or Tablet on a phone) the frame shows at 100% and pans both ways,
  so the layout is read at size. 1440 window: every device 100% (GF-A: the
  1280 frame in the 1392 stage, scrolling its last 39 px). 1024 window:
  Desktop 76%, Tablet and Phone 100%. 390 phone: Phone 91% (GF-C), Tablet and
  Desktop 100%, panned (GF-D).
- **Focus**: opening moves focus to the pressed Device button, and its tooltip
  shows at once (GF-A, GF-C). Tab order inside, desktop and phone alike: the
  toolbar (one stop, arrow keys within), then Close, then the stage, then back
  to the toolbar. The stage is a named scroll region (`tabindex="0"`,
  `role="region"`, `aria-label="Sample page at {width} px"`), so arrow keys
  scroll and pan the frame; the sample's links and buttons stay inert. The
  device frame inside it has no `role="img"` and no name of its own (§ 12.3),
  so "Sample page at {width} px" is announced once. Escape
  or Close shuts the dialog and returns focus to Open preview full screen.
- **Close**: solo icon button, X 16 px stroke 1.8, 34×34 from `lg` and 44×44
  below it and on touch, `aria-label` and end-aligned tooltip "Close full screen"
  (new); the shared focus ring (GF-B, GF-D).

### 12.5 Status line

Under the frame: flex, align start, gap 8 10, wrap, 12.5px / 18px `#5b6472`;
icon margin-top 1; text `flex 1 1 300px`; bold part name `#12141a` 600; a
trailing button margin-top −7. Icon: crosshair 16 stroke `#3730a3` 2 while
following, pause 16 stroke `#5b6472` 2 (`M9 5v14M15 5v14`) when paused. It
replaces today's "Built from the site's own components. Nothing is live until
you save." See § 13 for the lines.

### 12.6 The shared preview and onboarding (X21)

The heading row (§ 12.1), the roving-focus toolbar with its Device and Colour
scheme groups (§ 12.2), the stage and device frames with the scale rule
(§ 12.3), the status slot (§ 12.5), the sample header's container-query switch
and the sample without its Newsletter specimen (§ 14) are **one shared
preview**, introduced by #6390 with nothing adopting it. Look adopts it
in #6426 and adds its Reader group, then Follow (#6398) and Full
screen (#6399). The onboarding wizard adopts it next (#6332,
onboarding set) in place of the W2 boards' browser-chrome preview, which
neither set builds.

What onboarding needs from the shared preview, drawn on
gap-onboarding-device-frame-preview, so #6390 provides it without
building any onboarding screen:

- An **end slot in the toolbar row**. Onboarding puts its "Site address
  {address}" readout there, right above the frame, wrapping under the 44 px
  buttons on a phone. Look puts its solos there, after the spacer.
- An option to **leave the host out of the desktop browser bar**, so the bar
  shows its dots only (onboarding shows the address once, in the toolbar row;
  Look keeps the host in the bar).
- The Reader group, Follow and Full screen exist only when a caller passes
  them, and the status slot can stay empty (onboarding: the frame opens at the
  top of the page).

The wizard's column widths, its scales (37% / 56% / 44% / 85%) and its sample
values (typed name, starter preset and accent) are the onboarding spec's.
The two pages do not share sample content: the Look preview renders
`LookSample` (`site-preview/look-sample/`, `lookPreview` copy) and the wizard
renders its own `FrontPageSample` (`site-preview/front-page-sample/`, its own
`frontPageSample` copy, three `MediaCard`s and the `lookPreview.readTimeChip`
chip) until #6332 deletes it and renders `LookSample`. What they share is the frame, toolbar, heading row and status slot
above, and the sample header's container-query switch (both samples render
`SampleSiteHeader`). #6397 changes `LookSample` only, so the wizard's
sample content is unchanged by it. The onboarding set's #6332 (after
#6426) switches the wizard to `LookSample`, deletes `FrontPageSample`
and, with it, the `readTimeChip` key and `SampleChip`, which nothing else
reads then.

## 13. Follow

Annotation 2, verbatim: "Opening or focusing a Site parts card scrolls the
frame to that part and outlines it with its name. Style cards change
everything, so the frame stays where it is. The crosshair button turns following
off; scrolling the frame by hand pauses it until you choose Back to the part."

| Rule                                                        | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site parts card opened/focused                              | Scroll the frame: Header → top; Footer → end; Language switcher → the header (where it renders; GO-E). Outline + tag. The outlined box for Language switcher is the header (`data-part="header"`); its tag and status name read "Language switcher", never "Header". On Tablet and Phone the switcher sits in the menu behind the bar; the bar is outlined the same way, tag "Language switcher".                                                                                                                                                                                                                                                                                                                         |
| Style card (Colour…Buttons)                                 | No scroll, no outline. Status: "Type changes the whole page, so the frame stays where it is. …" (LXG-D, {card} varies)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Header → Footer or back                                     | short smooth scroll; instant under `prefers-reduced-motion`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Sample fits (Tablet, LX-C)                                  | Outline only; status "Following **Header**. The sample fits one tablet screen, so following only outlines."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Manual scroll                                               | Pauses: Follow `aria-pressed="false"`, no outline/tag, status pause icon "You scrolled the frame. Following is paused." + btn-sec btn-sm (crosshair 14 `#12141a`) "Back to Footer", 44 px tall below `lg` and on touch (GO-D)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Back to {part} / another card                               | Resumes following                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Follow off                                                  | No automatic scroll, no outline; the frame stays where it is (GO-C). Pressing Follow again scrolls to the open Site parts card                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Expand all                                                  | Opening every row moves nothing in the frame and outlines no part; following resumes when a Site parts card is focused or reached through the index (GC)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Phone frame at the end                                      | **Phone only** (LX-A; LX-D draws the Desktop frame at the end with no button, and the Tablet sample fits). Ghost "Top of page" (arrow-up 14 `#3730a3`, `M12 19V5M5 12l7-7 7 7`), trailing in the status line, shown only while the Phone frame is scrolled to the end **and** the line is the "scrolled to the end" line — never with the "Following {part}" line, so not on the phone Preview tab and not while the reader line shows (LX-E2, LXG-B and LX-G draw the Phone frame at the end with no button); it scrolls the frame to the top (smooth, instant under reduced motion) and is hidden again once the frame leaves the end. Clicking it is a hand scroll: following pauses (paused line + "Back to {part}"). |
| Preview tab opened (phone, and the tabbed layout from `lg`) | the frame opens scrolled to the part of the last Site parts card open on Edit, outlined, with the matching status (LX-E annotation: "The frame opens at Footer, the last card open on Edit."; GW-B note 5: "Following still applies: the frame stays on the Footer the owner was editing in the Edit tab."); with no such card, at the top. Below `lg` the line is the short "Following {part}" (LX-E2); from `lg` (GW-B, a 1024 window) it is the full desktop line for the frame's state, e.g. "Following **Footer** — outlined in the frame. The whole sample nearly fits at 1280 px, so the frame scrolls only its last 120 px.", never the short form                                                                |

Outline on the part (`data-part="header|footer"`): `outline: Wpx solid
#4f46e5; outline-offset: -Wpx`, W = 2 / scale → always 2 screen px (4.5 @0.4406,
4.2 @0.48, 3.2 @0.62, 2.8 @0.72).

Tag: absolute left 0, bg `#4f46e5`, `#fff`, Inter 600, line-height 1, z 2,
text = the part name. Size = 11px font, 20px height, 7px horizontal padding,
3px radius, each ÷ scale (@0.4406: 25 / 45.4 / 15.9 / 6.8; @0.48: 22.9 / 41.7 /
14.6 / 6.2; @0.62: 17.7 / 32.3 / 11.3 / 4.8; @0.72: 15.3 / 27.8 / 9.7 / 4.2).
Footer tag sits **above** the footer (`bottom:100%`, top corners rounded);
Header tag hangs **below** the header (`top:100%`, bottom corners rounded).

Status lines drawn:

| Frame        | Line                                                                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LX-D         | "Following **Footer** — outlined in the frame. The whole sample nearly fits at 1280 px, so the frame scrolls only its last 120 px."                                                                                    |
| LX-A         | "Following **Footer** — scrolled to the end of the page." + "Top of page"                                                                                                                                              |
| LX-B         | "Following **Header** — back at the top of the page."                                                                                                                                                                  |
| LX-C         | "Following **Header**. The sample fits one tablet screen, so following only outlines."                                                                                                                                 |
| LX-D2        | "You scrolled the frame. Following is paused." + "Back to Footer"                                                                                                                                                      |
| LX-E2        | "Following **Footer**"                                                                                                                                                                                                 |
| LX-G / LXG-B | "Following **Footer**" + "Reader accounts are off for this site, so there is no reader switch."                                                                                                                        |
| LXG-D        | "Type changes the whole page, so the frame stays where it is. The sample uses the Editorial preset's values, the ones a Free site publishes." + "Reader accounts are off for this site, so there is no reader switch." |
| GO-A         | "Open a Site parts card and the frame scrolls to it."                                                                                                                                                                  |
| GO-B         | "Following **Header** — outlined in the frame."                                                                                                                                                                        |
| GO-C         | "Following is off. The frame stays where you leave it." (pause icon, no trailing button)                                                                                                                               |
| GO-D         | "You scrolled the frame. Following is paused." + "Back to Footer" (after Top of page)                                                                                                                                  |
| GO-E         | "Following **Language switcher** — back at the top of the page."                                                                                                                                                       |
| GC           | "Every card is open. Focus a Site parts card and the frame scrolls to it."                                                                                                                                             |

The reader line shows whenever the reader group is omitted, on any plan. It
is its own sentence, after the follow sentence.

**Status line rule** (§ 22 D-35; reproduces every drawn line, the gap
boards' included). Each line is **one full ICU message** with `{part}`
or `{card}` inside it (rendered with the part name bold via a rich-text tag),
never fragments joined in code, so de / es / fr / nl can reorder words.

| State                                                                                                                     | Message (en)                                                                                                                                                                                | Icon      | Trailing                                   | Drawn              |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------ | ------------------ |
| Following, Desktop, sample less than two device screens tall, frame moved                                                 | "Following {part} — outlined in the frame. The whole sample nearly fits at 1280 px, so the frame scrolls only its last {overflow} px." `{overflow}` = sample height − 800, rounded to 10 px | crosshair | —                                          | LX-D (120)         |
| Following, frame moved to the end (Phone, or Desktop with a taller sample)                                                | "Following {part} — scrolled to the end of the page."                                                                                                                                       | crosshair | Top of page (Phone)                        | LX-A               |
| (the same, on the phone Preview tab or with the reader line)                                                              | "Following {part}" (row below) — no Top of page                                                                                                                                             | crosshair | —                                          | LX-E2, LXG-B, LX-G |
| Following, frame moved to the top                                                                                         | "Following {part} — back at the top of the page."                                                                                                                                           | crosshair | —                                          | LX-B               |
| Following, frame did not need to move (part already in view, e.g. Header on first open)                                   | "Following {part} — outlined in the frame."                                                                                                                                                 | crosshair | —                                          | GO-B               |
| Following, the whole sample fits the device viewport                                                                      | "Following {part}. The sample fits one {device, select, DESKTOP {desktop} TABLET {tablet} other {phone}} screen, so following only outlines."                                               | crosshair | —                                          | LX-C               |
| Following, on the phone Preview tab (below `lg`; not the tabbed layout from `lg`), or whenever the reader line also shows | "Following {part}"                                                                                                                                                                          | crosshair | —                                          | LX-E2, LXG-B, LX-G |
| Paused (hand scroll, or Top of page clicked)                                                                              | "You scrolled the frame. Following is paused."                                                                                                                                              | pause     | "Back to {part}"                           | LX-D2, GO-D        |
| Style card open or focused (Colour, Brand, Type, Shape, Buttons)                                                          | "{card} changes the whole page, so the frame stays where it is."                                                                                                                            | crosshair | —                                          | LXG-D              |
| Free site, after any line above (own sentence)                                                                            | "The sample uses the {preset} preset's values, the ones a Free site publishes." — only with the Style-card line (as drawn)                                                                  | —         | —                                          | LXG-D              |
| Follow on, no row open (first load, Collapse all, the open Site parts row folded)                                         | "Open a Site parts card and the frame scrolls to it."                                                                                                                                       | crosshair | —                                          | GO-A               |
| Follow on, every row open after Expand all, none opened, focused or reached since                                         | "Every card is open. Focus a Site parts card and the frame scrolls to it."                                                                                                                  | crosshair | —                                          | GC                 |
| Follow off (button unpressed by the owner)                                                                                | "Following is off. The frame stays where you leave it."                                                                                                                                     | pause     | — (Follow's pressed state is the way back) | GO-C               |
| Reader group omitted (own sentence, after the line above)                                                                 | "Reader accounts are off for this site, so there is no reader switch."                                                                                                                      | —         | —                                          | LX-G, LXG-B, LXG-D |

"Moved" means the follow scroll changed the frame's scroll position; the
message is chosen when the scroll settles and stays until the next follow
event. Following Language switcher from Footer moves the frame, so it takes
the back-at-the-top clause (GO-E); opened first from the top it reads
"Following Language switcher — outlined in the frame.". Desktop sample height
is measured, never hard-coded. Status text `#5b6472` on the page ground clears
4.5:1; the bold part name is `#12141a`.

## 14. Sample site (inside every frame)

Root: width = device width, min-height = device height, bg `#fbfaf7`, text
`#1c1a17`, Inter, column. Values below are the drawn Field Notes sample with
the paid site's tokens (accent hue 192 → `#0d6466`); they come from the
tenant's real values at runtime.

### 14.1 1280

- `header[data-part=header]`: bg `#fff`, border-bottom `#e2dccf`; inner height
  72, padding 0 32, space-between gap 16. Brand: the tenant's uploaded logo
  (`BrandMark` with `logoSrc`) in a 32×32 box + "Field Notes" Fraunces 600
  20px ls −0.2px. The boards' 32×32 radius-8 `#0d6466` square with a white
  wave glyph (LX-D, GF-A, GC) is the seed's uploaded logo drawn as a stand-in
  image (GC's Brand thumb draws the same image), not a fallback. With no logo
  the sample shows `BrandMark`'s generated three-layer mark, as
  gap-onboarding-device-frame-preview draws it. Nav
  "Main" padding-left 24, links gap 20, 500 15px: "Posts", "About", "Topics"
  - chevron 14 `#5f584e`. Right group gap 8: language "EN" (h 40, border
    `#e2dccf`, radius 8, globe 16, chevron 14), theme 40×40 moon 16, "Sign in"
    pill (padding 0 12, radius 20).
- `main`: padding 56 32 48, gap 32, max-width 1120, centred. Hero (gap 14,
  max 640): h1 Fraunces 600 44px / 1.12 ls −0.5px "Reading the tide charts";
  p 17px / 1.6 `#5f584e` "A short dispatch on reading the water before you set
  out, and what the charts leave unsaid."; actions (wrap gap 10, padding-top
  6): "Subscribe" (h 40, padding 0 16, radius 8, 600 15px, `#0d6466` / `#fff`),
  "Read more" (padding 0 12, `#0d6466`, no bg), busy "Sending…" (`role="img"
aria-label="Send message, busy: Sending…"`, padding 0 16, gap 8, opacity .8,
  spinner 16). **No "4 min read" chip in the actions row.**
- `section aria-label="Latest posts"` gap 16: h2 Fraunces 600 22px "Latest
  posts"; 2-column grid gap 16 of `article` (bg `#fff`, border `#e2dccf`,
  border-left 3px `#0d6466` = Accent bar, radius 10, padding 20, gap 8): meta
  JetBrains 500 13px `#5f584e`; h3 Fraunces 600 20px / 1.25; p 15px / 1.55.
  Card 1 "12 Oct 2026 · 4 min read" / "Notes from the harbour" / "What the
  spring tides leave behind on the north quay." Card 2 "28 Sep 2026 · 4 min
  read" / "Charting the next season" / "Where the boats go when the harbour
  closes for winter." **No Newsletter panel.**
- `footer[data-part=footer]`: bg `#f3f0ea` (Shaded), border-top `#e2dccf`,
  padding 40 32 28, gap 28. Top row (space-between gap 40): brand column (mark
  28×28 radius 7 + "Notes on tides, harbours and the coast between." 14px /
  1.55); `nav aria-label="Footer"` gap 48: "Read" (Archive, RSS feed), "Site"
  (Team, Contact). Bottom row (border-top, padding-top 16): "© 2026 Field
  Notes" 13px; `nav aria-label="Legal"` gap 20: "Privacy policy", cookie icon
  14 + "Cookie settings".
- Floating cookie settings button when **Cookie settings button = Shown**:
  fixed to the **device viewport**, not to the page: drawn outside the
  scrolled sample content, so it stays at the viewport's bottom-left at every
  scroll position, Header open and frame at the top included (LX-A, LX-B,
  LX-C, LX-D, LX-D2, LX-E2, LXG-B). It scales with the frame (its sizes are
  sample px). Absent when Hidden. Values: absolute left 16 bottom 16 (sample px), 44 circle, `#fff`, border `#e2dccf`,
  shadow `0 4px 12px rgba(28,26,23,.14)`, cookie icon 20 stroke `#1c1a17` 2.
  `aria-hidden`.

### 14.2 820 (LX-C) and 390 (LX-A, B, D2, E; LXG-B)

The header and the platform-owned parts below switch on the frame's width by
container query (§ 12.3). The `@blog/ui` Footer lays out by its own
container's width (#6306), so its groups grid and bottom row follow the
frame; its top row below (a column until 64 rem) and the `@blog/ui` post
cards' columns are § 22 D-9b (decided 31 Oct: not now) and are not built or compared at 820
and 390.

| Part           | 820                                                                                                                                        | 390                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| header         | height 64, padding 0 32; account circle 40 (`aria-label="Sign in"`) + menu 40×40 radius 8 (`aria-label="Menu"`); no nav, language or theme | height 64, padding 0 16, same bar  |
| main padding   | 36 32 48                                                                                                                                   | 36 20 48                           |
| h1             | 38px                                                                                                                                       | 32px                               |
| cards          | 2 columns                                                                                                                                  | 1 column                           |
| footer padding | 40 32 28; top row a row, gap 40 (board value; not built, D-9b)                                                                             | 40 20 28; top row a column, gap 24 |

### 14.3 Free variant (LX-G, LXG-D, LXG-B draw the Editorial preset)

A Free site's sample renders the **selected preset's** values (the effective
look a Free site publishes), whichever preset that is — Console included. The
boards draw Editorial: buttons radius 4 (desktop Sign in pill keeps 20);
articles "Outlined" (no accent bar, radius 4, padding 16); footer "Brand
tint": bg `#e1efef`, borders `#b9d6d6`, secondary text `#3f4d4d`.

### 14.4 Header controls follow the tenant (§ 22 D-34)

The sample shows what the tenant's public site would show, not the board's
illustration, where they disagree:

- **Reader accounts off**: no "Sign in" pill at 1280 and no account circle at
  820 / 390 (today's sample already hides Sign in). LXG-D and LXG-B draw them
  on a Free site with reader accounts off; that drawing is not built.
- **One published language**: no language switcher in the sample header or
  footer, matching the public site's `showLanguageSwitcher`. LXG-D draws "EN"
  with a globe on a one-language site; that drawing is not built.
- With reader accounts on and two or more languages (the LX-D seed, § 24
  "Seed"), the header is exactly § 14.1.

## 15. Free plan (G2 note + LXG locking)

### 15.1 Growth note — collapsed (G2-1, G2 desktop; position from LXG-D)

First child of the edit column, above the preset strip, on every visit to a
Free site. No "Not now"; it never disappears for a Free site.

| Element   | Value (G2)                                                                                                                                                                                                                                                                                                             | LXG drew (not built)                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| container | radius 6, border 1px `note-line` (`rgba(79,70,229,.3)`), bg `#eef2ff`, `shadow-admin`, overflow hidden                                                                                                                                                                                                                 | border `#c7d2fe`, no shadow         |
| row       | flex wrap, align center, gap 12, padding 14 16                                                                                                                                                                                                                                                                         | padding 9 10 9 14, gap 8 10         |
| icon      | info 16 stroke `#4f46e5` 2 (circle r9; `M12 11v5M12 8h.01`), align-self start, margin-top 2, `aria-hidden`                                                                                                                                                                                                             | centred                             |
| text      | block, min-width 200, flex 1: `strong` 13.5px 600 `#12141a` "More options come with Growth"; line 12.5px / 1.5 `#5b6472` "Options marked [Growth] on this page open up on the Growth plan." (badge per § 15.4, radius 999)                                                                                             | title only, 13.5 / 20               |
| button    | `aria-expanded="false" aria-controls="growth-more"`; inline-flex gap 6, height 32, padding 0 9, 12px 500, border 1px `#878f9d`, radius 4, `#fff`, `#12141a`, `shadow-admin`; "See what's included" + chevron-down 12 stroke `#5b6472` 2.5 (`M6 9l6 6 6-6`); hover bg `bg` (#f6f7f9; LXG-A draws it, G2 draws no hover) | 12.5px 600, padding 0 10, no shadow |
| panel     | `div#growth-more hidden`                                                                                                                                                                                                                                                                                               | —                                   |

### 15.2 Growth note — expanded (G2-2, G2-3)

Button reads "Hide" + chevron-up 12 (`M6 15l6-6 6 6`), `aria-expanded="true"`.
The panel opens directly under the note row and pushes the preset strip down
only while open; Hide folds it.

| Element          | Value (G2)                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| panel            | bg `#fff`, border-top 1px `rgba(79,70,229,.3)`, padding 16 18 18, flex column, gap 14 (plain `div`, no region role)                                                                                                                                                                                                                                    |
| list             | `ul aria-label="What Growth adds on this page"`, grid 2 × `minmax(0,1fr)`, gap 2 16                                                                                                                                                                                                                                                                    |
| link             | `a href=#<card>`: flex column, gap 1, padding 7 8, margin 0 −8, radius 4, no underline, min-height 44; name 13px 600 `#4f46e5`; description 12px / 1.45 `#5b6472`; hover bg `bg` (#f6f7f9; LXG-A, G2 draws none)                                                                                                                                       |
| links (G2 order) | Type — "Heading and body fonts"; Shape — "Corners, spacing, card and header-button style"; Header — "Layout, sub-menus, bar and account controls"; Buttons — "Busy state and spinner"; Footer — "Layout, background and surface"; Colour — "A logo hue of its own". **Built in reading order** Colour, Type, Shape, Buttons, Header, Footer (§ 22 D-5) |
| closing line     | 12.5px / 1.5 `#5b6472` "Growth also adds more languages (with a choice of language switcher style), your own domain and more site features."                                                                                                                                                                                                           |
| Ask about Growth | height 36, padding 0 13, border 1px `#4f46e5`, radius 4, bg `#4f46e5`, `#fff`, 13px 500, `shadow-admin`; hover and focus are the shared primary `Button`'s (neither board draws them). Destination: [UPGRADE PATH] § 22 D-1 (decided 31 Oct: the upgrade flow, once one exists)                                                                        |

A link opens its row, scrolls to it and moves focus to the row button. Focus
order (G2-3): Hide → links in reading order → Ask about Growth. Focus ring
2px `#4f46e5` offset 2. The `[UPGRADE PATH]` marker is board furniture, never
built.

Six links (§ 22 D-38, G2 owns the note): Language switcher also carries a
badge on Free (§ 15.4) but is not linked — G2's closing line names "a choice
of language switcher style" instead. LXG-A's seventh link is not built.

LXG-A drew a different panel (region "What Growth adds", intro "On this page,
Growth unlocks the fields marked [Growth]. Each link opens its card.", "Style"
/ "Site parts" headings, 7 links incl. Language switcher "Switcher style, with
more languages", Header "Layout, width, sub-menus and sign-in button", links
`#3730a3` underlined with padding 5 8, closing line without the parenthesis,
`btn-pri` 600). Per § 3 these are **not** built.

### 15.3 Phone (G2-4, G2-5)

Note starts collapsed so Preset is in the first view. The button wraps under
the text and is a 44 px target (min-height 44, padding 0 13, 13px). Expanded:
panel padding 14 16 16, list one column, Ask about Growth min-height 44.
(LXG-D2 drew the button as its own full-width 44 row — not built.)

### 15.4 Growth badge (LXG; G2-6 anatomy)

inline-flex, flex none, height 20, padding 0 7, radius 10, bg `#eef0f3`, border
1px `#e5e7eb`, `#5b6472`, 11.5px 600, line-height 1, letter-spacing .1px,
nowrap. Text "Growth" + sr-only "— included in the Growth plan". Contrast
5.2:1. Replaces the 🔒 glyph and the words "Growth plan" under the label
(G2-6: "Replaces the lock glyph and the words Growth plan under the label.").

Placement:

- **Beside a locked field's label** (`span#…-l` + badge `#…-g`).
- **After the summary on a folded row whose fields are all Growth-only**:
  Type, Shape, Buttons, Header, Language switcher.
- **No row badge** on Colour (accent hue is free, logo hue is not), Footer
  (cookie settings button is free) and Brand (logo and favicon free). Their
  fields carry badges once open.
- Never on the Style / Site parts group labels.

### 15.5 Locked controls (LXG-B, LXG-D, LXG-F; G2-6)

| Element           | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| segmented, locked | `role="group" aria-labelledby="<label> <badge>" aria-describedby="<badge>"`; buttons `aria-disabled="true"` (not `disabled`), keep focus and pressed state, ignore activation. Track bg `#f6f7f9`, border `#c5cad3`; buttons cursor not-allowed, `#5b6472`; pressed `inset 0 0 0 1px #878f9d`, bg `#fff`, `#12141a`                                                                                                                                                                                                                                                                                                                                                                                         |
| select, locked    | `aria-haspopup="listbox" aria-labelledby="<label> <button>" aria-describedby="<badge>" aria-disabled="true"`; bg `#f6f7f9`, border `#c5cad3`, not-allowed, text `#12141a`; does not open                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| switch, locked    | the shared `Switch` (today `LogoHueField`'s "Follow accent hue"): `role="switch"`, `aria-checked` kept, `aria-disabled="true"` (not `disabled`), focusable, Space / click ignored, `aria-labelledby="<label> <badge>"`, `aria-describedby="<badge>"`. Checked track `#878f9d` (the locked pressed colour of § 15.5's segmented row) instead of brand, thumb `#fff`, cursor not-allowed, **no opacity** (§ 22 D-39); label `#12141a`; readout "follows accent" 12.5px `#5b6472`. G2 desktop draws this control as a checkbox at opacity .55, and GC draws the paid one as a native checkbox: neither the checkbox nor the opacity is built — Logo hue is the shared Switch on every plan (§ 10.5, § 22 D-39) |
| lock line         | first after the description: 12.5px / 18px `#12141a`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Archived          | stays truly disabled (today's behaviour)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Lock lines drawn: Footer "Fields marked Growth keep the Editorial preset's
value."; Type "On Free, Type keeps the Editorial preset's fonts. Picking
another preset changes them." ({preset} = the selected preset's name). LX-G's
"Fields marked Growth keep your preset's value." is superseded.

Free = live: preset, accent hue, logo, favicon, cookie settings button
(`packages/db/src/constants/tenant.ts` entitlements). Everything else locked,
showing the effective (preset) value.

Drawn locked values: Type Fraunces / Inter; Footer Columns, Brand tint, Full
width; Cookie settings button live Shown.

Every field on a Free site, card by card (rows not drawn open by LXG take
badge placement from G2 desktop per § 3 item 5; values are the selected
preset's, Editorial on the boards):

| Card              | Live, no badge         | Badge + locked control (value shown)                                                                                                                | Source                   |
| ----------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Colour            | Accent hue             | Logo hue: locked **switch** "Follow accent hue", on, with the readout "follows accent"; no hue slider (it shows only when the logo has its own hue) | G2 desktop               |
| Brand             | Logo, Favicon          | none                                                                                                                                                | entitlements (not drawn) |
| Type              | —                      | Heading font ("Fraunces", in Fraunces), Body font ("Inter")                                                                                         | LXG-D                    |
| Shape             | —                      | Radius scale (Small), Density (Compact), Card style (Outlined), Header buttons (Outlined)                                                           | G2 desktop; values LXG-C |
| Buttons           | —                      | every field (busy label, spinner style), each with its preset value                                                                                 | rule (not drawn open)    |
| Header            | —                      | Layout ("Classic"), Sub-menus (Dropdown), and every other Header field, each with its preset value                                                  | G2 desktop; values LXG-C |
| Footer            | Cookie settings button | Footer layout (Columns), Background (Brand tint), Surface (Full width)                                                                              | LXG-B                    |
| Language switcher | —                      | Style (§ 15.6)                                                                                                                                      | LXG-F                    |

A row whose every field is locked shows the row badge (§ 15.4); Colour,
Brand and Footer show none. Lock lines are drawn on Footer ("Fields marked
Growth keep the {preset} preset's value.") and Type (its own line, above);
Language switcher uses § 15.6's description instead. Whether Colour, Shape,
Buttons and Header carry the Footer line when open is not drawn; they do
(§ 22 D-32, confirm-only).

### 15.6 Language switcher on Free (LXG-F)

Open: description (`#12141a`) "Your plan publishes one language. Upgrade to
add languages and choose a switcher style."; field "Style" + badge; hint "How
the language switcher looks on desktop, in the header and footer."; locked
segmented **Menu with code** / Menu with globe / Compact codes (§ 22 D-7: the
value `effective-look` publishes; LXG draws Menu with globe pressed). Folded:
"Menu with code · One language" + one badge. A Growth site with
one language keeps today's "Add another language in Languages settings to
choose a style." (G2-7's no-control variant is superseded.)

Verbatim LXG-F bullets (their "Menu with globe" is the illustrative value D-7
replaces): "Folded, the row reads Menu with globe · One language,
with one Growth badge: style is its only field." / "Open, the card says why it
is quiet, then the locked style showing the preset's Menu with globe."

### 15.7 Free preview

No reader group when reader accounts are off; status adds "Reader accounts are
off for this site, so there is no reader switch." Sample uses the Editorial
preset's values (§ 14.3).

### 15.8 Reference only

G2-7 long page, G2-8 operator card ("This tenant is on Free" / "The options
marked Growth are locked on this plan, for its owner and here. Move the tenant
to Growth to open them." / "Change plan in tenant details"), G2-9 downgraded
card ([DOWNGRADE SIGNAL]) and G2-10 (Growth tenant: no card, no badges;
archived: no card). Only G2-10's rule is built: **a Growth site and an
archived site show no note and no badges.**

### 15.9 Operator on a Free tenant

The operator route renders the same Look page. An operator on a Free tenant
sees the badges and locked fields as the owner sees them, and no Growth note
(§ 22 D-29; G2-8's operator card is out of scope, § 25).

## 16. Phone (< lg) — LX-E1, LX-E2, LXG-D2

- **Page title**: no visible h1 or subtitle; the tablist sits directly under
  the phone top bar (§ 6.2; sr-only h1: § 22 D-28).
- **Tabs**: `role="tablist"` named "Look view" (§ 22 D-14), bg `#fff`, border-bottom
  `#e5e7eb`, padding 0 16; each tab flex 1, height 44, 14px; selected 600
  `#3730a3`, border-bottom 2px `#4f46e5`, `aria-selected="true"`; rest 500
  `#5b6472`, transparent border. (Today a grey segmented track.) The tabs
  stick under the top bar while the Edit body scrolls (§ 22 D-26). From `lg`
  (GW-A) the tab bar is a white bar with a 1px `#e5e7eb` border, radius 6,
  padding 0 16 and `shadow-admin-index` (`0 1px 2px rgba(16,24,40,.05)`),
  under the visible page heading; it sticks under the top bar at z-index 21
  and the desktop index sticks directly under it at top bar + 46 (§ 6.2,
  tabbed layout). Hover (both variants, pointer devices): an
  unselected tab's text turns `text` (#12141a); the selected tab stays
  `brand-strong` (#3730a3) on hover (GW-A).
- **Edit tab from `lg`** (GW-A): the edit column fills the whole content area
  (704 px in a 1024 window with the sidebar open), with no fixed width; the
  500 / 460 widths apply only to the two-column layout.
- **Layout switch**: this tabbed layout shows whenever the content area is under 900 px (§ 4, § 22 D-37), not only below `lg`; from `lg` it keeps the desktop shell, heading, index bar and 32 px controls (GW-A, GW-B); control sizes are 44 px below `lg` and on touch.
- **Index**: § 7.2 (no Expand all); hidden while the Preview tab is selected, with the unsaved bar (§ 11).
- **Edit body**: padding 14 16, gap 14. Bottom padding is the shared bar's,
  not Look's (§ 11): below 768 **120** while the unsaved bar shows (LX-E1:
  room for the bar) and **24** when it does not (LXG-D2, a clean form), both
  #6388's; from 768 #6413's 120 (48 archived).
- **Rows, LX-E1 form** (paid): `h3 > button.rb`, padding 0 16, gap 12; the
  **16 px chevron stays** (stroke `#5b6472` 2, right when folded, down when
  open). Folded: min-height 56, align center, a column (flex 1, min-width 0,
  gap 2) of title 14px 600 and summary 12.5px `#5b6472` ellipsis. Open:
  min-height 48, chevron + title (`.rt`, holds the dot), no summary; open `li`
  keeps the inset 3px brand bar; body padding **0 16 16**, gap 16.
- **Rows, LXG-D2 form** (Free first view): min-height 60, padding 8 16, gap
  10, **no chevron**, title 14px 600 + summary 12.5px (gap 6, colour swatch
  12×12 r3), trailing Growth badge. The phone row is the LX-E1 form with
  LXG-D2's trailing badge and 12×12 swatch (§ 22 D-17); LXG-D2's 60 px,
  chevron-less form is not built.
- **Open-row description on phone**: shown, same body as desktop (§ 22 D-27,
  confirm-only: LX-E1's open Footer body starts at "Footer layout", a crop).
- **Fields on phone**: label, hint, control (as desktop); segmented controls
  become the 2-column grid below.
- **Segmented on phone**: 2-column grid (`grid-template-columns: 1fr 1fr`)
  gap 6 of buttons height 44, padding 0 12, radius 4, 13.5px; rest border
  `#878f9d`, `#fff`, `#12141a`; pressed border 1.5px `#4f46e5`, bg `#eef2ff`,
  `#3730a3` 600. Label text is **left-aligned** (flex, `justify-content:
flex-start`, padding 0 12), unlike the centred desktop control (LX-E1
  markup). Options fill the grid in order, left to right; an **odd** count
  leaves the last option alone in the left column at half width (Background:
  Plain | Shaded, then Brand tint alone) — it never spans both columns. A
  locked control keeps the same grid and geometry (44 px, radius 4, 13.5px,
  left-aligned, padding 0 12) with the § 15.5 locked colours, settled by rule
  (not drawn; § 24 "Not drawn"): every button `#f6f7f9` fill, 1px
  `control-line-locked` (#c5cad3) border, `#5b6472` text, cursor
  not-allowed; the pressed button `#fff` fill, 1px `control-line` (#878f9d)
  border, `#12141a` 600 text — the desktop locked pressed state, with no
  indigo; no opacity.
- **Unsaved bar**: § 11 phone — **no "⌘S / Ctrl+S" hint** on phone (LX-E1
  draws dot · 1 unsaved change · in · Footer, then Discard / Save changes).
- **Preview tab** (LX-E2), body padding 12 16, gap 10, **no visible h2**
  (§ 12.1, § 22 D-28):
  - row 1: the toolbar (`role="toolbar"`, one Tab stop) with Device
    (Phone✓), Colour scheme (Light✓), Reader (Signed out✓; Signed-in tooltip
    right-aligned), every button 44×44;
  - row 2: space-between gap 8: readout "390 px · shown at 62%"
    (`role="status"`), then Follow (✓) and Full screen solos 44×44, gap 6,
    **outside the toolbar** — each its own Tab stop, tooltips right-aligned;
  - stage padding 10; phone frame 242×523 @0.62; status "Following
    **Footer**";
  - the frame opens at the part of the last Site parts card open on Edit (§ 13).
- **Preview tab from `lg`** (GW-B): the desktop heading row, toolbar (32 px,
  solos inside it) and status line in a 704 px section; the frame opens at
  the last Site parts card open on Edit, outlined, with the desktop status
  line (§ 13), not the phone short form.
- **Preset strip**: § 8.2 phone, card padding 12 (LX-H).
- **Growth note**: § 15.3.

## 17. Behaviour rules — verbatim

- LX-D annotation 1 "One form, grouped": "The preset strip sits on top. Below it, Style holds the cards that change the whole page and Site parts holds the cards for one region. Each row folds to a summary of its current values. The sticky index lists both groups and their cards and carries the same unsaved dot."
- LX-D annotation 2 and 3: § 13 and § 12.3 (annotation 3's iframe is superseded by § 22 D-9, as is LX-C's iframe sentence below).
- LX-A: "Opening Footer scrolls the phone frame to the bottom of the page and outlines the footer with its name. The cookie settings button (Shown) floats in the bottom-left corner of the device, where readers see it. The scroll bar on the frame shows where in the page you are."
- LX-B: "Moving from Footer to Header scrolls the frame back to the top (a short smooth scroll, instant under reduced motion). At 390 px the sample header is the bar: brand, account circle, menu button."
- LX-C: "820 px is under the site's lg breakpoint (64 rem), so Tablet gets the same bar. The sample runs in an 820 px iframe, so the header, cards and @blog/ui Footer all meet the real viewport width, never the device switch."
- LX-D2: "Wheel, trackpad or touch scrolls the frame; the sample takes no clicks or focus. A manual scroll pauses following. Back to Footer, or opening another card, resumes it."
- LX-E: "Edit and Preview stay tabs below 1024 px. The index becomes a sticky row of 44 px chips with group names between them. On Preview the device, scheme and reader switches share one row of 44 px icon buttons; follow and full screen sit beside the readout. The frame opens at Footer, the last card open on Edit."
- LX-G: "… Locked controls are disabled but show the value the site uses. Preset, Accent hue, Brand and Cookie settings button stay live. With one language, Language switcher says why it is quiet."
- LXG-D annotations: "1 · The note is the default", "2 · Locked fields stay visible", "3 · One badge per folded row" (§ 15).
- LXG-B side notes: "Open, each locked field shows its own badge. Its segmented buttons keep their pressed state, take focus and announce disabled." / "The note stays collapsed at the top of the column, out of view here; reaching a locked field never reopens it."
- LXG-C: "The summary is always the preset's values, so a Free owner can see what the site publishes without opening anything."
- G2-1, G2-2, G2-3, G2-4, G2-5 captions: § 15.1–15.3.

## 18. Accessibility

| Topic     | Rule                                                                                                                                                                                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmarks | `nav "Look sections"`; `section aria-labelledby` for Style, Site parts and the preview; `role="region" "Unsaved changes"`                                                                                                                                                              |
| Rows      | `h3 > button[aria-expanded][aria-controls]`; row dot `role="img" "Unsaved changes"`; field dot `role="img" "Unsaved change"`; index dot sr ", unsaved changes"                                                                                                                         |
| Index     | current `aria-current="location"`; phone group labels `aria-hidden`                                                                                                                                                                                                                    |
| Preset    | strip `role="radiogroup"` labelled "Preset"; More presets outside it; popover `role="dialog"`, listbox with `aria-activedescendant`; sheet `aria-modal="true"`                                                                                                                         |
| Toolbar   | `role="toolbar" "Preview options"`, roving focus (Arrow / Home / End), groups `role="group"` with names, `aria-pressed` on every switch, tooltips `aria-hidden`                                                                                                                        |
| Frame     | `role="img" "Sample page at {w} px"` on the page; none in full screen (the stage region names it, § 12.3); sample `inert`; readout `role="status"` (polite)                                                                                                                            |
| Free      | note button `aria-expanded` + `aria-controls`; badge sr text; locked controls `aria-disabled`, focusable, `aria-labelledby` label + badge, `aria-describedby` badge                                                                                                                    |
| Focus     | the shared gapped ring (#6337, X13), drawn as 2px `#4f46e5` offset 2 (rows and the full-screen stage −2); the tickets that draw it depend on #6337 (#6382, #6386, #6399, #6395; the rest reach it through those); link to a card moves focus to its row button                         |
| Dialog    | full screen: `role="dialog"` `aria-modal="true"` named by its heading; page behind inert; focus to the pressed device; stage `role="region"` "Sample page at {w} px" `tabindex="0"`, the frame inside it with no role or name, so the name is read once; Escape returns focus (§ 12.4) |
| Targets   | 44 below lg and on touch                                                                                                                                                                                                                                                               |
| Motion    | follow scroll is smooth, instant under reduced motion                                                                                                                                                                                                                                  |
| Order     | Hide → the 6 G2 links (§ 15.2, reading order, § 22 D-5) → Ask about Growth → then the Preset strip (§ 22 D-2, decided 31 Oct). LXG-E draws 7 links from its own panel, which is not built (§ 3); only its "then the jump index" step is a source                                       |

Contrast (boards): resting icons 5.3:1 on the track, group border 3.5:1;
descriptions 6.0:1 on white; option and button borders 3.5:1; badge 5.2:1.

## 19. Copy

All strings are platform UI: **fixed**, never Voice. Translate every new or
changed string into de / es / fr / nl; the user approves the translations
before filing (§ 22). The shared preview's strings ("Preview options",
"Preview device", "Tablet", "Phone", the device tooltips, the readouts,
"Sample page at {width} px") ship with #6390 and onboarding reuses them.

| String                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Key                                                                                                                                                    | Status                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Look / Theme this site. The preview shows your changes — nothing is live until you save.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `lookForm.heading` / `subtitle`                                                                                                                        | existing                                                          |
| Sets accent hue, heading and body fonts, radius, and density.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `lookForm.presetDescription`                                                                                                                           | **changed** (drops "The starting point nearly every site picks.") |
| Reset to preset                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `lookForm.resetButton`                                                                                                                                 | existing                                                          |
| Console / Editorial / Mono, precise and technical. / Serif, warm and magazine-like.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `presetPicker.*`                                                                                                                                       | existing                                                          |
| Style / Site parts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | new                                                                                                                                                    | new                                                               |
| Look sections / , unsaved changes / Expand all / Collapse all                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | new (GC, GW-A)                                                                                                                                         | new                                                               |
| Style (Language switcher field label)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | new (GC, GO-E)                                                                                                                                         | new                                                               |
| Unsaved changes (row dot) / Unsaved change (field dot)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | row dot reuses `saveBar.regionLabel` ("Unsaved changes"); field dot new (today `fieldStatus.unsaved` "Unsaved"); both passed through #6387's name prop | row dot reused; field dot new                                     |
| Colour / Brand / Type / Shape / Buttons / Header / Footer / Language switcher                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `lookForm.*Heading`                                                                                                                                    | existing                                                          |
| Hue {hue} · logo follows accent / Logo hue {hue}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | new                                                                                                                                                    | new                                                               |
| Logo uploaded / No logo / Favicon uploaded / No favicon                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | new                                                                                                                                                    | new                                                               |
| Cookie button shown / Cookie button hidden / One language                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | new                                                                                                                                                    | new                                                               |
| Option labels in summaries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `lookForm.*OptionLabel`                                                                                                                                | existing                                                          |
| Footer descriptions, field labels and hints (§ 10.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `lookForm.footer*`, `cookieSettingsButton*`                                                                                                            | existing                                                          |
| The preview is on Phone, so it shows the bar with a menu button. / … on Tablet … / Show on Desktop                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | new                                                                                                                                                    | new                                                               |
| 1 unsaved change / ⌘S / Ctrl+S / Discard / Save changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `saveBar.*`                                                                                                                                            | existing                                                          |
| in {card} (the card name a link) / in {cards, plural, one {# card} other {# cards}}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | new (`saveBar.inCard`, `saveBar.inCards`; GS-C)                                                                                                        | new                                                               |
| Edit / Preview                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `viewTabs.editTab` / `previewTab`                                                                                                                      | existing                                                          |
| Look view                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | new (tablist name, § 22 D-14)                                                                                                                          | new                                                               |
| More presets / More presets, {count} more / {count} presets / Choose a preset / Close                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | new                                                                                                                                                    | new                                                               |
| Live preview                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `previewModeControl.livePreviewHeading`                                                                                                                | existing                                                          |
| Preview                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `viewTabs.previewTab` reused, or new                                                                                                                   | existing                                                          |
| {width} px wide · shown at {percent}% / {width} px · {percent}% / {width} px · shown at {percent}%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | new                                                                                                                                                    | new                                                               |
| Preview options / Preview device                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | new (`previewWidthAriaLabel` "Preview width" → "Preview device")                                                                                       | new / changed                                                     |
| Desktop / Tablet / Phone                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `widthDesktop` existing; `widthMobile` "Mobile" → "Phone"; Tablet new                                                                                  | changed                                                           |
| Desktop · 1280 px / Tablet · 820 px / Phone · 390 px                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | new                                                                                                                                                    | new                                                               |
| Preview colour scheme / Light / Dark                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `previewModeControl.*`                                                                                                                                 | existing                                                          |
| Reader / Signed out / Signed in                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `lookPreview.reader*`                                                                                                                                  | existing                                                          |
| Signed in as {name}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | new ({name} = `sampleReaderName` "Robin Hale")                                                                                                         | new                                                               |
| Follow the card you are editing / Open preview full screen / Close full screen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | new (Close full screen: GF-B)                                                                                                                          | new                                                               |
| Sample page at {width} px                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | new                                                                                                                                                    | new                                                               |
| Each status line in § 13's rule table, one ICU message per row (never fragments): "Following {part} — outlined in the frame. The whole sample nearly fits at 1280 px, so the frame scrolls only its last {overflow} px." / "Following {part} — scrolled to the end of the page." / "Following {part} — back at the top of the page." / "Following {part} — outlined in the frame." / "Following {part}. The sample fits one {device} screen, so following only outlines." / "Following {part}" / "Open a Site parts card and the frame scrolls to it." / "Following is off. The frame stays where you leave it." / "Every card is open. Focus a Site parts card and the frame scrolls to it." | new (GO-A–GO-C, GC)                                                                                                                                    | new                                                               |
| You scrolled the frame. Following is paused. / Back to {part} / Top of page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | new                                                                                                                                                    | new                                                               |
| {card} changes the whole page, so the frame stays where it is.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | new (#6398)                                                                                                                                            | new                                                               |
| The sample uses the {preset} preset's values, the ones a Free site publishes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | new (Free only, #6400)                                                                                                                                 | new                                                               |
| Reader accounts are off for this site, so there is no reader switch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | new                                                                                                                                                    | new                                                               |
| Built from the site's own components. Nothing is live until you save.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `lookPreview.previewNote`                                                                                                                              | **removed** from Look                                             |
| A short dispatch on reading the water before you set out, and what the charts leave unsaid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `lookPreview.samplePara`                                                                                                                               | **changed**                                                       |
| What the spring tides leave behind on the north quay. / Where the boats go when the harbour closes for winter.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `firstCardExcerpt` / `secondCardExcerpt`                                                                                                               | **changed**                                                       |
| Latest posts / 12 Oct 2026 · 4 min read / 28 Sep 2026 · 4 min read                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | new                                                                                                                                                    | new                                                               |
| Newsletter / An outlined card, as panels and pricing tiers render it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `outlinedCardHeading` / `outlinedCardBody`                                                                                                             | removed from Look (delete if unused)                              |
| Growth / — included in the Growth plan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | new                                                                                                                                                    | new                                                               |
| More options come with Growth / Options marked {badge} on this page open up on the Growth plan. / See what's included / Hide                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | new                                                                                                                                                    | new                                                               |
| What Growth adds on this page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | new                                                                                                                                                    | new                                                               |
| Heading and body fonts / Corners, spacing, card and header-button style / Layout, sub-menus, bar and account controls / Busy state and spinner / Layout, background and surface / A logo hue of its own                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | new                                                                                                                                                    | new                                                               |
| Growth also adds more languages (with a choice of language switcher style), your own domain and more site features.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | new                                                                                                                                                    | new                                                               |
| Ask about Growth                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | new                                                                                                                                                    | new                                                               |
| Fields marked Growth keep the {preset} preset's value. / On Free, Type keeps the {preset} preset's fonts. Picking another preset changes them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | new                                                                                                                                                    | new                                                               |
| Your plan publishes one language. Upgrade to add languages and choose a switcher style.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | new (worded in #6290)                                                                                                                                  | new                                                               |
| Add another language in Languages settings to choose a style.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `lookForm.languageSwitcherSingleLanguage`                                                                                                              | existing, Growth only                                             |
| Growth plan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `featuresSettings.planLockedBadge`                                                                                                                     | no longer used by Look                                            |

## 20. Code mapping

Paths under `apps/platform/src/`. "SH" = `components/shared`, "LK" =
`components/features/look`.

| Region                             | Today                                                                                                                                              | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page                               | `LK/look-form/look-form.tsx` in `SH/settings-form-shell` (`PageHeader` white band, gap 24); both owner and operator routes                         | gap 18; the page heading on the page bg from #6357 (X19); an opt-in on `SH/page-header` (passed through `SH/settings-form-shell`) that hides the title block visually below `lg` while the h1 stays in the accessibility tree (§ 22 D-28), #6391                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Columns                            | `look-form-variants.ts` `lg:grid-cols-2`                                                                                                           | `lg:grid-cols-[500px_minmax(0,1fr)]` (+ 1280 rule)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Cards → rows                       | `LK/look-form/components/*-card`, `look-card/look-card.tsx` (Card + header)                                                                        | groups + folding rows; descriptions into bodies; summaries from `utils/look-form-values` `CARD_FIELDS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Folding row                        | `SH/accordion` single-open, chevron rotates 180, `min-h-11 px-2.5 py-3`                                                                            | `multiple` mode + row variant, on #6411's accordion (same files)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Field                              | `LK/look-form/components/look-field` label `mb-[5px]`                                                                                              | gap 6, line-heights 18                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Segmented                          | `SH/segmented-control` `gap-[3px] p-[3px] bg-admin-line-2`, `disabled` → opacity .55                                                               | LX tone (§ 10), phone 2-col 44 grid, `isLocked` (aria-disabled) mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Select / FontPicker / OptionSelect | `SH/select`, `SH/font-picker`, `SH/option-select`; disabled opacity .55                                                                            | locked mode; Header select min-width 220 align-start                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Footer layout                      | `footer-card.tsx` OptionSelect                                                                                                                     | SegmentedControl                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dots                               | `SH/unsaved-dot` 8px amber; card-level only (`build-look-form-context.ts` `hasCardChanges`)                                                        | 7px brand; field dot via `isFieldChanged`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Save bar                           | `SH/settings-form-shell/components/save-bar`                                                                                                       | on #6413's docked bar: a location (one card a link, several cards a count), the LX phone layout below 768 and the bottom padding below 768 (#6388)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| View tabs                          | `SH/view-tabs` grey track                                                                                                                          | underline variant + tablist name prop                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Jump index                         | none                                                                                                                                               | new `LK/look-jump-index`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Preset strip                       | `SH/preset-picker` 2-col tall cards (also onboarding)                                                                                              | new strip (do not restyle `PresetPicker` in place); overflow popover + sheet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Reset                              | `preset-card.tsx` when `isDivergedFromPreset`                                                                                                      | hidden on Free; paid rule § 22 D-8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Preview frame                      | `SH/preview-frame` `PreviewFrame` (email, onboarding, Look): `section aria-label`, toolbar slots, stage `p-4 sm:p-6`, `isNarrow` → `max-w-[390px]` | One shared preview (#6390, § 22 D-24): `PreviewFrame` extended opt-in (h2 + readout heading row, one toolbar slot with an end slot, stage padding, status slot) plus a new frame-only `SH/device-frame` (chrome with an optional host, scaled viewport, scrollbar, overlay slot) as its child. Look adopts it (#6426); onboarding adopts it (#6332) in place of its browser chrome. Email keeps its props and look; `isNarrow` stays for email only. `DeviceFrame` also carries the full-screen fit (width only, panning, horizontal scrollbar, § 12.4), which nothing uses until #6399                                                                                                                                                |
| Full screen                        | none                                                                                                                                               | new Look-only dialog under `LK/` (#6399) composing #6382's toolbar and `DeviceFrame`'s full-screen fit; no shared preview file changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Hue slider / asset field           | `SH/hue-slider` 12 px grey track; `SH/asset-upload-field` bordered box (Look Brand, Email logo)                                                    | GC's 10 px hue track and an opt-in asset row (§ 10.5), #6393; the thumb is #6330's (D-43 is #6330's); Email keeps today's field                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Widths                             | `constants/preview.ts` `PREVIEW_WIDTH` DESKTOP / MOBILE (email 600 / 375 px; Look)                                                                 | New `PREVIEW_DEVICE` DESKTOP / TABLET / PHONE and a width map 1280 / 820 / 390 px, added by #6390 with its first reader (§ 22 D-24); `PREVIEW_WIDTH` stays as the email's own widths, so email is untouched. Not an extension of `PREVIEW_WIDTH`: that const is the Email preview's vocabulary (its toggle and `email-template-preview-variants.ts` key their two widths on DESKTOP / MOBILE); adding TABLET would add a width the Email toggle must offer and its variants map must cover, and renaming MOBILE to PHONE would rewrite Email for no change of behaviour. The two name different things — two email widths, three device frames — and once #6426 moves Look to `PREVIEW_DEVICE`, Email is `PREVIEW_WIDTH`'s only reader |
| Toolbar                            | `look-preview.tsx` text SegmentedControls; hidden `@max-[27.5rem]`                                                                                 | icon toolbar on #6382's primitive; never hidden. #6382 builds on the same Base UI parts the editor toolbar (`SH/portable-text-editor/.../toolbar/`) already uses — `Toolbar` (roving focus), `Toggle`, `ToggleGroup` and #6370's Tooltip — and writes no roving-focus code of its own; it does not extract `PortableTextEditorToggleButton`, whose job differs (text-label buttons, non-exclusive marks, `aria-expanded` / `aria-controls` for the link control, editor sizing) and whose files are #6370's and #6412's lane                                                                                                                                                                                                           |
| Tooltip                            | inline in PTE toggle button (Base UI Tooltip)                                                                                                      | the shared `SH/tooltip` from #6370 (X1); this set adds none                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Icons                              | `SH/icon` sizes 16 / 18 / 24, stroke 1.6 baked into each asset; `ICONS` in `packages/config/src/constants/icon.ts`                                 | sizes and `strokeWidth` from #6361; keys DESKTOP, TABLET, USER_CHECK, CROSSHAIR, MAXIMIZE, PAUSE, CHECK_STROKE and the SUN, MOON, USER, PHONE, CHEVRON_UP, X registrations from #6404; GRID, ARROW_UP, CHEVRON_RIGHT, CHEVRON_DOWN keep their registered outlines (§ 22 D-23, decided 31 Oct)                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Sample                             | `components/features/site-preview/look-sample`, `sample-site-header` (`isNarrow`), `sample-site-footer`, `utils/sample-footer-style`               | container-query header, `isNarrow` gone, no Newsletter (shared preview, #6390); Look's copy, Latest posts, meta, no chip, cookie FAB, `data-part` (#6397)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Lock                               | `SH/locked-reason` 🔒 + "Growth plan" via `LK/look-form/use-look-field-lock.ts` (archived and locked share one `isDisabled`)                       | the Growth badge (a `StatusBadge` variant on #6356's 20 px pill) beside the label; `LockedReason` stays for `SH/setting-row` (Features, Languages; #6290)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Language switcher                  | `language-switcher-card.tsx` one-language note                                                                                                     | Free: copy + locked Style + badge; Growth: today's note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Plan data                          | `packages/db/src/constants/tenant.ts` entitlements; `packages/db/src/utils/effective-look` (Free style MENU_CODE)                                  | read only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Feature doc: `docs/features/look.md` is updated by every ticket that changes
what it describes; the last ticket deletes this spec.

## 21. Reconciling #6290

| #6290 criterion                                 | Decision in this spec                                                                                                                                                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Preview widens                               | Dropped (X25): Voice follows V3a's two equal columns, so #6290 no longer widens its preview; on Look the 500 + flex columns and the scaled device frame supersede it.                                                  |
| 2. Lock icon is a monochrome SVG                | Kept. Superseded on Look by the Growth badge; still used by `SettingRow` (Features) and any other `LockedReason` caller.                                                                                               |
| 3. Header buttons description below the options | Superseded by GC (gap-look-collapse-all): a fixed hint above the control and each option's own description inside its button (§ 10, § 10.5). #6385 builds the two-line option, #6394 checks Header buttons against GC. |
| 4. Free-plan language message                   | Moved into the Free locked-fields ticket #6400 (§ 15.6), with the locked Style control and badge.                                                                                                                      |

#6290 keeps criterion 2 only and has no dependency on this set. Nothing in
this set depends on it: #6400 only stops Look calling `LockedReason`
and never edits `locked-reason/`. Its remaining callers are `SettingRow` on
Features and Languages (the operator's suspension fields never pass a lock),
and its criteria cover both. Until #6400 is on `main`, Look also
renders `LockedReason` directly (`look-field.tsx` and
`language-switcher-card.tsx`), so if #6290 merges first Look's lock glyph
becomes the SVG too; #6290's criteria cover that, and #6400 then
removes both calls. Its title changes with its body: "fix(platform-app):
plan lock icons are SVG". The body is rewritten once, when this set is filed,
and a comment on #6290 records what moved where (Voice width → dropped by
X25, Look width and lock display → LX / G2, Header buttons → #6394, Free
language message → #6400), so the body never becomes a changelog.
#6290 is kept (§ 22 D-42, decided 31 Oct); nothing in this set —
#6401 included — depends on it or checks it. Its own manual-test issue
(#6402) is filed with its narrowed body.

## 22. Decisions

Each row says how it was settled: by the 30 Oct **rule** (§ 3 item 0), by a
**board** (the chosen boards or a gap board), by the **user**, or by this
**spec**. Every settled answer is already written into the carrying tickets'
criteria. **Open** rows are put to the user before filing (filing rule).
**Confirm-only** rows have no rival on any board; the user approves them in
one answer.

| #    | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                  | Answer                                                                                                                                                                                                                                                                                                                     | Settled by                                     | Carried by                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------- |
| D-0  | Is the Look set wanted now?                                                                                                                                                                                                                                                                                                                                                                                                               | Yes: the rule names Look = LX + G2.                                                                                                                                                                                                                                                                                        | rule (X30)                                     | the whole set              |
| D-1  | Where "Ask about Growth" leads; apps/platform has no contact, request or billing flow.                                                                                                                                                                                                                                                                                                                                                    | **Decided 31 Oct (Q14):** there is no upgrade flow, so NEW-look-25 (not yet filed) and NEW-look-mt2 (not yet filed) stay unfiled at `prio:later` until one exists, and nothing depends on them.                                                                                                                            | —                                              | NEW-look-25                |
| D-2  | LXG-E focus order: Tab reaching the index after Ask about Growth needs the note before the index in source, so visual and focus order would disagree (WCAG 2.4.3).                                                                                                                                                                                                                                                                        | **Decided 31 Oct (Q14):** keep the visual order (index, then note); after Ask about Growth, Tab goes to the Preset strip, and LXG-E's "then the jump index" is dropped. Without the note (every ticket but NEW-look-25) the order is index, then the edit column, whatever the answer.                                     | —                                              | NEW-look-25                |
| D-3  | Hypothetical presets 3–12.                                                                                                                                                                                                                                                                                                                                                                                                                | Stories only, nothing in the registry.                                                                                                                                                                                                                                                                                     | spec                                           | #6395                      |
| D-4  | [DOWNGRADE SIGNAL] and the G2-8 operator card.                                                                                                                                                                                                                                                                                                                                                                                            | Out of scope (§ 25).                                                                                                                                                                                                                                                                                                       | spec                                           | —                          |
| D-5  | Growth note link order.                                                                                                                                                                                                                                                                                                                                                                                                                   | Reading order: Colour, Type, Shape, Buttons, Header, Footer.                                                                                                                                                                                                                                                               | board (G2-3, LXG-A notes)                      | NEW-look-25                |
| D-6  | Icon button size: LX-F text says 32 from lg; its CSS draws 30.                                                                                                                                                                                                                                                                                                                                                                            | 32 px from `lg`, 44 px below it and on touch; solos 34.                                                                                                                                                                                                                                                                    | board (LX-F note; the 30 px CSS is incidental) | #6382, #6390               |
| D-7  | Language switcher value on Free: the boards show Menu with globe; `effective-look` gives Free `MENU_CODE`.                                                                                                                                                                                                                                                                                                                                | Menu with code; folded "Menu with code · One language". The board value was illustrative data.                                                                                                                                                                                                                             | rule (the code's data value)                   | #6400                      |
| D-8  | Reset to preset on a paid site: always visible, or only when diverged?                                                                                                                                                                                                                                                                                                                                                                    | **Decided 31 Oct (Q15):** only while the form differs from the selected preset (today's rule; every drawn paid state is diverged). Hiding it on Free is new: today it shows on Free whenever the accent hue diverges.                                                                                                      | —                                              | #6425                      |
| D-9  | How the sample lays out at the device width.                                                                                                                                                                                                                                                                                                                                                                                              | Container queries: the sample header switches on the frame's width at the site's `lg`; no iframe, no `isNarrow`.                                                                                                                                                                                                           | user (30 Oct)                                  | #6390                      |
| D-9b | The `@blog/ui` post cards switch on viewport media queries, which a container query does not reach. (Half is settled: #6306, merged 30 Oct, lays the `@blog/ui` Footer's groups grid and bottom row out by its container's width, so they follow the frame. Its top row stays a column until its container reaches 64 rem and its padding is `@blog/ui`'s, so the boards' row (gap 40) at 820 and 24 px column gap at 390 are not built.) | **Decided 31 Oct (Q16):** not now. The Footer already follows the container width (#6306); the post cards and the Footer's top row do not, and an optional `@blog/ui` container-query follow-up for both is not filed. The post cards follow the admin window, and the 820 / 390 frames are compared for every other part. | —                                              | #6390, #6397               |
| D-10 | Title on the page bg: Look only or every page?                                                                                                                                                                                                                                                                                                                                                                                            | Every page (X19), built by #6357; Look adopts it.                                                                                                                                                                                                                                                                          | rule                                           | #6391                      |
| D-11 | App-wide restyles vs Look-only variants.                                                                                                                                                                                                                                                                                                                                                                                                  | App-wide: segmented tone and phone grid (#6385), unsaved dot (#6387), the save bar's phone layout on every settings page but Voice (X16). Opt-in: the save-bar location, underline tabs.                                                                                                                                   | rule                                           | #6385, #6387, #6388, #6389 |
| D-12 | Edit-column width between the two-column threshold and 1440.                                                                                                                                                                                                                                                                                                                                                                              | 460 px below a 1440 window, 500 px from 1440.                                                                                                                                                                                                                                                                              | board (LX-H; GW-C)                             | #6391                      |
| D-13 | Primitives also drafted by other sets.                                                                                                                                                                                                                                                                                                                                                                                                    | One owner each (§ 1 "Relation").                                                                                                                                                                                                                                                                                           | resolutions § 2                                | —                          |
| D-14 | Tablist name: "Look view" (board) or `viewTabs.ariaLabel` "Edit or preview".                                                                                                                                                                                                                                                                                                                                                              | "Look view" (new copy).                                                                                                                                                                                                                                                                                                    | board (LX-E; GW-A)                             | #6389, #6391               |
| D-15 | "Collapse all".                                                                                                                                                                                                                                                                                                                                                                                                                           | Drawn: GC (§ 7.3).                                                                                                                                                                                                                                                                                                         | board                                          | #6396                      |
| D-16 | Rows open on first load.                                                                                                                                                                                                                                                                                                                                                                                                                  | Every row folded, all plans.                                                                                                                                                                                                                                                                                               | board (LXG-C; GO-A)                            | #6391                      |
| D-17 | Phone rows: LX-E1 or LXG-D2 form.                                                                                                                                                                                                                                                                                                                                                                                                         | The LX-E1 form (chevron, 56 / 48) with LXG-D2's trailing badge and 12×12 swatch.                                                                                                                                                                                                                                           | board                                          | #6386, #6391               |
| D-18 | Desktop preview on a phone.                                                                                                                                                                                                                                                                                                                                                                                                               | No special case on the page; § 12.3's rule. Full screen has its own (§ 12.4).                                                                                                                                                                                                                                              | spec; board (GF-D)                             | —                          |
| D-19 | Note phone button.                                                                                                                                                                                                                                                                                                                                                                                                                        | G2-4: a 44 px button wrapping under the text.                                                                                                                                                                                                                                                                              | board                                          | NEW-look-25                |
| D-20 | Full-screen dialog.                                                                                                                                                                                                                                                                                                                                                                                                                       | Drawn: GF-A–GF-D (§ 12.4). #6399 is `prio:next` and the Look toolbar ships with Full screen.                                                                                                                                                                                                                               | board                                          | #6399                      |
| D-21 | Save bar with changes in several cards.                                                                                                                                                                                                                                                                                                                                                                                                   | Drawn: GS-A–GS-C (§ 11).                                                                                                                                                                                                                                                                                                   | board                                          | #6388, #6424               |
| D-22 | Following Language switcher.                                                                                                                                                                                                                                                                                                                                                                                                              | Drawn: GO-E (§ 13).                                                                                                                                                                                                                                                                                                        | board                                          | #6398                      |
| D-23 | GRID, ARROW_UP, CHEVRON_RIGHT, CHEVRON_DOWN drawn differently; icon stroke.                                                                                                                                                                                                                                                                                                                                                               | **Decided 31 Oct (Q1):** keep the registered outlines and move every stroked admin icon to stroke 2 (#6352); no LX redraw.                                                                                                                                                                                                 | —                                              | #6404                      |
| D-24 | Extend `PreviewFrame` or build a new preview; `PREVIEW_DEVICE` or rename `PREVIEW_WIDTH.MOBILE`.                                                                                                                                                                                                                                                                                                                                          | One shared preview ticket (#6390): `PreviewFrame` extended opt-in plus a frame-only `DeviceFrame`; `PREVIEW_DEVICE` (key === value) and a width map land there, with their first reader; `PREVIEW_WIDTH` stays the email's.                                                                                                | user (shared preview, 30 Oct)                  | #6390                      |
| D-25 | Heading and readout switch-over width.                                                                                                                                                                                                                                                                                                                                                                                                    | **Confirm-only:** the long form and "Live preview" from a 476 px section (GW-C draws them at 476), the short form and "Preview" below (426 px panes).                                                                                                                                                                      | boards                                         | #6390                      |
| D-26 | Phone: do the tabs stick, with the index under them?                                                                                                                                                                                                                                                                                                                                                                                      | Yes: tabs under the top bar, the index under the tabs.                                                                                                                                                                                                                                                                     | board (LX-E)                                   | #6389, #6391, #6396        |
| D-27 | Phone open-row description (LX-E1 omits it).                                                                                                                                                                                                                                                                                                                                                                                              | **Confirm-only:** shown; same body as desktop.                                                                                                                                                                                                                                                                             | —                                              | #6391                      |
| D-28 | Headings in the tabbed layout.                                                                                                                                                                                                                                                                                                                                                                                                            | **Confirm-only:** below `lg`, sr-only h1 "Look" and h2 "Live preview"; from `lg` both stay visible (GW-A, GW-B).                                                                                                                                                                                                           | — ; board (GW)                                 | #6391, #6426               |
| D-29 | Operator on a Free tenant.                                                                                                                                                                                                                                                                                                                                                                                                                | Badges and locked fields as the owner sees them; no Growth note.                                                                                                                                                                                                                                                           | board (G2-8 note)                              | NEW-look-25, #6400         |
| D-30 | #6290's Voice preview width.                                                                                                                                                                                                                                                                                                                                                                                                              | Dropped (X25).                                                                                                                                                                                                                                                                                                             | rule                                           | #6290                      |
| D-31 | LX-B / LX-C "Header · open" excerpt.                                                                                                                                                                                                                                                                                                                                                                                                      | A crop; not built.                                                                                                                                                                                                                                                                                                         | spec                                           | —                          |
| D-32 | Lock line on Colour, Shape, Buttons, Header when open on Free.                                                                                                                                                                                                                                                                                                                                                                            | **Confirm-only:** "Fields marked Growth keep the {preset} preset's value." first in each body.                                                                                                                                                                                                                             | —                                              | #6400                      |
| D-33 | Device-frame scale rule.                                                                                                                                                                                                                                                                                                                                                                                                                  | § 12.3; reproduces every drawn scale.                                                                                                                                                                                                                                                                                      | board                                          | #6390                      |
| D-34 | Sample header vs board with reader accounts off or one language.                                                                                                                                                                                                                                                                                                                                                                          | § 14.4: the sample follows the tenant.                                                                                                                                                                                                                                                                                     | board (LX-G, LXG notes)                        | #6397                      |
| D-35 | Status lines for the undrawn follow states.                                                                                                                                                                                                                                                                                                                                                                                               | Drawn: GO-A–GO-D, plus GC's Expand all line (§ 13).                                                                                                                                                                                                                                                                        | board                                          | #6398                      |
| D-36 | "Top of page" on Phone only.                                                                                                                                                                                                                                                                                                                                                                                                              | Phone only.                                                                                                                                                                                                                                                                                                                | board (LX-A)                                   | —                          |
| D-37 | Layout between a 1024 window and about 1300.                                                                                                                                                                                                                                                                                                                                                                                              | Drawn: GW-A–GW-C. Two columns from a 900 px content area, tabs below. **Confirmed 31 Oct:** in the tabbed layout from `lg` the index keeps the desktop bar (GW-A marks it "confirm"); below `lg` the chip row.                                                                                                             | board                                          | #6391, #6396               |
| D-38 | Growth note: G2's six links or LXG-A's seven.                                                                                                                                                                                                                                                                                                                                                                                             | G2's six; its closing line covers the switcher.                                                                                                                                                                                                                                                                            | rule (G2 owns the note)                        | NEW-look-25                |
| D-39 | Logo hue control: G2 draws a checkbox at .55 (locked) and GC a native checkbox (paid); today it is a Switch.                                                                                                                                                                                                                                                                                                                              | **Confirm-only:** the shared Switch on every plan — paid: checked track `brand`; locked: `aria-disabled`, checked track `control-line`, no opacity. Neither board's checkbox is built.                                                                                                                                     | —                                              | #6384, #6394, #6400        |
| D-40 | Desktop save bar can cover the preview's status line.                                                                                                                                                                                                                                                                                                                                                                                     | **Confirm-only:** the preview column always leaves 80 px at the bottom — #6413's 64 px docked bar + 16 (§ 6.2); LX-D's 92 px was its floating bar's.                                                                                                                                                                       | —                                              | #6391                      |
| D-41 | #6297 items this set replaces.                                                                                                                                                                                                                                                                                                                                                                                                            | Settled: #6297 is closed. PR #6302 shipped the card group naming, which #6391 keeps on the open row's body; it left the phone-width sample footer for a follow-up, which is D-9b. No comment on #6297 is needed.                                                                                                           | code (#6302 merged)                            | #6391                      |
| D-42 | #6290 after X25 holds only the `LockedReason` SVG; Look's badges replace the glyph once #6400 lands, leaving `SettingRow` on Features (a backdrop page) and Languages — the operator's suspension fields never pass a lock — and Look's own two calls until then.                                                                                                                                                                         | **Decided 31 Oct (Q13):** keep #6290, narrowed to the `LockedReason` SVG, because Features, Languages and suspension still show the glyph. Its own manual test (#6402) is filed with it; nothing in this set depends on it.                                                                                                | —                                              | #6290                      |
| D-43 | Hue slider thumb: GC draws a 2 px `#12141a` border; the onboarding spec (#6330, which builds the shared thumb for both pages) a 1 px `rgba(16,24,40,.12)` border, same shadow.                                                                                                                                                                                                                                                            | **Decided 31 Oct (Q17):** W2's 1 px border. The thumb is #6330's; Look shows whatever it ships, and no Look ticket builds or checks the knob, so no Look ticket waits on this.                                                                                                                                             | —                                              | #6330                      |
| D-44 | The unsaved dot beside text: the boards draw 20 `aria-hidden` dots next to text and 11 named `role=img` dots.                                                                                                                                                                                                                                                                                                                             | **Confirmed 31 Oct.** One shared component with a decorative mode, used by the save bar (replacing its own 9 px amber dot) and the jump index.                                                                                                                                                                             | —                                              | #6387, #6396, #6388        |
| D-45 | The phone save bar's error and saving content, and the language breakdown, are drawn on no LX board.                                                                                                                                                                                                                                                                                                                                      | **Open.** Draw the frames first, or state #6413's error content inside the LX phone layout. Filing gate for #6388.                                                                                                                                                                                                         | —                                              | #6388                      |
| D-46 | Does Preset count as a card in "in N cards" (a preset click dirties Colour, Type and Shape too), what does its one-card link do, and does the Preset title keep its dot (no board draws one)?                                                                                                                                                                                                                                             | **Decided 31 Oct.** Preset is not a card: it never counts in "in N cards" and is never the one named card (a preset click is counted through the Colour, Type and Shape cards it dirties), and the Preset title has no unsaved dot.                                                                                        | —                                              | #6424, #6425               |
| D-47 | With two presets and no platform Storybook, how is the overflow checked?                                                                                                                                                                                                                                                                                                                                                                  | **Confirmed 31 Oct.** Unit-tested with frame H's ten presets as fixtures; the manual test adds presets locally, uncommitted.                                                                                                                                                                                               | —                                              | #6395, #6401               |
| D-48 | Does the Look preview open on Phone below `lg` (PV2 frame A says so; LX is silent)?                                                                                                                                                                                                                                                                                                                                                       | **Decided 31 Oct.** Phone below `lg`, Desktop from `lg`, on first render; a choice made after that is kept (#6426).                                                                                                                                                                                                        | PV2 frame A                                    | #6426                      |
| D-49 | The full-screen Desktop scale in a 1024 window: no board draws it.                                                                                                                                                                                                                                                                                                                                                                        | **Confirmed 31 Oct.** About 75–76% (GF-C's 0.9128 at 370 px implies a 14 px scrollbar allowance).                                                                                                                                                                                                                          | —                                              | #6399                      |
| D-50 | The follow outline and tag colours in a Dark preview scheme: no frame draws it.                                                                                                                                                                                                                                                                                                                                                           | **Confirmed 31 Oct.** The fixed indigo and white in both schemes.                                                                                                                                                                                                                                                          | —                                              | #6398                      |

**Decided 31 Oct**: D-1 and D-2 (Q14), D-8 (Q15), D-9b (Q16), D-23 (Q1), D-42 (Q13), D-43 (Q17); the confirm-only batch D-25, D-27, D-28, D-32, D-39, D-40 (Q31); the de / es / fr / nl copy of § 19 (Q30); and, outside § 5, D-46 and D-48 and the confirm-only D-37, D-44, D-47, D-49 and D-50.

**Still open:** D-45 (the phone bar's error, saving and language-breakdown content is undrawn; #6388 is filed with it marked undrawn).

## 23. Ticket order

An epic (#6317) parents every ticket below, and every ticket depends on
#6314. Shared primitives come first (each its own PR; nothing adopts it
there), then each Look surface adopts them, then Free. "Needs" lists what must
be merged first; "Shares" is the reason — a file or symbol both change.
Tickets that share no file are parallel.

| Ref   | Ticket                                                                                                     | Needs (this set)                      | Needs (other sets)                | Shares                                                                                                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Admin tokens                                                                                               | —                                     | #6321, #6288                      | `admin-theme.css` (token chain; #6403 follows)                                                                                                                                                    |
| 5     | Icon toggle group + toolbar primitive                                                                      | 1                                     | #6370, #6404, #6361, #6337, #6288 | Tooltip (its `align` prop for end alignment), glyphs, icon sizes, focus ring helper                                                                                                               |
| 6     | Growth badge (status pill variant)                                                                         | 1                                     | #6356                             | `status-badge/`                                                                                                                                                                                   |
| 7     | Locked mode on form controls                                                                               | 1                                     | —                                 | `segmented-control/`, `select/`, `option-select/`, `font-picker/`, `switch/`                                                                                                                      |
| 8     | Segmented LX tone + phone grid (app-wide)                                                                  | 7                                     | —                                 | `segmented-control/`                                                                                                                                                                              |
| 9     | Accordion multiple + folding row                                                                           | —                                     | #6411, #6404, #6337               | `accordion/`, chevron glyphs, focus ring (inset); its swatch slot takes a caller's node and draws no swatch                                                                                       |
| 10    | Unsaved dot 7 px brand (app-wide) + its name prop                                                          | —                                     | —                                 | `unsaved-dot/` (`brand` already exists; #6381 adds nothing it reads)                                                                                                                              |
| 27    | Save bar location, hide option + LX phone layout below 768                                                 | —                                     | #6413, 10                         | `settings-form-shell/` (#6414 follows); bottom padding below 768 (every page but Voice)                                                                                                           |
| 28    | Hue slider track + asset row (GC geometry)                                                                 | —                                     | #6330                             | `hue-slider/`, `asset-upload-field/`                                                                                                                                                              |
| 11    | View tabs underline + tablist name                                                                         | 1                                     | —                                 | `shadow-admin-index` (tokens)                                                                                                                                                                     |
| 12    | **Shared device-frame preview** (incl. the full-screen fit)                                                | 1, 5                                  | #6404                             | `preview-frame/`, `device-frame/`, `site-preview/` header, `constants/preview.ts`                                                                                                                 |
| 15    | Look layout: columns, groups, folding rows, tabs                                                           | 9, 10, 11                             | #6357, #6413                      | `look-form*`, card components, `page-header/` (title hidden below `lg`), `settings-form-shell/` (passes it; stack gap); 10's name prop (row dot); 11 owns the bar and the bottom padding from 768 |
| 16    | Look row summaries                                                                                         | 15                                    | #6330                             | `look-form.tsx`, `utils/look-form-values`; #6330's `AccentSwatch` (14 / 12)                                                                                                                       |
| 17    | Look save bar names the card(s)                                                                            | 16, 27                                | —                                 | `look-form.tsx` (passes 27's location and hide option; edits no `settings-form-shell/` file)                                                                                                      |
| 18    | Look fields inside rows                                                                                    | 8, 10, 15, 28                         | #6330                             | card components, `look-field`; 28's slider and asset row; 10's name prop (field dot); 8's two-line option and phone grid; #6330's `AccentSwatch` (40)                                             |
| 19    | Look compact preset strip                                                                                  | 15                                    | #6404                             | `preset-card` (never beside #6329: `preset-picker/`)                                                                                                                                              |
| 20    | Look preset strip overflow                                                                                 | 19                                    | #6337                             | `preset-card`; focus ring helper                                                                                                                                                                  |
| 21    | Look jump index                                                                                            | 17                                    | —                                 | `look-form.tsx` (index above both columns, sticky offsets)                                                                                                                                        |
| 22    | Look sample content                                                                                        | 12                                    | —                                 | `site-preview/look-sample`, overlay slot                                                                                                                                                          |
| 23    | Look adopts the shared preview (+ Reader group)                                                            | 12, 15, 18, 21, 22                    | —                                 | `look-preview`; `header-card` (18); `look-form.tsx` device state (21)                                                                                                                             |
| 24    | Look follow                                                                                                | 23                                    | —                                 | `look-preview`; `look-form.tsx` row events                                                                                                                                                        |
| 14    | Full-screen preview dialog (Look-only)                                                                     | 24                                    | #6337                             | `look-preview` toolbar (the solo goes after Follow); new `LK/` dialog; no shared preview file                                                                                                     |
| 26    | Look Free: badges and locked fields                                                                        | 6, 7, 15, 16, 18, 24                  | —                                 | summaries (16), card components (18), status line (24)                                                                                                                                            |
| #6290 | Plan lock icons are SVG — kept (D-42), with its manual test #6402 (not under the epic)                     | —                                     | —                                 | `locked-reason/`                                                                                                                                                                                  |
| mt    | Manual test (paid, Free locking, full screen)                                                              | 8, 10, 11, 14, 17, 19, 20, 26, 27, 28 | —                                 | —                                                                                                                                                                                                 |
| 25    | Look Free: Growth note — `prio:later`, unfiled until an upgrade flow exists (D-1, D-2); not under the epic | 6, 19, 26                             | —                                 | `look-form.tsx` edit column (26 is the last toucher)                                                                                                                                              |
| mt2   | Manual test (Growth note) — `prio:later`, filed with 25; not under the epic                                | 25                                    | —                                 | —                                                                                                                                                                                                 |

Downstream of this set: #6403 ← #6381; #6406 ← #6382;
#6414 ← #6388; #6418 and #6419 ← #6387;
#6332 ← #6426 (onboarding adopts the shared preview after Look).

Never in parallel, though no edge orders them: #6384 and #6385 with
#6337, #6339, #6343 and #6325 (form-control files);
#6383 with #6359 and #6409 (`status-badge/`); #6390 and
#6426 with #6406 and #6332 (`preview-frame/`, `device-frame/`;
#6399 edits neither, so it is outside that lane, as resolutions § 4
lists it); #6393 with #6339, #6333 and #6291 (`hue-slider/`);
#6399 with #6400 (`look-preview`); #6425 and #6395 with
#6329 (`preset-picker/`); #6391 with #6416 (`page-header/`);
#6391 with #6388, #6414 and #6422
(`settings-form-shell/`).

Parallel lanes, once the other sets' owners are in: 1, 9, 10 and 27 (and
#6290); then 5, 6, 7, 11; then 8, 12; then 15 and 22; 28 once
#6330 is in; 18 (after 8, 15 and 28) and 19–20 run beside 16 → 17.

Edges this spec drops from resolutions § 4 (no shared file or symbol backs
them): #6387 ← #6381 (the dot reads the existing `brand` token);
#6424 ← #6414 (17 changes only `look-form.tsx`; the hide option
it passes is #6388's, so 17 also leaves the `settings-form-shell/`
lane); #6400 ← #6290 (26 never edits `locked-reason/`; until 26
lands Look's two `LockedReason` calls show whatever #6290 ships, and #6290's
criteria cover them). Moved: #6391 ← #6385 becomes #6394 ←
#6385 (15 changes no field and reads nothing of 8; 18 renders 8's
two-line option and phone grid). Added: #6394 ← #6387 (the
field dot's name prop); #6382, #6386, #6399, #6395 ← #6337 (they draw the
shared focus ring, § 18; #6384 and #6385 only share its control files and
stay "never in parallel"). Also added:
#6393 ← #6330 (`hue-slider/`); #6394 ← #6393;
#6389 ← #6381 (the from-`lg` tab bar reads `shadow-admin-index`,
GW-A).
The `look-form.tsx` chain 15 → 16 → 17 → 21 → 23 → 24 → 26 is sequential
because each changes that file; 14 follows 24.

Epic scope and its last PR: #6317 parents every ticket in this table
except #6290 (an existing issue, kept) and NEW-look-25 / mt2 (unfiled until an
upgrade flow exists, `prio:later`). Every other ticket is an ancestor of
#6399, #6395 or #6400, so whichever of those three merges
last is the epic's final PR: it moves § 15.1–15.3, § 15.9's note rows, § 18's
note rows, § 19's note copy and D-1, D-2, D-5, D-19 and D-38 into
a new `docs/superpowers/specs/2026-10-30-look-growth-note-design.md` (the design
NEW-look-25 cites) and deletes this spec.

Filing gate: #6388 is filed with D-45's phone content marked undrawn.
NEW-look-25 and mt2 stay unfiled until an upgrade flow exists (D-1, D-2 are
decided).

## 24. Acceptance checklist

Tick each against the build at the frame's width, side by side with the board.

**Seed** (reproduces LX-D and LXG-D exactly; the manual-test issue copies it):

- Paid (Growth) tenant "Field Notes", host `fieldnotes.valstack.dev`, two
  published languages (en + de), reader accounts on, cookie banner on.
- Stored Look values: preset Editorial; accent hue 192, logo hue follows the
  accent; logo uploaded, no favicon; Heading Fraunces, Body Inter; Shape
  Medium / Default / Accent bar / Outlined; Buttons Busy label / Follow the
  preset; Header Classic / Dropdown / Full width / Pill with label (account
  panel and phone placement at their defaults); Footer Columns / **Brand
  tint** / Full width / cookie button Shown; Language switcher Menu with
  globe. LX-D is then reached by opening Footer and changing Background to
  Shaded (one unsaved change, its field dot and the bar).
- Free copy of the tenant: one language, reader accounts off, preset
  Editorial (the Free summaries are the Editorial values).
- Archived copy of the tenant.

Admin Light; Dark as well once #6291 is on `main` (X27).
The app shell (sidebar, desktop top bar, phone top bar) is excluded (§ 3 item
6): compare from the h1 (desktop) or the tablist (phone) down. Items that
depend on an open decision cite it; tick them against the answer recorded in
§ 22. Every border the boards draw `#818a99` is checked as `control-line`
(#878f9d), every popover border as `popover-line` (§ 3 item 0).

### LX-D · 1440 desktop, paid

- [ ] Content padding 26/28, gap 18; h1 "Look" 24/32 600 on `#f6f7f9`; subtitle 13.5/20 `#5b6472`, margin-top 4
- [ ] Jump index bar: padding 6, gap 4, white, border, radius 6, shadow `0 1px 2px rgba(16,24,40,.05)`
- [ ] Index order: Preset · | · STYLE · Colour · Brand · Type · Shape · Buttons · | · SITE PARTS · Header · Footer · Language switcher · | · Expand all
- [ ] Group links 11px 600 .06em uppercase `#5b6472`, h32
- [ ] Card links h32, 13px 500; Footer current: `#eef2ff`, `#3730a3`, 600, `aria-current="location"`, 7px dot, sr ", unsaved changes"
- [ ] Dividers 1×20 `#e5e7eb`, aria-hidden
- [ ] Expand all ghost 13px 600 `#3730a3`
- [ ] Edit column 500, gap 20; preview 596, gap 12; columns gap 24
- [ ] Preset strip: padding 12 14; "Preset" 14/600; description 12.5 `#5b6472`; "Reset to preset" btn-sec btn-sm at the right
- [ ] Console chip: h40, padding 0 12 0 6, border `#878f9d`, 28×28 swatch `#eef1f5` ">\_" mono
- [ ] Editorial chip checked: 1.5px brand border, 3px `#eef2ff` ring, swatch `#f6efe4` "Aa" Fraunces, trailing stroke check
- [ ] "STYLE" label 11/14 600 .06em uppercase, margin 0 0 8 2
- [ ] Style card: Colour (14×14 `#0d6466` swatch + "Hue 192 · logo follows accent"), Brand "Logo uploaded · No favicon", Type "Fraunces · Inter", Shape "Medium · Default · Accent bar · Outlined", Buttons "Busy label · Follow the preset"; all folded, chevrons right
- [ ] Rows min-height 52, padding 0 16, gap 12; titles 132 wide 14/600; summaries 13px `#5b6472` ellipsis; dividers `#eef0f3`
- [ ] "SITE PARTS" label; Header folded "Classic · Full width · Dropdown · Pill with label"
- [ ] Footer open: chevron down, inset 3px brand bar, title "Footer" + dot ("Unsaved changes"), empty summary
- [ ] Footer body padding 2 16 18 44, gap 16; description first
- [ ] Footer layout segmented Columns✓ / Centred / Compact / Big wordmark + hint
- [ ] Background + field dot ("Unsaved change"), Plain / Shaded✓ / Brand tint + hint
- [ ] Surface Full width✓ / Card + hint
- [ ] Cookie settings button Hidden / Shown✓ + hint
- [ ] Segmented track padding 2, gap 2, `#f6f7f9`, border `#878f9d`, radius 4; buttons h30, radius 3, 13px 500; pressed white, 600, 1.5px brand inset
- [ ] Language switcher folded "Menu with globe"
- [ ] h2 "Live preview" 15/650; readout "1280 px wide · shown at 44%" mono 12
- [ ] Toolbar: Device (Desktop✓, Tablet, Phone) · Scheme (Light✓, Dark) · Reader (Signed out✓, Signed in) · spacer · Follow✓ · Full screen
- [ ] Tracks padding 2, gap 2, `theme-track`, border `control-line`, radius 5; buttons 32 (D-6); solos 34
- [ ] Stage `#eef0f3`, radius 6, padding 16
- [ ] Desktop frame: border `#878f9d`, radius 6, shadow; browser bar 28 with 3 dots and "fieldnotes.valstack.dev"; 564×352 at 0.4406
- [ ] Sample scrolled to the end; footer outlined 2 screen px + tag "Footer" above it
- [ ] Cookie button floating bottom-left in the sample
- [ ] Scrollbar thumb top 14% height 86%
- [ ] Status: crosshair + "Following **Footer** — outlined in the frame. The whole sample nearly fits at 1280 px, so the frame scrolls only its last 120 px."
- [ ] Unsaved bar (#6413's docked bar): dot · "1 unsaved change" · "in" · "Footer" link · kbd "⌘S / Ctrl+S" · Discard · Save changes; 13.5px
- [ ] Sample brand: the seed's uploaded logo in the 32×32 box (the boards' teal wave square is that image); a tenant with no logo shows the generated three-layer mark
- [ ] Bar link "Footer": 600, `brand`, underlined, hover `brand-strong`
- [ ] Sample 1280: header 72 with brand, Posts / About / Topics▾, EN▾, moon, Sign in; hero h1 44, para, Subscribe / Read more / Sending…; Latest posts h2 + 2 cards with meta lines; footer Shaded with Read / Site groups, © line, Privacy policy, Cookie settings; no "4 min read" chip, no Newsletter panel

### LX-A · Phone selected, Footer open

- [ ] Same edit column at 520 (Preset, Style rows, Footer open with the same fields, dots, values)
- [ ] "Live preview", "390 px wide · shown at 72%", Phone✓ Light✓ Signed out✓ Follow✓
- [ ] Phone frame: light bezel border `#878f9d` radius 18 padding 6, inner radius 12, 281×608 at 0.72
- [ ] Sample 390 at the end; footer outline + tag above; cookie button; thumb top 22% height 78%
- [ ] Status "Following **Footer** — scrolled to the end of the page." + ghost "Top of page" with arrow-up 14; it shows only while the frame is at the end and scrolls it to the top
- [ ] Cookie button fixed at the device viewport's bottom-left (16 / 16 sample px), scaled with the frame, aria-hidden

### LX-B · Phone, Header open

- [ ] Header row open; Layout select "Classic" (min-width 220) + hint
- [ ] Note "The preview is on Phone, so it shows the bar with a menu button." (12.5px `#12141a`, wrap, gap 8) + "Show on Desktop", a button styled as the `.lnk` link (12.5px 600 `#3730a3`, underline offset 2, monitor icon 14 `#3730a3`), announced as a button; clicking switches to Desktop
- [ ] The compact "Header · open" excerpt is not built (D-31); the open row is the § 9.2 row
- [ ] "Preview", "390 px · 72%"; frame at the top; header outlined + tag "Header" hanging below
- [ ] Thumb top 0 height 78%; status "Following **Header** — back at the top of the page."
- [ ] Cookie button still visible bottom-left with the frame at the top
- [ ] Footer → Header scroll is smooth; instant with reduced motion

### LX-C · Tablet, Header open

- [ ] Note "The preview is on Tablet, …" + "Show on Desktop"
- [ ] "820 px · 48%", Tablet✓; tablet frame radius 14 padding 6, inner 8, 394×566 at 0.48
- [ ] Sample 820: bar header (brand, account circle, menu), h1 38, 2 card columns
- [ ] Outline + tag below the header; no scrollbar
- [ ] Status "Following **Header**. The sample fits one tablet screen, so following only outlines."

### LX-D2 · Scrolled by hand

- [ ] Wheel / trackpad / touch scrolls the frame; sample takes no clicks or focus
- [ ] Follow `aria-pressed="false"`; no outline, no tag; thumb top 30%
- [ ] Status pause icon + "You scrolled the frame. Following is paused." + btn-sec btn-sm "Back to Footer" (crosshair); clicking resumes; opening another card resumes

### LX-E1 · 390 Edit tab

- [ ] No visible h1 or subtitle; the tablist sits directly under the top bar (sr-only h1 per D-28)
- [ ] Tabs named "Look view": underline style, 44 high, Edit selected `#3730a3` 600 + 2px brand underline; sticky under the top bar (D-26)
- [ ] Index chips 44, radius 22, group labels between (not links), Footer current with dot, left fade when scrolled; no Expand all, no dividers
- [ ] Site parts: Header two-line row (56) with right-pointing 16 px chevron, title and summary; Footer open (48) with down chevron, title and dot, inset brand bar
- [ ] Footer body padding 0 16 16; description shown (D-27); each field label → hint → control
- [ ] Footer layout: 2-column grid of 44 buttons, Columns pressed (1.5px brand border, `#eef2ff`, `#3730a3` 600); Background with field dot, Shaded pressed
- [ ] Edit body bottom padding 120 with the bar showing (24 with a clean form, LXG-D2) — #6388's, below 768
- [ ] Bottom bar edge to edge: dot · "1 unsaved change" (700) · "in" · "Footer" link, then Discard + Save changes 44 in two columns; no "⌘S / Ctrl+S"

### LX-E2 · 390 Preview tab

- [ ] No visible h2 (sr-only per D-28)
- [ ] Row 1, the toolbar: Device (Phone✓), Scheme (Light✓), Reader (Signed out✓), all 44; one Tab stop, arrows inside; Signed-in tooltip right-aligned
- [ ] Row 2: "390 px · shown at 62%" + Follow✓ and Full screen 44×44, gap 6, outside the toolbar — two further Tab stops, tooltips right-aligned
- [ ] Stage padding 10; frame 242×523 at 0.62 at the footer, outline + tag; cookie button; status "Following **Footer**" with no "Top of page"
- [ ] Preview opens at the last card open on Edit

### LX-F · Toolbar focus

- [ ] Tab lands on the pressed device; Arrow Right moves to Tablet; tooltip "Tablet · 820 px" shows at once (shared Tooltip look, X1)
- [ ] Focus on Dark shows tooltip "Dark"
- [ ] Home / End jump to the ends; Tab leaves the toolbar
- [ ] Hover tooltip appears after Base UI's hover delay; Escape hides it; tooltip aria-hidden
- [ ] Follow and Full screen tooltips aligned to the button's end edge

### LX-G · Free, Footer open (as superseded by LXG)

- [ ] No Reset to preset
- [ ] Badges are the text-only `.gb`, never the lock-icon badge
- [ ] Footer lock line reads "Fields marked Growth keep the Editorial preset's value."
- [ ] No reader group; status adds "Reader accounts are off for this site, so there is no reader switch."

### LX-H · Preset strip scaling

- [ ] 2 presets: both chips at 1440, 1280 and phone (44 chips + full-width Reset 44)
- [ ] Fixtures (unit tests; added locally for the manual test) with 5 and 12 presets: chips as fit, selected always a chip in the last slot, More presets with count pill and name "More presets, {n} more"
- [ ] Phone overflow: one 56 px Preset button (swatch, name, description, "{n} presets", chevron) + Reset
- [ ] Popover: "Choose a preset" / "{n} presets"; 2-col grid of 64 px options; focus starts on the selected; arrows, Home / End; Enter chooses and closes; Escape / Tab out / outside click closes with focus back on More presets; after a choice focus on the chosen chip
- [ ] Sheet: scrim, handle, "Choose a preset" + Close 44, 64 px rows (36×36 swatch, name 13.5 600, description 12.5 / 17 `#5b6472`, gap 2), selected row tint + inset bar + check, max 85% height, closes on Close / Escape / swipe down
- [ ] Phone Preset card padding 12

### LXG-D · 1440 Free

- [ ] Growth note collapsed above the preset strip (G2 values: border `rgba(79,70,229,.3)`, shadow, padding 14 16, title + "Options marked [Growth] on this page open up on the Growth plan.", button 12px 500 with shadow)
- [ ] Preset strip without Reset
- [ ] Index: Type current, no dots
- [ ] Colour, Brand: no badge
- [ ] Type open: description; lock line "On Free, Type keeps the Editorial preset's fonts. Picking another preset changes them."; Heading font + badge, locked select "Fraunces" in Fraunces; Body font + badge, locked select "Inter"
- [ ] Shape "Small · Compact · Outlined · Outlined" + badge; Buttons + badge
- [ ] Header + badge; Footer "Columns · Brand tint · Full width · Cookie button shown", no badge; Language switcher "Menu with code · One language" + badge (D-7)
- [ ] Preview: no reader group; Desktop frame at the top, no outline / tag; thumb top 0 height 86%
- [ ] Sample header: no "Sign in" pill and no language switcher (reader accounts off, one language — D-34; the board's Sign in and EN are not built)
- [ ] Status "Type changes the whole page, so the frame stays where it is. The sample uses the Editorial preset's values, the ones a Free site publishes." + reader line
- [ ] Sample in Editorial values: radius 4 buttons, Outlined cards, Brand-tint footer

### LXG-A · Note expanded

- [ ] Button "Hide" + chevron-up, `aria-expanded="true"`
- [ ] Panel under the note (G2 values): 6 links in a 2-column grid, each 44 tall, `#4f46e5` 13px 600 names + 12px descriptions
- [ ] Closing line with "(with a choice of language switcher style)"
- [ ] "Ask about Growth" primary (13px 500, shadow)
- [ ] Preset strip pushed down only while open; Hide folds it
- [ ] Each link opens its card and moves focus to its row button

### G2 desktop · Free fields LXG does not open (§ 15.5 table)

- [ ] Colour open: Accent hue live, no badge; Logo hue + badge, locked "Follow accent hue"
- [ ] Shape open: Radius scale, Density, Card style, Header buttons, each + badge, locked with the preset values
- [ ] Header open: Layout ("Classic") and Sub-menus, and every other field, each + badge, locked
- [ ] Buttons open: every field + badge, locked
- [ ] Brand open: Logo and Favicon live, no badges
- [ ] Lock lines per D-32

### LXG-C · Folded overview

- [ ] Note collapsed; every row folded; badges only on Type, Shape, Buttons, Header, Language switcher

### LXG-B · Footer open, Phone preview

- [ ] Lock line "Fields marked Growth keep the Editorial preset's value."
- [ ] Footer layout / Background / Surface: label + badge, locked segmented (bg `#f6f7f9`, border `#c5cad3`, pressed 1px `#878f9d` inset), values Columns / Brand tint / Full width; buttons focusable, announce disabled, ignore activation
- [ ] Cookie settings button live, Shown
- [ ] Phone preview following Footer, outline + tag, cookie button; reader line; no "Top of page" although the frame is at the end
- [ ] Reaching a locked field never reopens the note

### LXG-D2 · 390 Free first view

- [ ] Index at start, current Preset, right fade
- [ ] Growth note collapsed; button a 44 px target (G2 phone)
- [ ] Preset chips 44, no Reset
- [ ] Style rows in the LX-E1 form with summaries, 12×12 colour swatch and trailing badges (D-17)
- [ ] No unsaved bar

### LXG-E · Focus order

- [ ] Hide → the 6 G2 links (order per D-5; not LXG-E's 7) → Ask about Growth → next stop per D-2
- [ ] Hide: Enter / Space folds; focus stays on the button, now "See what's included"

### LXG-F · Language switcher on Free

- [ ] Open: "Your plan publishes one language. Upgrade to add languages and choose a switcher style."; Style + badge; hint; locked segmented Menu with code✓ / Menu with globe / Compact codes (D-7)
- [ ] Folded: "Menu with code · One language" + one badge
- [ ] A Growth site with one language still shows "Add another language in Languages settings to choose a style."

### G2-1 … G2-6 · Note and badge anatomy

- [ ] G2-1 collapsed note exactly as § 15.1
- [ ] G2-2 expanded exactly as § 15.2
- [ ] G2-3 focus rings on Hide, a link, Ask about Growth (2px offset 2)
- [ ] G2-4 phone collapsed: button 44, wraps under the text; Preset in the first view
- [ ] G2-5 phone expanded: one-column links 44, Ask about Growth 44
- [ ] G2-6 badge beside the label; locked option `aria-disabled`, in the Tab order; group named label + badge
- [ ] G2-10: Growth and archived sites show no note and no badges

### GF-A … GF-D · Full-screen dialog (gap-look-fullscreen)

- [ ] 1440, opened from the keyboard: the dialog covers the window (sidebar, top bar and save bar included), the page behind is inert and does not scroll, no animation
- [ ] Head is one 60 px row: "Live preview" (15 / 20 px, 650, on one line), readout "1280 px wide · shown at 100%", toolbar Device · Colour scheme · Reader (no Follow), a 1 px rule, Close 34×34 at the right; padding 0 16 0 24, gap 16, white with a bottom `line` border; the toolbar never wraps; the rule an aria-hidden 1×24 `line` span; Close outside the toolbar, so arrow keys never reach it
- [ ] Stage: no radius, fills the dialog, frame aligned to the top, its own inset focus ring; no status line
- [ ] Focus lands on the pressed Desktop button with its tooltip at once (GF-A); Tab goes to Close with the end-aligned tooltip "Close full screen" (GF-B), then the stage, then back to the toolbar
- [ ] Stage padding 24; the 1280 frame at 100%, scrolling its last 39 px; the stage is a region named "Sample page at 1280 px" and arrow keys scroll it; the frame inside has no `role="img"`, so the name is read once
- [ ] 1024 window: Desktop 76%, Tablet and Phone 100%
- [ ] 390 phone (GF-C): heading and Close 44×44 in row 1, the toolbar of 44 px buttons in row 2, readout "390 px · shown at 91%" in row 3; grid `minmax(0,1fr) auto`, first row at least 44, gaps 12 / 8, padding 8 16 10, white with a bottom `line` border; h2 16 / 22 600; stage padding 10; Phone at 91%
- [ ] 390 phone with Desktop (GF-D): 100%, pans both ways with arrow keys from the stage; readout "1280 px · shown at 100%"; a horizontal scrollbar (left 4, right 12, bottom 3, height 5, thumb 29%) beside the vertical one (right 3)
- [ ] Escape or Close returns focus to Open preview full screen; a device or scheme picked inside stays picked on the page

### GC · Every row open (gap-look-collapse-all)

- [ ] After Expand all every row is open (Colour, Brand, Type, Shape, Buttons, Header, Footer, Language switcher), each with its 3 px bar and an empty summary
- [ ] The index button reads "Collapse all" in the same place, size and colour (about 8 px wider; nothing else in the bar moves)
- [ ] Current link Preset (topmost card in view), updating as the page scrolls; Footer keeps its dot
- [ ] The frame does not move and nothing is outlined; status crosshair + "Every card is open. Focus a Site parts card and the frame scrolls to it."
- [ ] Language switcher open shows its field label "Style"
- [ ] Colour: description; Accent hue — 40×40 swatch (the shared `AccentSwatch`), 10 px hue track, mono "hue 192°" 62 px wide, gap 14, range named by the label; Logo hue — fieldset, hint, the "Follow accent hue" Switch on (GC's checkbox not built, D-39); the thumb is #6330's and is not ticked here
- [ ] Brand: description, formats line 8 px under it; Logo + "optional", 52×52 thumb with the logo, "Replace logo" (upload icon) and "Remove"; Favicon + "optional", empty dashed thumb, "Upload favicon"
- [ ] Shape: Radius scale, Density, Card style segmented with hints; Header buttons — fixed hint above, two-line options each with its own description inside (padding 6 10, max-width 146, label 13 / 18, description 11.5 / 16 `#5b6472`)
- [ ] Buttons: While busy segmented Busy label✓ / Label kept / Progress edge; Spinner select "Follow the preset"
- [ ] Header: Layout select, then Sub-menus, Bar, Account button, Account panel and "On phones, the account sits" segmented, each with its hint (§ 10.5)
- [ ] From here, opening a folded row by hand folds every other open row
- [ ] The save bar and the preview's 80 px clearance are unchanged
- [ ] Collapse all folds every row; folding one row by hand turns the button back to "Expand all"

### GS-A … GS-C · Save bar with changes in several cards (gap-look-savebar-multi-card)

- [ ] 1440 with Colour, Type and Footer changed (Footer: layout and background): "4 unsaved changes in 3 cards", "in 3 cards" muted and not a link; dots on Colour, Type and Footer in the index and on their rows (GS-A)
- [ ] 390 Edit tab (GS-B): the edge-to-edge bar on one line, "4 unsaved changes in 3 cards", Discard and Save changes 44 px; three chips with dots; with every card folded, the rows show their dots (summaries per § 9.3, not GS-B's illustrative ones)
- [ ] GS-C: "1 unsaved change in Footer" and "3 unsaved changes in Footer" with "Footer" a link; "2 unsaved changes in 2 cards" and "9 unsaved changes in 6 cards" with no link; desktop with "⌘S / Ctrl+S", phone without
- [ ] Save, Discard and ⌘S / Ctrl+S act on every card at once

### GO-A … GO-E · Follow states (gap-look-follow-states)

- [ ] GO-A, first load: every row folded, Preset current, Follow pressed, frame at the top, no outline or tag, status crosshair + "Open a Site parts card and the frame scrolls to it."; the same line after Collapse all, or when the open Site parts row folds
- [ ] GO-B, Desktop, Header opened first: the frame does not move; outline and the "Header" tag; "Following Header — outlined in the frame."
- [ ] GO-C, Phone, Follow off, Footer open: nothing scrolls and nothing is outlined; pause icon + "Following is off. The frame stays where you leave it."; no trailing button; pressing Follow scrolls to Footer
- [ ] GO-D, Phone, after Top of page: frame at the top, outline and tag gone, Top of page hidden, pause icon + "You scrolled the frame. Following is paused." + "Back to Footer" (44 px below `lg` and on touch)
- [ ] GO-E, Desktop, Footer then Language switcher: Footer folds as Language switcher opens (only Language switcher `aria-expanded="true"`); frame back at the top, header outlined, tag "Language switcher", "Following Language switcher — back at the top of the page."; Language switcher is the current link; opened first from the top it reads "Following Language switcher — outlined in the frame."
- [ ] On Tablet and Phone, following Language switcher outlines the bar with the tag "Language switcher"

### GW-A … GW-C · Mid widths (gap-look-mid-widths)

- [ ] 1024 window, sidebar open (content area 704): page heading visible; the tablist "Look view" (white bar, 1 px `line`, radius 6, padding 0 16, `shadow-admin-index`; tabs 44, Edit selected 600 `#3730a3` with a 2 px `#4f46e5` underline; hover turns Preview `#12141a`, Edit stays `#3730a3`) under it; the Edit tab's column fills the 704 px area; the desktop index bar directly under the tablist; both stick under the top bar while the Edit body scrolls — the tablist at the top bar's height (z-index 21), the index at top bar + 46 (z-index 20), meeting with no gap once stuck and never stacked over the tablist
- [ ] GW-A: the index scrolled so Footer (current) is in view, fades at both ends, Expand all and its divider pinned outside the scroller; 32 px controls; the save bar is #6413's docked bar (sidebar edge to window edge, 64 tall, padding 0 26), on the Edit tab only — GW-A's 28 px floating inset is LX's superseded bar (§ 11)
- [ ] GW-B, Preview tab: index and save bar hidden; "Live preview" and "1280 px wide · shown at 52%"; the desktop toolbar (32 px) with Reader, Follow and Full screen; stage padding 16, a 670 px frame; opened after editing Footer on the Edit tab, the frame is at Footer, outlined, and the status reads the desktop line "Following **Footer** — outlined in the frame. The whole sample nearly fits at 1280 px, so the frame scrolls only its last 120 px." (§ 13), not the phone "Following Footer"
- [ ] GW-C, 1280 window: two columns 460 + 24 + 476; index not scrolled, right fade only, Expand all pinned; "Live preview" and "1280 px wide · shown at 35%"
- [ ] From about a 1300 px window the whole index fits and both fades go

### Not drawn (settled by rule, ticked against § 22)

- [ ] Tablet in a 596 px pane: 422×608 at 0.515, "820 px wide · shown at 52%" (D-33)
- [ ] Phone Preview tab with unsaved changes: no bar and no index chips; both back on Edit
- [ ] Dirty form at 1440: the save bar never covers the status line or its buttons (D-40)
- [ ] Locked Logo hue on Free: the switch, on, focusable, announces disabled, no opacity (D-39)
- [ ] Locked segmented below `lg` (Free at 390, Footer open): the 2-column 44 px grid with `#f6f7f9` buttons, `control-line-locked` borders and `#5b6472` text; the pressed one white with a `control-line` border and `#12141a` 600 text; no indigo, no opacity (§ 16)
- [ ] Footer inside the 820 and 390 frames: its groups grid and bottom row follow the frame (#6306); its top row (§ 14.2: a row, gap 40, at 820; a column, gap 24, at 390) is as § 22 D-9b answers
- [ ] Post cards inside the 820 and 390 frames: as § 22 D-9b answers
- [ ] 820 window (no board): the tabbed layout below `lg` (§ 16) — tabs, chip index, 56 / 48 rows, 2-column 44 px segmented grid — and #6413's docked bar without the shortcut hint (§ 11); Preview tab: every switch in one row of 44 px buttons
- [ ] Full screen in a 1024 window on a mouse: the one-row head, 32 px buttons, Close 34×34, stage padding 24, Desktop 76% (§ 12.4 "Which head")

## 25. Out of scope (optional follow-up)

Not filed by this set; listed so a reviewer does not flag them as missing.

- G2-8's operator card ("This tenant is on Free …") and G2-9's downgraded card
  ([DOWNGRADE SIGNAL]) — D-4. The operator sees the owner's badges and locked
  fields (D-29).
- G2-7's long page and G2's own page layout (stacked section cards, tiles,
  text preview toggles, the Kitchen Table Recipes sample) — superseded by LX.
- LXG-A's own Growth panel (region, headings, seven links) and LXG-D2's
  full-width note button — G2 owns the note (§ 3 item 2).
- LX-H's hypothetical presets 3–12 in the registry — test fixtures and local manual-test setups only (D-3).
- PV2's busy-button animation (PV2 E) and its device-frame layout — LX
  supersedes them.
- The shell drawn around every Look board — the shell set builds it (§ 6.1).
- Pages other sets drew only as a backdrop (TH1's Tenants and Features, SH1
  F3 / F11 bodies) — resolutions § 3; none of them touches Look.
- Drafts dropped from this set because another set owns the primitive (never
  filed here): Icon sizes (NEW-look-2 → #6361), platform glyphs
  (NEW-look-3 → #6404), the shared Tooltip (NEW-look-4 → #6370); and
  NEW-look-13 (PreviewFrame slots), merged into #6390.
