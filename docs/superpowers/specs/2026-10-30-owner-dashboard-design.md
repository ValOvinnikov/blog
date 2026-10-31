# Owner dashboard: Overview layout B and the Studio status line

Design of record for the owner dashboard Overview (`/dashboard`), the
sidebar's Studio item and the Studio page's access buttons, from the
2026-10-30 design round, reconciled with the shell (SH1), theme (TH1), Look,
Voice and onboarding sets by the cross-set resolutions
(`docs/superpowers/specs/2026-10-30-admin-redesign-resolutions.md`, which #6314 lands beside this doc;
"resolutions §N" and the X-numbers below point into it). The agreed canvas is
the visual reference: https://claude.ai/artifact/LVch29ZcSE9Lh5T3Cocm9J
(owner-only). Boards:

| Short name | Board on the canvas                                                           | What it decides                                                                                     |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| LB-D       | `dash-LB-site-band-desktop` — "LB · Site band" at 1440×900                    | The page at 1440: cards, band, pills, heading, detail lists, tiles                                  |
| LB-S       | `dash-LB-site-band-states` — "LB · Site band — states and widths"             | 1280 stress, 1920, 390 ×2, width rules                                                              |
| DB3-D      | `dash-DB3-inline-status-desktop` — "Studio inline status" at 1440             | Studio line in context (its page layout is void)                                                    |
| DB3-S      | `dash-DB3-inline-status-states` — "DB3 · Inline status under Studio — states" | Studio line states, copy, icons, focus, phone menu, heading edge cases, Studio page button emphasis |
| BAND-820   | `gap-dash-band-820` — "Overview at 820 and 1024"                              | The Overview from 768 to 1023 and its return to the desktop values at 1024                          |
| NOTICES    | `gap-dash-notices`                                                            | Where ArchivedTenantNotice and SiteSetupCard sit on the Overview                                    |
| RAIL-BADGE | `gap-dash-studio-rail-badge` — "Studio rail badge"                            | The Studio corner badge and tooltip on the collapsed grey rail                                      |
| SH1-TH1    | `gap-shell-sh1-in-th1` — "SH1 shell in TH1 colours" (shell set)               | Context only: the shell every dashboard frame sits in (SH1 geometry, TH1 colours, Light and Dark)   |

**Four boards are not yet on the canvas.** BAND-820, NOTICES, RAIL-BADGE and
SH1-TH1 exist as board files in the design project but are missing from the
canvas's `canvas.json` and its published file list, so their names in a ticket
resolve to nothing. Resolutions §6 says undrawn frames are drawn before filing;
these four are drawn but not published. Each must be published to the canvas
before any ticket citing one of its frames is filed. Those tickets carry the
dependency as "<board> on canvas": BAND-820 for #6355, #6356,
#6357, #6360 and #6289; NOTICES for #6355 and #6289; RAIL-BADGE
for #6361, #6363 and #6365; SH1-TH1 for #6362,
#6364 and #6365; all four for the manual test #6368, and BAND-820, RAIL-BADGE
and SH1-TH1 for its Dark pass #6369. The LB and DB3 boards are on the
canvas.

Every value below is copied from the board source (the `.dc.html` files), never
measured from a render and never rounded. Where boards disagree, the
precedence rule (§1) says which wins, and §2 lists every frame whose values are
void.

This doc lands on `main` in #6314, the one docs-only PR that carries all six
reconciled specs, before any ticket that links it is filed, so every ticket's
Design link resolves. Every ticket in this set depends on #6314.

## Why

Manual QA, 30 Oct. The dashboard heading shows a plan pill it does not need.
The Studio item always shows a pill, including a "Ready" one that never clears.
"Your site" sits beside Domain and Owner stacked in a second column, which
leaves a large empty area at its foot. Earlier admin mocks shipped with items
missing and styles drifted, so this doc names every element per frame and ends
in a checklist a reviewer ticks against the build.

## Goals

- The Overview reads as layout B: a full-width "Your site" band, Domain and
  Owner as two equal-height cards side by side from 768px, Make it yours below.
- The heading drops the plan pill on the owner dashboard only.
- The Studio item shows its access state as one muted line under its label
  while access is not ready, and nothing at READY; collapsed, a corner badge
  and a tooltip.
- Card chrome, pills, heading and detail lists match the LB boards, in TH1
  colours.
- Everything today's Overview shows stays.

## Non-goals

- The shell itself: sidebar box, rows, rail, top bar, breadcrumb, account menu,
  phone Menu, workspace switcher (shell set: #6287, #6370 … #6379).
- The palette and its tokens, the grey light sidebar, the dark palette and the
  theme switch (theme set: #6288, NEW-TH1-*, #6291).
- The shared Tooltip primitive (#6370); this set only consumes it.
- A first-open signal for Studio. Option (b) of DB3 was not chosen; the line
  clears at READY and "Ready — open to start writing" is never built, however
  many boards draw it (LB-S F3, BAND-820 F28/F30). SH1-TH1 does not draw that
  line: its Studio row carries SH1's `ok` "Ready" pill, which is void too (§2).

## Decisions in force

| #   | Decision                                                                                                                                                                              | Date / source                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| D1  | Overview layout B ("site band")                                                                                                                                                       | 30 Oct                              |
| D2  | Studio status as DB3 (inline line, no pill)                                                                                                                                           | 30 Oct                              |
| D3  | The Studio line clears at READY (DB3 option (a)). Every "Ready — open to start writing" line on a board is void and must not ship                                                     | 30 Oct                              |
| D4  | Keep all of today's dashboard content; nothing is removed except the heading's plan pill                                                                                              | 30 Oct                              |
| D5  | Cards, pills, page heading and detail lists match the LB boards                                                                                                                       | 30 Oct                              |
| D6  | The operator tenant Overview (shared `TenantPageHeader`) keeps its plan pill (DB3-S F27)                                                                                              | 30 Oct (board proposal, carried)    |
| D7  | The precedence rule (§1): shell structure SH1; colour and tokens TH1; cards, pills, heading, detail lists LB; tooltip LB look with Base UI timing; undrawn frames drawn before filing | 30 Oct, user ("Yes, use that rule") |
| D8  | The band and the Pair switch at **768**, as LB-S states; BAND-820 draws how 768–1023 holds (X26)                                                                                      | resolutions X26 / O10               |

## 1. Which board wins where

The user's precedence rule (D7), as the resolutions apply it to this set:

| Kind of detail                                                                                                    | Source                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Card chrome, band, Domain / Owner cards, detail lists, tiles, status pills, page heading                          | **LB** (LB-D, LB-S), with BAND-820 for 768–1023 and NOTICES for the notices |
| Studio line: which states exist, copy, icons, when it clears, the collapsed badge-and-tooltip model, page buttons | **DB3** (DB3-S); the line's own geometry is LB's (`.st`, O18)               |
| Collapsed-rail badge on the grey sidebar                                                                          | **RAIL-BADGE**                                                              |
| Every row, rail, top bar, breadcrumb, account and phone Menu value                                                | **SH1** (via SH1-TH1); this set builds none of it                           |
| Every colour: palette, sidebar grounds, row hover, pill grounds, control borders, focus ring                      | **TH1** tokens (via SH1-TH1 and the theme spec)                             |
| Tooltip                                                                                                           | LB look, Base UI's default hover delay, at once on keyboard focus (X1)      |

Consequences that change earlier drafts of this doc:

- DB3's dark-sidebar colours (#a3abb9, #fbbf24, #a5b4fc, #f87171, #fca5a5,
  white-on-focus) are void. The Studio line takes TH1 tokens: light values now
  (the grey sidebar ships in #6288), dark values with #6291.
- LB's shell values (68/64px top bar, "Admin navigation" > "Sections"
  landmarks, 28px brand mark, "Workspace" label, up-down chevron, chevron
  breadcrumb, "Dashboard › Overview") are void. SH1 draws the Overview
  breadcrumb as the single crumb "Dashboard" (X9).
- DB3's 44×44 collapsed item, 76px rail padding and 56px phone row are shell
  geometry and give way to SH1's rows.

## 2. Frames and breakpoints

| #       | Board      | Frame label (verbatim)                                                                                                                                   | Viewport | State                                                                                                                          |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| F1      | LB-D       | (whole board)                                                                                                                                            | 1440×900 | Field Notes, Active, Growth, domain Verified, owner joined Sep 12 2026, Studio "Invite sent — check your email", Leads "2 new" |
| F2      | LB-S       | "1280 · sidebar 264px, content 964px · long tenant name, long email, pending custom domain, Free, owner invited and not signed in, Studio invite sent"   | 1280×900 | Long-name stress                                                                                                               |
| F3      | LB-S       | "1920 · content capped at 1180px, left-aligned · Growth, verified, Studio ready to open, collapse tooltip on focus · shown at 69%"                       | 1920×820 | Field Notes; Studio READY (a plain item, D3)                                                                                   |
| F4      | LB-S       | "390 · Growth, verified"                                                                                                                                 | 390×1560 | Phone                                                                                                                          |
| F5      | LB-S       | "390 · long name and email, pending custom domain, Free"                                                                                                 | 390×1560 | Phone stress                                                                                                                   |
| F8–F12  | DB3-S      | "1 · Invite sent", "2 · Activating", "3 · Action needed (stalled)", "4 · Ready, never opened", "5 · Ready, used"                                         | 264 nav  | Studio states                                                                                                                  |
| F16–F18 | DB3-S      | "Invite sent · Studio page", "Activating · Studio page", "Action needed · Studio page"                                                                   | 688      | Studio current, access card and its buttons                                                                                    |
| F19     | DB3-S      | "Collapsed (76px), focused"                                                                                                                              | 360      | Collapsed model (badge, tooltip, description); superseded on the grey rail by RAIL-BADGE                                       |
| F20     | DB3-S      | "Keyboard focus, expanded"                                                                                                                               | 264      | Focus wraps both lines                                                                                                         |
| F21     | DB3-S      | "Operator · tenant detail"                                                                                                                               | 264      | No line                                                                                                                        |
| F22     | DB3-S      | "Long locale · Invite sent (de)"                                                                                                                         | 264      | Wrapping                                                                                                                       |
| F23     | DB3-S      | "Menu open · Action needed"                                                                                                                              | 390×640  | Phone menu Studio row                                                                                                          |
| F24     | DB3-S      | "Dashboard heading" (section "Phone · 390")                                                                                                              | 390×640  | **Void: superseded by LB-S F4**                                                                                                |
| F25–F27 | DB3-S      | "Long tenant name", "Archived", "Operator · tenant overview (shared header)"                                                                             | 640      | Heading edge cases: **layout and copy only** (§9)                                                                              |
| F28     | BAND-820   | "820 · Growth, verified, Studio ready · content 504px"                                                                                                   | 820      | Typical at 820                                                                                                                 |
| F29     | BAND-820   | "820 · long name and email, pending custom domain, Free, owner invited and not signed in, Studio invite sent"                                            | 820      | Stress at 820                                                                                                                  |
| F30     | BAND-820   | "1024 · Growth, verified, Studio ready · content 708px"                                                                                                  | 1024     | Typical at 1024 (desktop values)                                                                                               |
| F31     | BAND-820   | "1024 · long name and email, pending custom domain, Free, owner invited and not signed in, Studio invite sent"                                           | 1024     | Stress at 1024                                                                                                                 |
| F32     | NOTICES    | "A. Archived tenant" — "ArchivedTenantNotice, 1440"                                                                                                      | 1440     | Archived notice in place                                                                                                       |
| F33     | NOTICES    | "B. Site setup stopped" — "SiteSetupCard with its error Alert and open steps card, 1440"                                                                 | 1440     | Setup card in place, Connect domain failed, 3 of 6 done                                                                        |
| F34–F37 | RAIL-BADGE | "1 · Invite sent", "2 · Activating", "3 · Action needed (stalled)", "4 · Ready (never opened or used)" (section "Each access state · pointer on Studio") | rail     | Badge and tooltip per state, pointer on Studio                                                                                 |
| F38     | RAIL-BADGE | "At rest, pointer elsewhere"                                                                                                                             | rail     | Badge on the rail ground, no tooltip                                                                                           |
| F39     | RAIL-BADGE | "Studio is the current page"                                                                                                                             | rail     | Badge on the white plate                                                                                                       |
| F40     | RAIL-BADGE | "Keyboard focus, not hovered"                                                                                                                            | rail     | Ring, tooltip at once                                                                                                          |
| F41     | RAIL-BADGE | "Long locale (de) · Invite sent"                                                                                                                         | rail     | Tooltip grows, never wraps                                                                                                     |
| F42     | RAIL-BADGE | "C1 · 1376 × 760 · owner invited to Studio, not yet accepted"                                                                                            | 1376×760 | Overview with the rail collapsed                                                                                               |

Frames whose values are void:

- **DB3-S F24** draws an older phone page (h1 24/32, 260px basis, 6px gap, a
  15px card title on #fbfbfd, a white 60px top bar, a text "Menu" button, an
  "AM" avatar). LB-S F4 is the only phone heading reference; the top bar is
  SH1's.
- **DB3-S F23** counts only for the menu's Studio row content (label, line,
  icon, tone). Its top bar, row padding and 56px height are void (SH1 rows).
- **DB3-S F19** counts for the model only: badge, tooltip, description, name.
  Its dark colours, 44×44 item, 14px 12px rail padding and 8px item gap are
  void (SH1 rail, TH1 colours, RAIL-BADGE values).
- **DB3-S F25–F27** count for layout and copy only (§9).
- **DB3-D** counts only for the Studio line in context; its page is void.
- **LB-S F3, BAND-820 F28 and F30** draw Studio READY with an `ok` line
  "Ready — open to start writing" (BAND-820 marks it "new copy"). Void (D3): at
  READY Studio is a plain item.
- **SH1-TH1's Studio "Ready" pill** in every frame that draws the expanded
  sidebar or the phone Menu (L1–L4, D1–D4, P1, P2): an `ok` pill with a dot,
  #16794d on #e7f6ee (Light) / #6ee7a7 on #10291d (Dark). Its token legend's
  two entries "`ok` · Studio Ready pill text" and "`ok-weak` · Studio Ready pill
  ground" are void for the same reason (the `ok` and `ok-weak` tokens still
  serve the Active and Verified pills). At READY Studio is a plain item (D3).
  Against SH1-TH1 a reviewer matches only the Studio row's box and colours:
  padding, height, hover ground, current plate and bar, label and icon tones.
- **LB-D, LB-S, BAND-820, NOTICES, RAIL-BADGE: the shell.** Each board draws
  its own copy of the shell (LB's 68px solid top bar and "Admin navigation"
  landmark, NOTICES' "Workspace" label, BAND-820's 7px 10px rows, RAIL-BADGE's
  44px rail rows, 17px icons and #e3e6eb hover). All of it gives way to SH1
  geometry and TH1 colours as SH1-TH1 draws them.
- **RAIL-BADGE F42 (C1) and every SH1-TH1 frame (L1–L4, D1–D4): the page
  content.** Both boards draw the old Overview as a backdrop: the Growth `plan`
  pill in the owner heading, "Your site" and Domain / Owner as two side-by-side
  cards with no band, the Verified pill in the Domain card header, 132px label
  columns with 10px row gaps, an 18px card body and the hidden text "(opens in
  a new tab)". All of it is void. C1 counts only for the rail and its badge;
  SH1-TH1 counts only for the shell (rows, rail, top bar, Menu) and the colour
  tokens (page, card, header, border and text colours). The page content comes
  from LB-D, LB-S, BAND-820 and NOTICES (§5–§7), and Open site's hidden text
  stays `externalLink.newTabHint`, "(opens in new tab)".
- **DB3-S F8–F12, F20 and DB3-D: the Studio link's markup.** The boards build
  the expanded link's name from its content alone (a label span, then the line
  span, no separator, no `title`), which reads "Studio Invite sent — …". The
  build adds the visually hidden separator of §8.1, so the name is "Studio,
  Invite sent — check your email".
- **DB3-S F16–F18: the access card's own geometry** (22px padding, 17px title,
  10px button gap, 520px cap). Only the buttons' order and emphasis count
  (§8.6); the card, its copy and its 8px button gap are today's.
- **RAIL-BADGE's "side-hover" #e3e6eb** is not a TH1 token. TH1's row hover is
  `side-line` #d9dde4 (SH1-TH1 legend "side-line · Row hover"); the badge
  circle on a hovered row takes that.

Breakpoints (Tailwind `md` = 768px, `lg` = 1024px):

| Width                           | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥ 1024 (drawn 1024, 1280, 1440) | Sidebar 264 (SH1). Content padding 26, gap 24. Band 4 columns 3:3:2:2, cells 16px 20px. Pair 2 equal columns, gap 24, equal heights, detail lists in two columns (112px labels). Tiles 3 columns, gap 12. h1 24/32. At 1024 every value is the 1280 frame's (F30, F31)                                                                                                                                                                                                                |
| 1920 (drawn)                    | Content capped at `max-width: 1180px`, **left-aligned** (no auto margin); empty space on the right. Nothing else changes                                                                                                                                                                                                                                                                                                                                                              |
| 768–1023 (drawn 820)            | Desktop rules except two tightenings, both following the **window** width, not the column (F28, F29): band cells pad **12px 16px** (the first cell keeps 18px on its left); the Pair's detail lists **stack label over value** (the phone list). Band stays 4 columns 3:3:2:2; Pair stays side by side; tiles stay 3 columns and stretch to one height. At 820 the column is 504px: band cells 151 / 151 / 100 / 100, the Plan cell's content box 67px; Pair cards 240px; tiles 147px |
| < 768 (drawn 390)               | No sidebar; SH1's 67px phone top bar with the 44×44 icon-only Menu button and a "Menu" tooltip; no account avatar; breadcrumb the single crumb "Dashboard". Content padding 16, gap 16. h1 22/28. Open site wraps under the title, min-height 44. Band 2 columns. Pair stacks, gap 16. Detail lists stack label over value. DNS link 44. Tiles one column of rows at least 64px tall (they render about 67px)                                                                         |

## 3. Global values

### 3.1 Type

`font-family: Inter, system-ui, sans-serif; line-height: 1.5`. Mono:
`'JetBrains Mono', ui-monospace, monospace` (#6288 owns the font, X24);
12.5px weight 500 in detail lists, 13px inside the band. Links `#4f46e5`, hover
`#3730a3`.

The admin defines no line-height tokens, so every element below sets its line
height explicitly. Inheriting 1.5 gives wrong heights (for example 13.5px →
20.25px instead of 20px).

### 3.2 Pill (`StatusBadge`, X12)

| Property | Value                                                        |
| -------- | ------------------------------------------------------------ |
| Layout   | `inline-flex; align-items:center; gap:6px`                   |
| Shape    | `border-radius:999px; padding:2px 10px`                      |
| Type     | `11.5px / 16px; weight 600; white-space:nowrap`              |
| Height   | **20px** (today 21.25px because line height inherits)        |
| Dot      | `6×6; border-radius:50%; background:currentColor; flex:none` |

| Tone      | Text    | Background | Used for                                 |
| --------- | ------- | ---------- | ---------------------------------------- |
| `ok`      | #16794d | #e7f6ee    | Active, Verified                         |
| `warn`    | #8a5f00 | #fbf3df    | Pending — awaiting DNS, Invited, pending |
| `bad`     | #b42318 | #fdeceb    | (not on this page)                       |
| `neutral` | #5b6472 | #eef0f3    | Owner, Coming soon, Archived             |
| `brand`   | #4f46e5 | #eef2ff    | 2 new                                    |
| `plan`    | #3730a3 | #eef2ff    | Growth, Free                             |

The hexes are the light values of TH1's pill tokens (#6288); the dark values
come with #6291. Dots: Active, Verified, Pending, Owner, Archived have a dot.
Plan, "2 new" and "Coming soon" have **no** dot. The dot is
`aria-hidden="true"` (as today).

DB3-S F25–F27's own pill (22px, padding 0 10px, `mute` #4b5361 on #eceef2,
operator plan #4338ca on #eef0ff) is void (§9).

### 3.3 Shadows and radii

| Token                              | Value                                                        | Used on                    |
| ---------------------------------- | ------------------------------------------------------------ | -------------------------- |
| shadow sm (`--shadow-admin`)       | `0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)` | `.btn`, card, tile         |
| shadow lg (`--shadow-admin-lg`)    | `0 12px 40px rgba(16,24,40,.14)`                             | tooltip                    |
| radius 6 (`rounded-admin`)         | 6px                                                          | card, tile                 |
| radius 4 (`rounded-admin-control`) | 4px                                                          | buttons, DNS link, tooltip |

### 3.4 Focus ring (X13)

Every focusable element on this page uses TH1's one gapped ring, built by the
#6337 helper: a 2px gap in the colour of the ground the element sits on,
then a 2px ring in `brand-ink` (#4f46e5 light, #a5b4fc dark); on the sidebar
the ring is `side-accent` on the `side` ground. Grounds here: page `bg`
#f6f7f9 (Open site), card header `surface-head` #eef1f6 (DNS), card `surface`
#fff (tiles), sidebar `side` #eef0f3 (Studio item). The ring replaces a raised
shadow; it never stacks with it. This is the same ring LB draws on its toggle
(`0 0 0 2px #f6f7f9, 0 0 0 4px #4f46e5`), so O20 and TH1 agree.

## 4. Page shell (context; owned by the shell and theme sets)

Reviewers check the shell around every dashboard frame against SH1-TH1, never
against the shell drawn on the LB, DB3, BAND-820, NOTICES or RAIL-BADGE boards.
The values that matter to this set:

| Element                | Value (SH1 geometry, TH1 colour)                                                                                                                                                                                                                                                          | Owner                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Sidebar box            | 264 / 76 collapsed; `side` #eef0f3 / #0a0c0f, right rule `side-line` #d9dde4 / #1c1f26; `<aside id="sidebar" aria-label="Sidebar">`, one `nav` per section named by its section label (X11)                                                                                               | #6287, #6288                                                             |
| Rows                   | padding 8px 10px, gap 10, radius 4, 13px, `side-text` #2a303b, icon `side-muted` #5b6472; hover `side-line` #d9dde4; current `side-raised` #fff plate with a 3px `side-accent` #4f46e5 bar                                                                                                | #6287, #6341                                                             |
| Collapsed rail rows    | centred, padding 8px 0, label and badge visually hidden; inert rows 50%; each row's name tooltip                                                                                                                                                                                          | #6287, #6348                                                             |
| Workspace switcher     | no "Workspace" label, one down chevron, `side-field` #fff with `side-field-line` #7c8493 (X8)                                                                                                                                                                                             | #6288, #6379                                                             |
| Top bar                | sticky, `bg` at 90% over a `line` rule; 59px from `md`, 67px on a phone; children: collapse toggle (or Menu button), then the breadcrumb (X4)                                                                                                                                             | #6287, #6374                                                             |
| Breadcrumb on Overview | the single crumb "Dashboard", desktop and phone (X9)                                                                                                                                                                                                                                      | #6287, #6377                                                             |
| Phone Menu button      | 44×44, icon only, `aria-haspopup="menu"` (O3); its "Menu" tooltip is this set's #6366                                                                                                                                                                                                     | #6287, #6366                                                             |
| Account                | at the sidebar foot; on a phone at the Menu foot (X6, #6376); no avatar in the phone top bar (O21)                                                                                                                                                                                        | #6375, #6376                                                             |
| Content                | `width:100%; max-width:1180px; padding:26px` (16 on a phone), **no auto margin**                                                                                                                                                                                                          | #6372                                                                    |
| Nav icons              | SH1 draws today's nav icons (Overview house, Studio pencil, Look palette, Voice quote, Features gear, Leads paper plane, Languages book, Domain globe, Email envelope, Subscribers list lines, Comments speech bubble, Team two people); their outline vs filled shape is open (X22b, O6) | the shell's; no dashboard ticket changes them, so #6368 has no icon step |

## 5. Heading

| Element            | Value                                                                                                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row                | `flex; flex-wrap:wrap; align-items:flex-start; gap:16px`                                                                                                                                                                                                              |
| Title group        | `flex: 1 1 320px; min-width:0`                                                                                                                                                                                                                                        |
| Title row          | `flex; flex-wrap:wrap; align-items:center; gap:10px`                                                                                                                                                                                                                  |
| h1                 | 24px / 32px, 600, letter-spacing -.01em, `overflow-wrap:anywhere`, margin 0. Phone 22px / 28px                                                                                                                                                                        |
| Status pill        | `ok` with dot, "Active" (Archived: `neutral` with dot)                                                                                                                                                                                                                |
| Plan pill          | **None on the owner dashboard.** Operator tenant Overview keeps it (D6)                                                                                                                                                                                               |
| Description        | margin-top 4; 13.5px / 20px; #5b6472; "Your site at a glance. Everything here is live."                                                                                                                                                                               |
| Actions            | `flex; align-items:center; gap:8px`                                                                                                                                                                                                                                   |
| Open site          | `inline-flex; gap:7px; border:1px solid` `control-line` **#878f9d** (X14; the boards' #818a99 is void); radius 4; white; #12141a; 13px/1.5; weight 500; padding 8px 13px; nowrap; shadow sm (≈37px tall). **Hover: border `brand-ink` #4f46e5**. Phone: min-height 44 |
| Open site contents | "Open site", visually hidden " (opens in new tab)", external-link icon 16 stroke 1.6; accessible name "Open site (opens in new tab)" (today's `ExternalLinkButton`; it stays)                                                                                         |
| Open site focus    | §3.4 ring on the page ground                                                                                                                                                                                                                                          |
| Surface            | Directly on the page background #f6f7f9: no white band, no rule, no extra padding (X19: global)                                                                                                                                                                       |

Behaviour: on desktop Open site sits top-right on the first row. On a phone
Open site wraps under the title block, left-aligned.

Long title (F2, F5, F25, F29, F31; O16 resolved by board): the h1 and the pill
are two flex items in a wrapping row, so a title too long for one line takes
the whole first line and the pill renders on its own line underneath, at the
left edge, 10px below. DB3-S F25's "follows the last word" caption is
superseded. Open site stays top-right from 768px up.

## 6. Overview content order

1. Heading (§5)
2. `ArchivedTenantNotice` — only when the tenant is archived
3. `SiteSetupCard` — only while setup is incomplete or failed
4. "Your site" band (§7.2)
5. Pair: Domain, Owner (§7.3, §7.4, §7.7)
6. Make it yours (§7.5)

Gap between them 24 (phone 16).

### 6.1 Notices (NOTICES F32, F33)

Both notices sit in the page stack between the heading and the Your site card,
on the page's 24px rhythm; nothing else moves and the cards below keep the LB
layout. Both are today's components, unchanged:

| Notice         | As drawn (today's values)                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archived (F32) | Warning `Alert`: `warn-weak` #fbf3df, border `warn` at 30%, radius 6, padding 14px 16px, card shadow; warning icon #8a5f00; title 13.5/600 "This tenant is archived"; description 12.5 #5b6472 (5.4:1 on the warm fill), "Deprovisioned Oct 14, 2026. Everything on these pages is read-only.", the date formatted by `formatDate` as **plain text** (today's); `role="status"`. The heading pill reads "Archived" (`neutral`)          |
| Setup (F33)    | `SiteSetupCard`: its own 16px stack — any setup Alert first (stopped: error Alert "Your site's setup stopped" with the secondary "Try again" button, `role="alert"`; not started: warning Alert with "Start setup"; running: no Alert), then `RunStepsCard` open while the run is not done ("Setting up your site", neutral "3 of 6 done" count pill, 24px step dots on a 2px connector, settled steps with a 12px muted relative time) |

NOTICES F32 wraps the notice's date in `<time datetime="2026-10-14">`. That
element is **void**: the notice is today's component, unchanged (D4), and its
date stays plain text. A `<time>` there is listed under "Out of scope".

The steps card is `RunStepsCard`, built on the shared `Disclosure`, **not** on
`Card`, so the card chrome change (§7.1, #6355) does not reach its trigger:

| Part (F33)        | Value                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Box               | white, 1px `line` #e5e7eb, radius 6, shadow sm                                                                                                       |
| Trigger (summary) | white ground (no `surface-head` tint, no 50px minimum height), padding **14px 18px**, gap 10; the whole row is the disclosure button inside the `h2` |
| Title             | the `cardTitle` heading size, so 14px / 20px, 600 once #6355 lands (the board's 14/600)                                                              |
| Count pill        | `neutral` "3 of 6 done", today's pill with its dot (the board omits the dot; the card is unchanged, D4)                                              |
| Chevron           | 16px at the right edge, in `faint` (TH1 #7a8394 after #6288; the board's #8a93a3 is today's `faint`), turned 90° while open                          |
| Panel             | 18px padding under a 1px `line-2` #eef0f3 rule; 24px step dots on a 2px connector; settled steps with a 12px muted relative time                     |

Variants: stopped (F33, error Alert first); not started (warning Alert with
"Start setup" first, then the steps card); running (the steps card alone, no
Alert). The steps card is open while the run is not done (today's
`useCollapseOnDone`).

Copy is all existing (`archivedTenantNotice`, `ownerHomePage.siteSetup*`,
`provisioningStatusView.stepLabel`, `runStatus`). The sidebar shows whatever
`ownerStudioAccessFor` returns; NOTICES draws tenants with no pending invite,
so no line, and adds no rule. NOTICES flags two questions — the description
"Everything here is live." on an archived or unfinished site, and Open site in
the archived heading. D4 keeps both as today; a change is listed under "Out of
scope".

## 7. Cards

### 7.1 Card chrome (all four cards, X15)

| Part            | Value                                                                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card            | `section` labelled by its `h2` (#6354); `surface` white; border 1px `line` #e5e7eb; radius 6; shadow sm; `min-width:0`; `display:flex; flex-direction:column`                                            |
| Header          | `flex; flex-wrap:wrap; align-items:center; gap:10px`; **min-height 50**; padding **12px 18px**; `surface-head` **#eef1f6** (dark #1d2027, #6288/#6291); border-bottom 1px `line` #e5e7eb; radius 6 6 0 0 |
| Title `h2`      | **14px / 20px, 600**, #12141a, margin 0                                                                                                                                                                  |
| Supporting text | block; margin-top 2; 12.5px / 18px; #5b6472                                                                                                                                                              |
| Header actions  | `margin-left:auto; flex; align-items:center; gap:8px`                                                                                                                                                    |
| Body            | padding **16px 18px**; `flex:1` (so the Pair's bodies stretch to equal height)                                                                                                                           |
| Footer          | `surface-2` #fbfbfd, 1px #eef0f3 top border, radius 0 0 6 6, padding 11px 18px                                                                                                                           |

The chrome is `Card`'s only. `Disclosure`-based cards (the site setup steps
card, §6.1) keep their white trigger; only their title follows the shared
`cardTitle` size.

Below 768 the card chrome is **unchanged**: LB-S F4 and F5 keep the header at
12px 18px and the body at 16px 18px. TH1's 14px 18px header padding is void
(cards = LB).

### 7.2 "Your site" band

| Part        | Value                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header      | title "Your site" only                                                                                                                                                                   |
| `dl`        | `margin:0; display:grid; grid-template-columns: minmax(0,3fr) minmax(0,3fr) minmax(0,2fr) minmax(0,2fr)` from 768 (≈336.6 / 336.6 / 224.4 / 224.4 at 1440; 151 / 151 / 100 / 100 at 820) |
| Cell        | `min-width:0; padding:16px 20px; border-left:1px solid #eef0f3`; first cell no border, padding-left 18. **768–1023: padding 12px 16px**, first cell still 18px left                      |
| `dt`        | 12.5px / 18px, #5b6472                                                                                                                                                                   |
| `dd`        | margin-top 4; 14px / 22px; 500; #12141a; `overflow-wrap:anywhere`; mono `dd` JetBrains Mono 13px / 22px, 500                                                                             |
| Placement   | the `dl` sits **directly under the header**, not inside a card body                                                                                                                      |
| Cell height | 76 at the desktop padding (16 + 18 + 4 + 22 + 16); the band's height follows the tallest cell                                                                                            |

| Cell | Label         | Value                                   |
| ---- | ------------- | --------------------------------------- |
| 1    | Name          | tenant name (wraps anywhere)            |
| 2    | Public domain | mono domain (wraps anywhere)            |
| 3    | Plan          | `plan` pill, no dot ("Growth" / "Free") |
| 4    | Language      | language name ("English")               |

At 820 the 12/16 padding leaves the Plan cell a 67px content box, enough for
the Growth pill; at 16/20 it would be 59px and the pill would overflow
(BAND-820 notes).

Band footer (the read-only hint), in `Card.Footer`:

| Part | Value                                                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| Box  | `flex; align-items:flex-start; gap:8px; padding:11px 18px; border-top:1px solid #eef0f3; background:#fbfbfd; radius 0 0 6 6` |
| Type | 12.5px / 18px, #5b6472                                                                                                       |
| Icon | info, 16px, stroke **1.8** (the Icon stroke override, #6361), #5b6472, margin-top 1                                          |
| Copy | "Need one of these changed? Ask your platform contact — these values are wired into your site's hosting."                    |

Phone (< 768):

| Part                | Value                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| Grid                | `minmax(0,1fr) minmax(0,1fr)`                                               |
| Cells               | padding 12px 16px; no left border; border-top 1px #eef0f3 (first cell none) |
| Name, Public domain | span both columns                                                           |
| Plan, Language      | share one row; Language has border-left 1px #eef0f3                         |
| Footer              | padding 11px 16px                                                           |

### 7.3 Domain card

| Part     | Value                                                                                                                                                                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header   | title "Domain"; actions: DNS link only (the status pill **leaves the header**)                                                                                                                                                                              |
| DNS link | `inline-flex; gap:6px; radius 4; padding 5px 9px; 12px/1.5; 500; #12141a`; arrow-right icon 16 stroke 1.6. Hover ground `hover` **#e2e5ea** (dark #22262f; token from #6381, see below). Focus §3.4 on `surface-head`. Phone: min-height 44, padding 0 10px |
| Body     | detail list (§7.6)                                                                                                                                                                                                                                          |

LB draws the DNS hover #e3e7ee. No TH1 token holds it and no board gives it a
dark value; the theme token board (`gap-theme-token-dark-values`) defines
`hover` #e2e5ea / #22262f for a hover ground on a light grey control surface.
"Reuse before you create" settles it: the DNS link uses `hover`, and no
`--admin-surface-head-hover` token is added. In Dark the DNS link sits on
`surface-head` #1d2027 at rest and hovers to #22262f (checked in #6369).

#6358 moves the hover of **every** ghost button to `hover`, not only the
card-header links. The theme spec's usage note for `hover` (§5.4, the `hover`
row) names the preview toolbar's icon buttons, the solo toolbar buttons and
the link buttons on a card or card header; it must widen to "every ghost
button" in #6314, beside this doc (§14, cross-set follow-ups).

| Row | Label            | Value                                                                                                      |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Status** (new) | pill with dot: `ok` "Verified" / `warn` "Pending — awaiting DNS" / today's other states with today's tones |
| 2   | Public domain    | mono domain                                                                                                |
| 3   | Last checked     | "Just now" (today's relative value)                                                                        |

Today "Last checked" shows only for NOT_ADDED, PENDING and VERIFIED; for
NOT_CONFIGURED and ERROR the card has two rows. That stays (D4).

Loading skeleton: header title + action placeholder only, then three row
placeholders (Status pill, domain, last checked).

The Domain card is shared with the operator tenant Overview; the row change
reaches it too (O4, resolved by the rule: one Domain card everywhere).

### 7.4 Owner card

| Row                        | Label       | Value                                           |
| -------------------------- | ----------- | ----------------------------------------------- |
| 1                          | Email       | mono email, wraps anywhere at every width       |
| 2                          | Role        | `neutral` pill with dot "Owner"                 |
| 3                          | Joined      | `<time>` "Sep 12, 2026"                         |
| 3 (invited, not signed in) | **Invited** | `<time>` "Oct 28, 2026" + ", not signed in yet" |

No owner (not drawn, today's content kept): Email "—" and `warn` pill
"Invited, pending".

### 7.5 Make it yours

| Part             | Value                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header           | title "Make it yours" + supporting text "changes go live immediately"                                                                                                                                      |
| Grid             | 3 columns `minmax(0,1fr)`, gap 12, from 768 (147px each at 820, where descriptions wrap to two or three lines and the tiles in the row stretch to one height); phone 1 column                              |
| Tile             | `flex; flex-direction:column; align-items:flex-start; gap:2px`; border 1px #e5e7eb; radius 6; white; padding 14; shadow sm; #12141a; no underline                                                          |
| Tile hover       | border #4f46e5; bg #fbfbfd                                                                                                                                                                                 |
| Tile focus       | §3.4 ring on `surface` (#6340 converts the tile to the helper)                                                                                                                                             |
| Tile icon        | 24px, stroke 1.6, **#4f46e5**                                                                                                                                                                              |
| Tile title       | margin-top 6 on top of the 2px gap, so **8px below the icon**; 13.5px, line height 1.5 (20.25px); 600; #12141a                                                                                             |
| Tile description | **2px below the title**; 12.5px, line height 1.5 (18.75px); 400; #5b6472                                                                                                                                   |
| Phone tile       | row: `flex-direction:row; align-items:center`; gap 12; min-height 64 (renders about 67); padding 14; title and description in one column wrapper with **no gap**; title margin-top 0; icon 24 indigo, left |

The tile line heights are the one place this doc keeps 1.5: the boards set
none, so their render is 20.25px and 18.75px; the build sets `line-height:1.5`
on both rather than relying on inheritance.

| Tile | Icon                                               | Title    | Description                     |
| ---- | -------------------------------------------------- | -------- | ------------------------------- |
| 1    | palette (dots drawn filled on the boards; O6 open) | Look     | Colours, fonts, logo, density   |
| 2    | quote (drawn filled on the boards; O6 open)        | Voice    | The words your site uses        |
| 3    | settings (gear)                                    | Features | Comments, bookmarks, newsletter |

### 7.6 Detail list (Domain and Owner)

| Part       | ≥ 1024, and every list outside the Overview Pair from 768                                          | Phone, and the Overview Pair from 768 to 1023 (BAND-820)       |
| ---------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Grid       | `112px minmax(0,1fr)`; `align-items:baseline`; column-gap 14; **row-gap 12**                       | one column; row-gap 2; each `dt` after the first margin-top 10 |
| Type       | 13.5px / 20px                                                                                      | same                                                           |
| `dt`       | 12.5px (line height 20 from the list), 400, #5b6472                                                | same                                                           |
| `dd`       | `flex; flex-wrap:wrap; align-items:center; gap:8px; min-width:0`                                   | same                                                           |
| value      | `min-width:0; overflow-wrap:anywhere` (never ellipsis); plain 13.5px / 20px, 400, #12141a          | same                                                           |
| mono value | Domain's Public domain and Owner's Email: JetBrains Mono, **12.5px, 500**, #12141a, line height 20 | same                                                           |
| pill value | sits in the `dd` flex row, centred, 8px from any sibling                                           | same                                                           |

The stacked-to-1023 layout is an option of the shared `DetailList`. #6356,
the sole owner of the detail-list metrics (resolutions §2), adds it with no
consumer; #6289 only turns it on for the Overview Pair through `DomainCard` and
`OwnerCard`.

Why the Pair stacks from 768 to 1023: each Pair card is 240px at 820, so a
112px label column would leave a 76px value column, narrower than the Pending
pill. At 1024 the cards are 342px and the value column (178px) holds
"Pending — awaiting DNS". The stacked layout follows the window width; with the
sidebar collapsed at 820 the column is 692px and the lists still stack.

### 7.7 Pair

`display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:24px;
align-items:stretch` from 768. Both cards are equal width (550 at 1440, 342
at 1024, 240 at 820) and equal height; a long email lengthens Owner and
Domain's body stretches to match. Phone: one column, gap 16, Domain above
Owner.

## 8. Studio status line (DB3)

### 8.1 Rules

- No pill on Studio, in any state.
- While access is INVITE_SENT, ACTIVATING or STALLED, the Studio item carries
  **one** line under its label: a 12px toned icon and muted text.
- At READY there is no line: Studio renders exactly like every other item.
- The sidebar line and the Studio page always show the same access state
  (both read `ownerStudioAccessFor`). Operators get no access
  state, so never a line.
- The line is inside the link. Accessible name: "Studio, Invite sent — check
  your email", read once. The comma comes from a visually hidden separator
  span holding ", " between the label and the line, inside the link; without
  it the content name would read "Studio Invite sent — …". The separator is
  punctuation, identical in all five locales, so it takes no message key.
- **While Studio carries a status it has no native `title`**, in the expanded
  sidebar, the collapsed rail and the phone Menu: today every sidebar link gets
  `title={item.label}` (`sidebar.tsx`), and the shell's D26 keeps `title` = the
  label on expanded and phone Menu rows; on Studio with a status that title
  would add "Studio" again as the link's description, after a name that
  already reads "Studio, <line>". #6362 drops it whenever the status
  exists; #6363 relies on its absence. **At READY Studio keeps
  `title` = "Studio" exactly like every other row** (D26), so "renders exactly
  like every other item" holds without exception; in the collapsed rail
  #6348 drops every row's `title`, Studio's included. This is the one
  exception to the shell's D26 and is owed to the shell spec (§6.4 row
  `title`, §10, D26) and to #6376, which gives every Menu row its `title`
  (see §14, cross-set follow-ups).
- The focus ring wraps both lines.
- Long locales wrap the line; the item grows; nothing truncates. The "Studio"
  label itself stays on one line and ellipsises.
- The row box (padding, gap, radius, hover, current plate) is the shell's
  (SH1 row, TH1 colours). This set adds only the line and the top alignment.
- Collapsed rail (§8.4): no line; a corner badge on the icon; a tooltip and a
  hidden description carry the line.
- Phone Menu (§8.5): the same line in SH1's Menu row. The Menu trigger carries
  no badge.

### 8.2 States

| State       | Icon (12px, stroke 2.2, round caps/joins) | Tone      | Text (verbatim)                      |
| ----------- | ----------------------------------------- | --------- | ------------------------------------ |
| INVITE_SENT | mail (`ICONS.MAIL`)                       | warn      | Invite sent — check your email       |
| ACTIVATING  | clock (`ICONS.CLOCK`), no animation       | brand-ink | Setting up… (one ellipsis character) |
| STALLED     | warning triangle (`ICONS.WARNING`)        | bad       | Needs attention                      |
| READY       | none                                      | —         | none (single-line item)              |

German sample: "Einladung gesendet — E-Mail prüfen" (wraps to a second line at
264px).

### 8.3 Values

Geometry (LB `.st`, O18):

| Part                                                                                                                         | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Item with a line (expanded sidebar, every width from 768: drawn at 820 on BAND-820 F29 and at 1280 / 1440 on LB-S F2 / LB-D) | the shell row with `align-items:flex-start`; nav icon margin-top 2; label and line in a column, gap 2. The label keeps the shell row's line, 13px × the inherited 1.5 = **19.5px**, on Studio exactly as on every other row; this set sets no line height on the label (LB's `.ni` 20px line is LB shell geometry and void, §2). With SH1's 8px 10px padding: 8 + 19.5 + 2 + 16 + 8 = **53.5px** (LB draws 54 with its 20px line); the shell's other rows are 8 + 19.5 + 8 = 35.5px |
| Line                                                                                                                         | `flex; align-items:flex-start; gap:6px; 12px / 16px; weight 500`; **no truncate**                                                                                                                                                                                                                                                                                                                                                                                                   |
| Line icon                                                                                                                    | 12×12, stroke 2.2, `flex:none`, margin-top 1                                                                                                                                                                                                                                                                                                                                                                                                                                        |

DB3-S's 8px padding, 3px gap and 2px icon offset and LB's 7px row padding are
void: the line geometry is LB's, the row padding SH1's.

Colours (TH1 tokens; O1 and O13 resolved):

| Part                  | Light (grey sidebar, ships with #6288)                           | Dark (#6291)                                       |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| Line text             | `side-muted` #5b6472 (5.24:1 on `side`)                          | `side-muted` #8d96a6 (6.57:1 on #0a0c0f)           |
| INVITE_SENT icon      | `warn` #8a5f00                                                   | `warn` #f5c451                                     |
| ACTIVATING icon       | `brand-ink` #4f46e5                                              | `brand-ink` #a5b4fc (never `brand` #5850ec)        |
| STALLED icon and text | `bad` #b42318                                                    | `bad` #fca5a0                                      |
| Hovered line text     | `side-text` #2a303b (INVITE_SENT, ACTIVATING only)               | `side-text` #c9cfda (INVITE_SENT, ACTIVATING only) |
| Focus                 | §3.4 sidebar ring: 2px `side` #eef0f3, 2px `side-accent` #4f46e5 | 2px #0a0c0f, 2px #a5b4fc                           |

Dark pairs on `side` #0a0c0f / `side-line` #1c1f26 (hover) / `side-raised`
#20242e (current plate): line text #8d96a6 6.57 / 5.53 / 5.21; hovered text
#c9cfda 10.54 on #1c1f26; #f5c451 12.03 / 10.13 / 9.53; #a5b4fc 9.82 / 8.27 /
7.78; #fca5a0 10.28 / 8.66 / 8.15. DB3-S's own dark tones (#fbbf24, #a5b4fc,
#f87171, #fca5a5) and RAIL-BADGE's `.bdg.tbrand` `var(--brand)` (#5850ec in
Dark) are void. ACTIVATING takes `brand-ink` in both themes: in Light it equals
`brand` #4f46e5.

The line uses existing tone and sidebar tokens and adds none, so the Studio
line stays out of the `admin-theme.css` token chain; #6291 checks the dark
pairs. DB3's white-on-focus text is void.

Hover (§14 S1): TH1's row hover is `side-line` #d9dde4, on which the
muted line measures **4.39:1**, under 4.5:1. LB draws the line on #e3e6eb
(4.78:1), which is not a TH1 token. While the row is hovered the
line's text takes `side-text` #2a303b (9.73:1); the icons keep their tones
(#8a5f00 4.15:1, #4f46e5 4.61:1, #b42318 4.83:1, all above the 3:1 non-text
minimum).

Which text the swap covers: only the **muted** line text, that is INVITE_SENT
and ACTIVATING. STALLED's text is `bad`, not muted, and keeps it on hover:
#b42318 on #d9dde4 measures 4.83:1, so no swap is needed and the state keeps
its colour. The same rule holds in Dark (`side-text` #c9cfda for the muted
lines; STALLED keeps #fca5a0). The swap is the sidebar's only; the phone Menu
does not use it (§8.5).

### 8.4 Collapsed rail (RAIL-BADGE F34–F42; DB3-S F19's model)

| Part         | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rail and row | the shell's (SH1: 76px rail, rows padding 8px 0, labels visually hidden, inert rows 50%). The status line is **not** rendered                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Corner badge | `aria-hidden`; 14×14 circle holding the state icon at **10px, stroke 2.6**; no animation. Position: drawn at right 6 / bottom 6 of a 44px row around a centred 17px icon, it **overlaps the nav icon's lower-right corner by 6.5px on each axis**; the build keeps that overlap against the shell's icon, whatever the row height                                                                                                                                                                                                                                                                                         |
| Badge ground | the ground under the row, as one value read from the row state: `side` #eef0f3 at rest; `side-line` #d9dde4 on hover (TH1; RAIL-BADGE's #e3e6eb is void); `side-raised` #fff on the current page. Dark: #0a0c0f / #1c1f26 / #20242e (#6291)                                                                                                                                                                                                                                                                                                                                                                               |
| Badge tone   | Light: INVITE_SENT mail `warn` #8a5f00; ACTIVATING clock `brand-ink` #4f46e5; STALLED warning `bad` #b42318. Against rest / hover / plate: 4.95 / 4.15 / 5.65; 5.51 / 4.61 / 6.29; 5.76 / 4.83 / 6.57 — all above 3:1. Dark (#6291): `warn` #f5c451, `brand-ink` #a5b4fc (RAIL-BADGE's `var(--brand)`, #5850ec in Dark, is void), `bad` #fca5a0; against #0a0c0f / #1c1f26 / #20242e: 12.03 / 10.13 / 9.53; 9.82 / 8.27 / 7.78; 10.28 / 8.66 / 8.15                                                                                                                                                                       |
| READY        | no badge, no description; the row's name tooltip "Studio" only (#6348)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| One tooltip  | while a status exists, the status tooltip **replaces** the row's name tooltip "Studio" (#6348): Studio shows exactly one tooltip, "Studio · <line>", on hover and on keyboard focus, never the name tooltip beside or after it (RAIL-BADGE "Tooltip and semantics" panel; F34–F36, F40). At READY the name tooltip is the only one                                                                                                                                                                                                                                                                                        |
| Tooltip      | the shared Tooltip (X1), text "Studio · <line>"; **right of the row, 6px away, vertically centred** (Base UI `side="right"`, `sideOffset={6}`) — below a rail row it would cover the next icon. Hover after Base UI's delay, at once on keyboard focus, Escape hides it. Never wraps; it grows over the page (F41) and Base UI flips or shifts it at the viewport edge                                                                                                                                                                                                                                                    |
| Semantics    | the link's name is "Studio" (its visually hidden label). A visually hidden span, always rendered, holds "Studio · <line>" and the link points at it with `aria-describedby`; the tooltip itself is visual only (`aria-hidden`), so the status is read once. No native `title`. The span and the tooltip are **siblings of the link inside its `li`, never inside the `<a>`**: inside, they would join the name and it would read "Studio Studio · …" (F34–F40 markup). The span's id comes from React's `useId`, so it is unique in the document even when the sidebar and the phone Menu render the nav at the same time |
| Focus        | §3.4 sidebar ring; the icon turns `text-strong`: #12141a Light, #ffffff Dark (F40's `side-strong`; TH1 §5.2 `--admin-text-strong`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Operator     | no badge, no description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

The badge is the only status on the rail; the top bar and the page carry none
(F42). RAIL-BADGE's proposal that every rail row rise to 44×44 is shell
geometry; SH1's rows stand, and it is listed under "Out of scope".

### 8.5 Phone Menu (DB3-S F23 content; SH1 F2 row)

Rows are SH1's Menu rows (shell spec §10, #6376): padding 8px 10px, gap
10, label 13px weight 400 on the inherited 1.5 line (19.5px), min-height 44, so
a one-line row is 44px with 35.5px of content. SH1-TH1 P1 / P2 draw the label
14px / 500 (`.pmenu .row{font-size:14px}`); the shell spec rules SH1 F2's
13px / 400 the geometry and that 14px void, and this set follows it. The Studio
row with a line top-aligns and keeps SH1's padding: 8 + 19.5 + 2 + 16 + 8 =
**53.5px**, about 9.5px taller than its 44px siblings (not 18px: the siblings'
44px already holds 8.5px of slack above their 35.5px content). DB3-S's
min-height 56 and padding 10 are void. The panel and trigger are the shell's
(#6376).

The Menu's Studio row is a Base UI `Menu.LinkItem` whose name comes from its
content: label, the same visually hidden ", " separator as §8.1, then the line,
so it reads "Studio, Needs attention" once. While it has a line it carries no
native `title` (§8.1's exception to D26); at READY it keeps `title` = "Studio"
like every other Menu row.

Ownership: the row box, its ground, label and nav icon colours, its hover
ground and the current plate and bar are #6376's (on #6288's popover
tokens), never this set's; the values below are listed so the line can be
checked against them. This set owns only the line (text, icon, tones), its
no-swap rule, the top alignment, the Studio row's name and its missing
`title`, the undotted "Coming soon" pill and the inert rows (#6364).

Pills in the Menu: "Coming soon" is `neutral` with **no dot** (#6364,
§3.2; the shell spec §6.4 and §10 still say "with dot", which is void and owed
a fix, §14) on the popup neutral-pill ground `--admin-pill-neutral-popover`:
#eef0f3 in Light, **#323845** in Dark (SH1-TH1 P1 / P2
`.pmenu .sb.t-neu{background:var(--pillneupop)}`), never the page's #262a33.
"2 new" keeps the `brand` pill (#4f46e5 on #eef2ff; Dark from #6291), no dot,
as in the sidebar.

The Menu rows sit on the popover, not on the sidebar, so §8.3's sidebar colours
do not apply there. Values from SH1-TH1 P1 / P2 (`.pmenu .row`) and RAIL-BADGE's
shared `.pmenu .st` rule:

| Part                                | Light                                                                                                                                                                                | Dark                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Row ground                          | `popover` #ffffff                                                                                                                                                                    | `popover` #262b35                                  |
| Label                               | `text` #12141a, 13px / 400 (19.5px line)                                                                                                                                             | `text` #e8eaef                                     |
| Nav icon                            | `muted` #5b6472                                                                                                                                                                      | `muted` #a3abb8                                    |
| Line text (INVITE_SENT, ACTIVATING) | `muted` #5b6472 (5.98 on #fff, 5.28 on #eef1f6)                                                                                                                                      | `muted` #a3abb8 (6.13 on #262b35, 5.08 on #323845) |
| Line icon and STALLED text          | `warn` #8a5f00, `brand-ink` #4f46e5, `bad` #b42318                                                                                                                                   | `warn` #f5c451, `brand-ink` #a5b4fc, `bad` #fca5a0 |
| Hovered row                         | `popover-hover` #eef1f6; line text stays `muted`                                                                                                                                     | `popover-hover` #323845; line text stays `muted`   |
| Current row (Studio page)           | `popover-hover` #eef1f6 plate, no shadow, a 3px `brand-ink` #4f46e5 bar inset 10px top and bottom; label and nav icon `text` #12141a; the line keeps `muted` text and its toned icon | the same with #323845, #a5b4fc, #e8eaef            |

The S1 swap (§8.3) does **not** apply in the Menu: `muted` holds 4.5:1 on
`popover-hover` in both themes (5.28, 5.08). The line icons on `popover-hover`
measure 4.99 / 5.55 / 5.81 (Light) and 7.22 / 5.89 / 6.17 (Dark). The Studio
current row in the Menu takes the popover plate and bar above, never the
sidebar's white `side-raised` plate.

### 8.6 Studio page (F16–F18; O7 resolved by board)

Studio is current (`aria-current="page"`, Overview not current) and keeps its
line. The access card copy matches `ownerStudioAccess.*` exactly. The buttons
take DB3-S's emphasis per state:

| State             | Buttons, in order                                         |
| ----------------- | --------------------------------------------------------- |
| INVITE_SENT (F16) | "Check now" primary, "Resend invite" secondary            |
| ACTIVATING (F17)  | "Check now" secondary; no Resend (as today)               |
| STALLED (F18)     | "Resend invite" primary first, then "Check now" secondary |

Today "Check now" is primary in every state; #6367 changes it. The
order and emphasis are the same at every width (390, 820, 1024, 1280, 1440;
the frames are drawn at 688): the buttons sit in today's wrapping row 8px
apart, and where the row is too narrow the second button wraps under the
first, keeping the order. DB3-S's card geometry and 10px gap are void (§2).

## 9. Heading edge cases (DB3-S F25–F27)

These frames count for **layout and copy only**. Their own CSS is void and
gives way to LB everywhere: title-group gap (theirs 6px, LB 4px), basis (260px,
LB 320px), pill (22px, padding 0 10px; LB 20px, 2px 10px), Open site (36px,
weight 600, 14px stroke-2 icon; LB ≈37px, weight 500, 16px stroke-1.6 icon),
Archived pill colour (`mute` #4b5361 on #eceef2; LB `neutral` #5b6472 on
#eef0f3) and the operator plan pill colour (#4338ca on #eef0ff; LB `plan`
#3730a3 on #eef2ff).

| Frame                        | Expected                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| F25 long name                | Title wraps; Active pill on its own line under the title; no plan pill                               |
| F26 Archived                 | `neutral` pill with dot "Archived" is the only heading pill; the archived notice sits below (§6.1)   |
| F27 operator tenant Overview | Name, Active pill **and** `plan` pill "Free"; description "Tenant details, provisioning and access." |

## 10. Accessibility

### 10.1 Tooltip (#6370 owns the primitive)

One shared tooltip, owned and extracted by #6370 (X1): #12141a, white 12px
/ 1.5, weight 500, padding 4px 8px, radius 4, no wrap, shadow lg; Base UI's
default hover delay, at once on keyboard focus, Escape hides it; visual only
(`aria-hidden`), the trigger's own name carries the label. In Dark it sits on
`popover` #262b35 with a 1px `popover-line` edge (SH1-TH1). This set consumes
it in two places:

| Consumer              | Side   | Align  | Text              | Drawn on                                      | Ticket |
| --------------------- | ------ | ------ | ----------------- | --------------------------------------------- | ------ |
| Collapsed Studio item | right  | centre | "Studio · <line>" | RAIL-BADGE F34–F42                            | #6363  |
| Phone Menu button     | bottom | start  | "Menu"            | LB-S F4/F5 (`top: calc(100% + 6px); left: 0`) | #6366  |

The collapse toggle's tooltip is #6374's; the rail rows' name tooltips are
#6348's.

### 10.2 Roles and names

| Element               | Role / name                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Each card             | `section` named by its `h2` (or by the element its `aria-labelledby` prop names, as LookCard does)                                                                                  |
| Band                  | `dl` with `dt`/`dd`                                                                                                                                                                 |
| Domain, Owner         | `dl`                                                                                                                                                                                |
| Open site             | link, name "Open site (opens in new tab)"                                                                                                                                           |
| DNS                   | link "DNS"                                                                                                                                                                          |
| Tiles                 | links "Look Colours, fonts, logo, density" etc.                                                                                                                                     |
| Studio (line)         | link "Studio, Invite sent — check your email": label, a visually hidden ", " separator, then the line, all inside the link; no native `title` (§8.1)                                |
| Studio (collapsed)    | link named "Studio"; description = the hidden "Studio · <line>" span; one tooltip (§8.4)                                                                                            |
| Studio (phone Menu)   | menu item "Studio, Needs attention" (label, hidden ", ", line, inside the `Menu.LinkItem`); no native `title` while it has a line; at READY "Studio" with `title` = "Studio" (§8.5) |
| Sidebar               | shell's: `aside` "Sidebar", one `nav` per section (X11)                                                                                                                             |
| Pill dot              | `aria-hidden="true"`                                                                                                                                                                |
| Disabled nav items    | `aria-disabled="true"`, not focusable (Subscribers, Comments, Team)                                                                                                                 |
| Joined / Invited date | `<time datetime="YYYY-MM-DD">`                                                                                                                                                      |
| Archived notice       | `role="status"`; stopped-setup Alert `role="alert"` (today's)                                                                                                                       |

### 10.3 Focus order (desktop)

Workspace switcher → Overview → Studio → Look → Voice → Features → Leads →
Languages → Domain → Email → account button → collapse toggle → Open site →
DNS → Look tile → Voice tile → Features tile. The Overview breadcrumb is a
single current crumb and takes no focus. Inert items take no focus. (DOM
order; the sidebar precedes the main column.)

### 10.4 Targets

Phone: Menu 44×44, Open site ≥ 44 tall, DNS ≥ 44 tall, tiles ≥ 64 (render
≈67), Menu rows ≥ 44 (the Studio row with a line taller).

### 10.5 Focus look

§3.4 everywhere. Open site and DNS take it through #6358 (on the
#6337 helper); tiles through #6340; the Studio item through the
shell's sidebar ring.

## 11. Copy

All strings are `apps/platform` UI copy: **fixed, never Voice**. New keys need
all five locales (en, de, es, fr, nl). The non-English wording is a proposal
approved 31 Oct (§14 S3, Q30); the single ellipsis character (…,
U+2026) holds in every locale, and es uses the formal "su".

| Key                                        | en                             | de                                 | es                                    | fr                                         | nl                                           |
| ------------------------------------------ | ------------------------------ | ---------------------------------- | ------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| `navSections.studioAccessLine.INVITE_SENT` | Invite sent — check your email | Einladung gesendet — E-Mail prüfen | Invitación enviada — revise su correo | Invitation envoyée — consultez vos e-mails | Uitnodiging verstuurd — controleer uw e-mail |
| `navSections.studioAccessLine.ACTIVATING`  | Setting up…                    | Wird eingerichtet…                 | Configurando…                         | Configuration…                             | Wordt ingesteld…                             |
| `navSections.studioAccessLine.STALLED`     | Needs attention                | Erfordert Aufmerksamkeit           | Requiere atención                     | Nécessite votre attention                  | Vraagt aandacht                              |
| `navSections.collapsedStatusTooltip`       | {label} · {status}             | {label} · {status}                 | {label} · {status}                    | {label} · {status}                         | {label} · {status}                           |

The Domain card's "Status" row label adds no key: it reuses
`tenantDomainPage.statusLabel` ("Status" / "Status" / "Estado" / "Statut" /
"Status"), which already labels the domain-status row of the Domain page's
connected-domain detail list (`connected-domain-details.tsx`), the same role
in the same `DetailList`. `tenantsTable.columnStatus` is a table column header
and is not reused. The expanded Studio name's ", " separator (§8.1) is
punctuation and takes no key.

The landmark keys drafted earlier (`adminNavigationLabel`,
`sectionsNavLabel`) are dropped with NEW-dash-17 (X11). The phone Menu tooltip
reuses `topbarNavMenu.triggerLabel` ("Menu"); the native `title` on the
trigger is dropped where the tooltip replaces it.

| String                                                                             | Key                                                                                                                                              | Status                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Your site at a glance. Everything here is live.                                    | `ownerHomePage.description`                                                                                                                      | exists                         |
| Your site · Name · Public domain · Plan · Language                                 | `ownerHomePage.yourSiteCardTitle`, `nameLabel`, `publicDomainLabel`, `planLabel`, `localeLabel`                                                  | exist                          |
| Need one of these changed? …                                                       | `ownerHomePage.readOnlyHint`                                                                                                                     | exists, unchanged              |
| Make it yours · changes go live immediately · tile titles and descriptions         | `ownerHomePage.makeItYoursCardTitle` … `featuresTileDescription`                                                                                 | exist                          |
| Domain · DNS · Public domain · Last checked · Just now · status labels             | `tenantOverviewPage.*`                                                                                                                           | exist                          |
| Status (Domain row label)                                                          | `tenantDomainPage.statusLabel`                                                                                                                   | exists, reused                 |
| Owner · Email · Role · Joined · Invited · ", not signed in yet" · Invited, pending | `tenantOverviewPage.ownerCardTitle`, `emailLabel`, `roleLabel`, `joinedLabel`, `invitedLabel`, `ownerNotSignedInYet`, `ownerInvitedPendingBadge` | exist                          |
| Open site · (opens in new tab)                                                     | `tenantOverviewPage.openSiteAction`, `externalLink.newTabHint`                                                                                   | exist                          |
| Active · Archived · Free · Growth                                                  | `tenantsTable.status.*`, `tenantsTable.plan.*`                                                                                                   | exist                          |
| Archived notice, setup Alerts, steps card                                          | `archivedTenantNotice`, `ownerHomePage.siteSetup*`, `provisioningStatusView.stepLabel`, `runStatus`                                              | exist (NOTICES)                |
| Check now · Resend invite                                                          | `ownerStudioAccess.checkNow`, `resendInvite`                                                                                                     | exist                          |
| **Invite sent — check your email** · **Setting up…** · **Needs attention**         | `navSections.studioAccessLine.*`                                                                                                                 | **new**                        |
| **{label} · {status}** (collapsed tooltip and hidden description)                  | `navSections.collapsedStatusTooltip`                                                                                                             | **new**                        |
| Invite sent · Activating · Ready · Action needed (old pills)                       | `navSections.studioAccess.*`                                                                                                                     | **delete** in all five locales |
| Ready — open to start writing                                                      | —                                                                                                                                                | **never add** (D3)             |

## 12. Code mapping

Paths are relative to `apps/platform/src/`.

| Area                                    | Today                                                                                                                                                                                                                                                                                                                                       | Change                                                                                                                                                                                                                                                                                                                          | Ticket              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Card chrome                             | `components/shared/card/card-variants.ts` header `py-3.5`, `border-admin-line-2`, no min-h/radius; body `p-[18px]`; root not flex                                                                                                                                                                                                           | min-h 50, padding 12/18, border `line`, radius 6 6 0 0; root `flex flex-col min-w-0`; body 16/18 `flex-1`                                                                                                                                                                                                                       | #6355 (after #6288) |
| Card title                              | `components/shared/heading/heading-variants.ts` `cardTitle: text-admin-15 [font-weight:650]`                                                                                                                                                                                                                                                | 14 / 20 / 600                                                                                                                                                                                                                                                                                                                   | #6355               |
| Card supporting text                    | `card-variants.ts`                                                                                                                                                                                                                                                                                                                          | 18px line height                                                                                                                                                                                                                                                                                                                | #6355               |
| Card landmark                           | `components/shared/card/card.tsx` root is a `div`; its optional `aria-labelledby` prop turns it into `role="group"` (LookCard passes its title-only id)                                                                                                                                                                                     | one labelling path: the root becomes `section` (its `card.test.tsx` "not a group when nothing labels it" case is rewritten: a titled card is a region); the existing `aria-labelledby` prop stays as the override (LookCard unchanged); without it, a card whose header has a title is named by that title; `role="group"` goes | #6354               |
| StatusBadge                             | `components/shared/status-badge/status-badge-variants.ts`                                                                                                                                                                                                                                                                                   | 16px line height; dot `flex:none`                                                                                                                                                                                                                                                                                               | #6356               |
| DetailList                              | `components/shared/detail-list/detail-list-variants.ts` 132px, row gap 10, ellipsis on desktop, mono weight 400                                                                                                                                                                                                                             | §7.6 (112px, row gap 12, wrap, mono 500, stacked dt margin 10)                                                                                                                                                                                                                                                                  | #6356               |
| DetailList stacked to `lg`              | —                                                                                                                                                                                                                                                                                                                                           | an option that keeps the stacked layout up to 1023px (#6356 adds it); Domain and Owner pass it on the Overview Pair (#6289 turns it on)                                                                                                                                                                                         | #6356, #6289        |
| PageHeader                              | `components/shared/page-header/page-header-variants.ts` white band, rule, `pt-7 pb-5`; titleGroup no basis                                                                                                                                                                                                                                  | §5 surface + `flex-[1_1_320px]`; description 20px line height                                                                                                                                                                                                                                                                   | #6357               |
| h1                                      | `heading-variants.ts`                                                                                                                                                                                                                                                                                                                       | 32px line height, wrap anywhere, phone 22/28 (new `--text-admin-22`)                                                                                                                                                                                                                                                            | #6357               |
| Secondary button hover                  | `components/shared/button/button-variants.ts` hover `bg-admin-surface-2`                                                                                                                                                                                                                                                                    | hover border `brand-ink`                                                                                                                                                                                                                                                                                                        | #6358 (after #6337) |
| Ghost link on header                    | `button-variants.ts`; gap 7, hover #eef0f3                                                                                                                                                                                                                                                                                                  | hover `--admin-hover` (#6381), gap 6, phone padding 0 10                                                                                                                                                                                                                                                                        | #6358 (after #6381) |
| TenantPageHeader                        | `components/features/tenants/tenant-page-header/tenant-page-header.tsx` always shows the plan pill                                                                                                                                                                                                                                          | a boolean prop, default on; OwnerHomeView turns it off                                                                                                                                                                                                                                                                          | #6289               |
| Overview composition                    | `components/features/tenants/owner-home-view/*` (`lg:grid-cols-2`, YourSite left)                                                                                                                                                                                                                                                           | §6 order; band; pair `md:grid-cols-2`, `items-stretch`; gap `gap-4 md:gap-6`; band cells 12/16 at `md`–`lg`                                                                                                                                                                                                                     | #6289               |
| Your site                               | `owner-home-view/components/your-site-card/your-site-card.tsx`                                                                                                                                                                                                                                                                              | band §7.2 + footer strip in `Card.Footer` (info icon stroke 1.8)                                                                                                                                                                                                                                                                | #6289               |
| Domain card                             | `components/features/tenants/domain-card/domain-card.tsx` (pill in header)                                                                                                                                                                                                                                                                  | Status row first                                                                                                                                                                                                                                                                                                                | #6359               |
| Domain skeleton                         | `components/features/tenants/domain-card-skeleton/domain-card-skeleton.tsx`                                                                                                                                                                                                                                                                 | §7.3 skeleton                                                                                                                                                                                                                                                                                                                   | #6359               |
| Tiles                                   | `owner-home-view/components/make-it-yours-card/components/tile/*`                                                                                                                                                                                                                                                                           | brand icon; phone row; equal heights in a row                                                                                                                                                                                                                                                                                   | #6360               |
| Icon size and stroke                    | `components/shared/icon/icon-variants.ts` (SM 16 / MD 18 / LG 24), SVGs bake stroke 1.6                                                                                                                                                                                                                                                     | steps 10, 12, 14, 15, 17, 20 beside 16/18/24, and a stroke-width override (resolutions §2: one owner for every set)                                                                                                                                                                                                             | #6361               |
| Studio nav item                         | `utils/studio-nav-item/studio-nav-item.ts` (badge)                                                                                                                                                                                                                                                                                          | `status` (text, icon, tone) for three states; nothing at READY                                                                                                                                                                                                                                                                  | #6362               |
| Nav item type, content, Menu row        | `components/features/layout/sidebar/sidebar.tsx` (`TSidebarNavItem`; Studio's native `title` dropped while it has a status), `components/features/layout/nav-item-content/*` (`NavItemContent`, `TNavItemBadge`), `components/features/layout/topbar/components/topbar-nav-menu/*`, `utils/nav-sections/nav-sections.test.ts` (Studio case) | status slot §8.3, §8.5                                                                                                                                                                                                                                                                                                          | #6362               |
| Old tone map, keys, test                | `utils/status-tone/status-tone.ts`; `navSections.studioAccess.*`; `studio-nav-item.test.ts`                                                                                                                                                                                                                                                 | `OWNER_STUDIO_ACCESS_TONE` loses READY; old keys deleted; badge cases become line cases                                                                                                                                                                                                                                         | #6362               |
| Collapsed Studio                        | `nav-item-content-variants.ts`, `sidebar.tsx`                                                                                                                                                                                                                                                                                               | corner badge, hidden description span, shared tooltip on the right; no native `title` (already dropped by #6362)                                                                                                                                                                                                                | #6363               |
| Coming soon pill; phone Menu inert rows | `utils/nav-sections/nav-sections.ts`, `topbar-nav-menu.tsx`                                                                                                                                                                                                                                                                                 | no dot; in the phone Menu `aria-disabled="true"`, not focusable, the resting colours of the Menu's enabled rows (#6376's), no hover change. The sidebar and rail inert rows (disabled, resting colours, no hover, 50% on the rail) are **#6342's**, and #6364 depends on it                                                     | #6364               |
| Studio current under tools              | `components/features/layout/sidebar/components/sidebar-nav-link/sidebar-nav-link.tsx` and `topbar-nav-menu.tsx`, both an exact match                                                                                                                                                                                                        | export `isNavItemFor` (`nav-sections.ts`, module-private today) and reuse it in both; current look is the shell's (SH1-TH1 L1 plate and bar, RAIL-BADGE F39 on the rail; §8.5 in the Menu)                                                                                                                                      | #6365               |
| Phone Menu tooltip                      | `topbar/components/topbar-nav-menu/*` (native `title`)                                                                                                                                                                                                                                                                                      | the shared tooltip "Menu", bottom-start                                                                                                                                                                                                                                                                                         | #6366               |
| Studio access buttons                   | `components/features/studio/owner-studio-access-view/components/owner-access-actions/owner-access-actions.tsx` (Check now always primary)                                                                                                                                                                                                   | emphasis and order per §8.6                                                                                                                                                                                                                                                                                                     | #6367               |

Moved or dropped from this set (resolutions §2, X9, X11):

- NEW-dash-9 (Tooltip extraction) → owned by **#6370**; #6363 and
  #6366 depend on it.
- NEW-dash-12 (breadcrumb "Dashboard › Overview" and LB breadcrumb look) →
  **dropped**: the Overview shows SH1's single crumb "Dashboard"; breadcrumb
  values are #6377's.
- NEW-dash-17 ("Admin navigation" / "Sections" landmarks) → **dropped**: SH1's
  `aside` "Sidebar" with one `nav` per section stands.

Reuse map: `Card` (+ Header, Body, Footer), `StatusBadge`, `DetailList`,
`ExternalLinkButton`, `LinkButton`, `Button`, `Icon` (`INFO`, `MAIL`, `CLOCK`,
`WARNING`, `ARROW`, `EXTERNAL_LINK`, `PALETTE`, `QUOTE`, `SETTINGS`), the
shared Tooltip (#6370), the focus-ring helper (#6337),
`TenantPageHeader`, `PageHeader`, `Heading`, `Text`, `Alert`,
`ArchivedTenantNotice`, `SiteSetupCard`, `RunStepsCard`, `formatDate`,
`tenantStatusTone`, `domainVerificationTone`, `ownerStudioAccessFor`. The band
is the one new layout; it lives with the Overview unless a second page needs
it.

Shared files inside this set, and the edges they set:

| File (under `apps/platform/src/`)                                                  | Tickets                               | Order                                                           |
| ---------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `components/features/layout/sidebar/sidebar.tsx` (`TSidebarNavItem`)               | #6362, #6363 (and #6342's inert rows) | #6342, #6362 → #6363; never in parallel with #6342              |
| `components/features/layout/nav-item-content/*` (`TNavItemBadge`)                  | #6362, #6363                          | #6362 → #6363                                                   |
| `components/features/layout/topbar/components/topbar-nav-menu/topbar-nav-menu.tsx` | #6362, #6364, #6365, #6366            | #6362 → #6364 → #6365; #6366 never in parallel with any of them |
| `utils/nav-sections/nav-sections.test.ts`                                          | #6362, #6364, #6365                   | #6362 → #6364 → #6365                                           |
| `utils/nav-sections/nav-sections.ts`                                               | #6364, #6365                          | #6364 → #6365                                                   |
| `components/shared/heading/heading-variants.ts` (`size`: `cardTitle`, `pageTitle`) | #6355, #6357                          | no edge (neither needs the other); never in parallel            |

#6362 does not edit `nav-sections.ts`: it already passes `studioAccess` to
`studioNavItem`, whose return shape changes. It edits `nav-sections.test.ts`,
whose Studio case asserts the old badge.

`styles/admin-theme.css`: #6357 adds `--text-admin-22`, so it joins the
admin token chain, which runs one PR at a time. Its place:
#6321 → #6288 → #6381 → #6403 → **#6357** → #6291. #6357
depends on #6403, and #6291 depends on #6357; resolutions §2's chain
row and §4's edge list carry the same order.

Never in parallel (same files): `heading-variants.ts` (#6355, #6357);
`layout/sidebar/`, `nav-item-content/`
(#6362, #6363, #6365 with #6287, #6373/#6374/#6375, #6341/#6346/#6348/#6342);
`layout/topbar/` (#6362, #6364, #6365 and #6366 with the shell's
topbar tickets #6287, #6374, #6376, #6377, #6378, #6347);
`shared/button/` (#6358 with #6337, #6410, #6327);
`status-badge/`, `detail-list/` (#6356, #6359 with #6409,
#6383; #6289 only passes #6356's option through `StreamedDomainCard`,
`DomainCard` and `OwnerCard`); `card/` (#6354 then #6355); `page-header/` (#6357
then #6416, #6391); owner-home tiles (#6360, #6340);
Domain card (#6359, #6351); `styles/admin-theme.css` (#6357 in
the token chain, above).

## 13. Tokens

| Hex (light / dark)                                | Token                                                                        | Status                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| #f6f7f9                                           | `--admin-bg`                                                                 | exists                             |
| #fff                                              | `--admin-surface`                                                            | exists                             |
| #fbfbfd                                           | `--admin-surface-2`                                                          | exists                             |
| #e5e7eb                                           | `--admin-line`                                                               | exists                             |
| #eef0f3                                           | `--admin-line-2`                                                             | exists                             |
| #eef1f6 / #1d2027                                 | `--admin-surface-head`                                                       | new, #6288                         |
| #878f9d / #737d8d                                 | `--admin-control-line`                                                       | value changes in #6288 (X14)       |
| #e2e5ea / #22262f                                 | `--admin-hover`                                                              | new, #6381; reused by the DNS link |
| #12141a / #5b6472                                 | `--admin-text` / `--admin-muted`                                             | exist                              |
| #4f46e5 / #3730a3 / #eef2ff                       | brand set, `brand-ink`                                                       | exist / #6288                      |
| ok / warn / bad pairs                             | exist                                                                        | exist; dark with #6291             |
| #eef0f3, #d9dde4, #2a303b, #5b6472, #fff, #4f46e5 | `side`, `side-line`, `side-text`, `side-muted`, `side-raised`, `side-accent` | new, #6288 (dark #6291)            |
| 22px                                              | `--text-admin-22`                                                            | new, #6357                         |

## 14. Decisions

Every O-item, with what settled it (resolutions §5.3):

| #   | Settled                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | Rule (TH1): ACTIVATING icon `brand-ink` #4f46e5 / #a5b4fc; STALLED icon and text `bad` #b42318 / #fca5a0 (§8.3)                                                                                                                                                                                          |
| O2  | Board: RAIL-BADGE draws the grey rail badge (§8.4)                                                                                                                                                                                                                                                       |
| O3  | Rule (SH1): phone Menu is `role="menu"`, `aria-haspopup="menu"`                                                                                                                                                                                                                                          |
| O4  | Rule (cards = LB): one Domain card everywhere, Status row included                                                                                                                                                                                                                                       |
| O5  | Rule: global — card chrome, card region, pills, detail lists, page heading and button hovers apply to every admin page                                                                                                                                                                                   |
| O6  | Decided 31 Oct (Q1, S2 below): keep the registered outlines                                                                                                                                                                                                                                              |
| O7  | Board: DB3-S F16–F18 emphasis (§8.6, #6367)                                                                                                                                                                                                                                                              |
| O8  | Shell set (SH1 D5): the switcher for a one-workspace owner; no dashboard ticket waits on it                                                                                                                                                                                                              |
| O9  | Rule (TH1): `control-line` #878f9d (X14)                                                                                                                                                                                                                                                                 |
| O10 | Board: 768 (X26); BAND-820 draws 768–1023 (§2)                                                                                                                                                                                                                                                           |
| O11 | Rule: `apps/platform` has no Storybook; styling-only tickets are covered by #6368's frame-by-frame steps; their side-by-side screenshots go in a PR comment, never the PR body (12-line cap)                                                                                                             |
| O12 | Board: NOTICES (§6.1)                                                                                                                                                                                                                                                                                    |
| O13 | Rule: the line ships on the TH1 grey sidebar (light with #6288), dark with #6291                                                                                                                                                                                                                         |
| O14 | Resolutions: #6370 owns the Tooltip                                                                                                                                                                                                                                                                      |
| O15 | Rule: LB's look for every tooltip                                                                                                                                                                                                                                                                        |
| O16 | Board: the pill drops to its own line under a wrapping title                                                                                                                                                                                                                                             |
| O17 | Decided 31 Oct (Q11, S4 below): filed #6289 is rewritten to composition only                                                                                                                                                                                                                             |
| O18 | Board: LB line geometry; row padding SH1's (§8.3)                                                                                                                                                                                                                                                        |
| O19 | Rule (X27), split by priority: #6368 checks Light and carries `prio:next`; the Dark pass is #6369, which checks only what #6291 changes on these surfaces, so its implementation is #6291 and it is `prio:next`, following #6291 once that is relabelled (S6); 820 and 1024 are checked against BAND-820 |
| O20 | Rule (TH1): the gapped ring (§3.4)                                                                                                                                                                                                                                                                       |
| O21 | Board: no avatar in the phone top bar, icon-only Menu (SH1 F1, LB F4/F5); the phone account lives at the Menu foot (#6376)                                                                                                                                                                               |
| O22 | Rule (CLAUDE.md "Ticket priority"): #6365 is a sub-issue on the active path, so `prio:next` (S5 below)                                                                                                                                                                                                   |
| O23 | Resolutions §4: #6314 first; then filing in dependency order                                                                                                                                                                                                                                             |

Decided 31 Oct (every recommendation approved as written; S7 is the one filing prerequisite left):

- **S1 — Studio line on a hovered row.** TH1's row hover #d9dde4 puts the
  muted line at 4.39:1. Written into #6362: the muted line
  text (INVITE_SENT, ACTIVATING) takes `side-text` #2a303b while hovered
  (9.73:1); STALLED's `bad` text keeps its tone (4.83:1); the phone Menu does
  not swap (§8.3, §8.5).
- **S2 — icon shapes (O6, X22b).** Boards draw the Voice quote and the
  palette's dots filled and their own info, mail, clock, warning and
  external-link paths; SH1/LB stroke 1.6, TH1 stroke 2. Decided (Q1): keep the
  registered outlines and move every stroked admin icon to stroke 2. It
  **blocks no dashboard ticket**: the nav icons are the shell's and #6368 has no icon step.
- **S3 — the new non-English platform copy** (§11: Studio lines, collapsed
  tooltip pattern). **Approved 31 Oct (Q30)** as drafted;
  all of it is platform UI and none of it is Voice. The Domain "Status" label reuses
  `tenantDomainPage.statusLabel` and needs no approval.
- **S4 — rewriting filed issue #6289 (O17)** to the composition-only title
  and body in the ticket set. Filed #6289 is titled "…and the Studio item
  shows its access state inline until ready" and still owns the Studio state,
  which overlaps #6362 (Studio state) and #6359 (the Domain "Status"
  row). **Approved 31 Oct (Q11):** one issue edit, title
  and body, to the composition-only draft in the ticket set; #6362 and
  #6359 carry "#6289 body rewritten" in their dependencies, never in
  their bodies.
- **S7 — four boards to publish.** BAND-820, NOTICES, RAIL-BADGE and SH1-TH1
  must be published to the canvas (§ "Four boards are not yet on the canvas"
  above) before #6355, #6356, #6357, #6360, #6361, #6362, #6363, #6364, #6365, #6289,
  #6368 and #6369 are filed; each carries "<board> on canvas" as a
  dependency. #6358, #6359, #6354, #6366 and #6367 cite only LB and DB3 boards and
  do not wait on it.

Cross-set follow-ups this doc settles but cannot write (other sets' specs and
tickets; to land in #6314 and the shell and theme ticket sets before filing):

- Shell spec §6.4, §10 and D26, and #6376: the Studio row carries no
  native `title` while it has a status (§8.1, §8.5).
- Shell spec §6.4 (Coming soon "with dot") and §10 ("Coming soon" pills
  "with dot"): no dot (#6364, §3.2).
- #6376's criterion '"Coming soon" rows are inert' in the phone Menu
  duplicates #6364, which resolutions §2 makes the phone Menu inert
  rows' one owner: #6376 drops it.
- Theme spec §5.4 `hover` row: its usage widens to every ghost button
  (#6358, §7.3).
- **S6 — Dark manual test priority.** A manual-test issue carries its
  implementation's `prio:*`. #6369 checks only the dark values #6291
  brings to these surfaces (every step is tagged #6291), so its implementation
  is #6291 and it takes #6291's priority. **Decided 31 Oct (Q12):** #6291 is relabelled
  `prio:next` and #6369 is `prio:next` with it; if #6291 is
  re-prioritised, #6369 follows in the same change.
- **S5 — #6365 priority (O22). Settled by rule:** a sub-issue of the
  active set is `prio:next` (CLAUDE.md "Ticket priority & triage"), and with no
  item current inside Studio it is a user-facing bug. No longer open.

## 15. Acceptance checklist

Tick each against the build at the stated width, side by side with the frame.
The shell around each frame is checked against SH1-TH1, never against the
dashboard board's own shell.

### F1 · 1440 (LB-D)

- [ ] Content starts 26px right of the sidebar, left-aligned, inner width 1124
- [ ] h1 "Field Notes" 24/32/600 with `ok` "Active" pill (dot) 10px after it
- [ ] No plan pill in the heading
- [ ] Description "Your site at a glance. Everything here is live." 13.5/20 muted, 4px below
- [ ] Heading on the page background: no white band, no rule
- [ ] Open site top-right: border #878f9d, radius 4, 13/500, padding 8/13, shadow sm, external icon 16; hover border #4f46e5; opens in a new tab; named "Open site (opens in new tab)"; §3.4 focus ring
- [ ] 24px between heading and the Your site card
- [ ] Your site header: tint #eef1f6, min-height 50, padding 12/18, border-bottom #e5e7eb, title 14/20/600
- [ ] Band: 4 cells 3:3:2:2, dividers #eef0f3, padding 16/20 (first 18 left)
- [ ] Cells: Name "Field Notes"; Public domain mono 13px "fieldnotes.valstack.dev"; Plan `plan` pill "Growth" no dot; Language "English"
- [ ] `dt` 12.5/18 muted; `dd` 14/22/500, 4px below
- [ ] Footer strip #fbfbfd, border-top #eef0f3, padding 11/18, info icon 16 at stroke 1.8, hint text 12.5/18 muted
- [ ] Pair: two 550px cards, gap 24, ending level
- [ ] Domain header: "Domain" + "DNS →" link (no pill); DNS hover #e2e5ea; §3.4 focus on the header ground
- [ ] Domain rows: Status `ok` "Verified" (dot); Public domain mono; Last checked "Just now"
- [ ] Owner rows: Email mono 12.5/500; Role `neutral` "Owner" (dot); Joined `<time>` "Sep 12, 2026"
- [ ] Detail lists: label column 112, column gap 14, row gap 12, 13.5/20
- [ ] Make it yours header: title + "changes go live immediately" 12.5/18 muted
- [ ] Three tiles, gap 12: indigo 24px icons; Look / Voice / Features with their descriptions; title 8px below the icon, description 2px below the title
- [ ] Tile hover: border #4f46e5, bg #fbfbfd
- [ ] Sidebar Studio: two-line item, warn mail icon, "Invite sent — check your email", 53.5px tall (LB draws 54); "Studio" label on one line, on the shell's 19.5px line
- [ ] Nav icons per §4, item by item: which icon sits on each row (the shell's, unchanged by this set; their outline vs filled shape is S2's and is not checked here)
- [ ] Leads shows `brand` "2 new" (no dot); Subscribers, Comments, Team show `neutral` "Coming soon" (no dot), keep full resting colour, are announced disabled and are not focusable
- [ ] Every card is a region named by its title

### F2 · 1280 stress (LB-S)

- [ ] Inner content width 964
- [ ] Long h1 wraps; Active pill on its own line under the title, left edge, 10px down; Open site stays top-right
- [ ] Band Name wraps inside its 3fr cell; mono long domain breaks anywhere; band height follows the tallest cell
- [ ] Plan `plan` "Free"
- [ ] Domain Status `warn` "Pending — awaiting DNS" (dot)
- [ ] Owner Email (long, mono) wraps — never ellipsised
- [ ] Owner third row label "Invited", value "Oct 28, 2026, not signed in yet"
- [ ] Domain and Owner still end level
- [ ] Studio line still "Invite sent — check your email"

### F3 · 1920 (LB-S)

- [ ] Content capped at 1180, left-aligned; empty space to the right
- [ ] Studio is a plain single-line item (READY): **no** "Ready — open to start writing" line (D3); its absence is the pass

### F4 · 390 (LB-S)

- [ ] No sidebar; SH1's 67px top bar, 44×44 icon-only Menu button with a "Menu" tooltip below it, start-aligned, 6px away, on hover and focus; no account avatar; breadcrumb "Dashboard" only
- [ ] Content padding 16, gap 16
- [ ] h1 22/28 + Active pill; description; Open site on its own line, ≥ 44 tall
- [ ] Band 2 columns: Name full row, Public domain full row, Plan + Language sharing a row with a divider; cell padding 12/16; top borders between rows
- [ ] Footer strip padding 11/16
- [ ] Domain above Owner, gap 16
- [ ] Detail lists: label above value, 10px before each later label
- [ ] DNS ≥ 44 tall
- [ ] Tiles one column, rows at least 64px tall (render about 67px), padding 14, icon left and vertically centred, 12px gap, title and description stacked with no gap

### F5 · 390 stress (LB-S)

- [ ] Long h1 wraps; long mono domain breaks; Plan "Free"; Pending pill; long email wraps; "Invited … not signed in yet"

### F28–F31 · 820 and 1024 (BAND-820)

- [ ] 820 typical (F28): content 504; band 4 cells 3:3:2:2 (151 / 151 / 100 / 100) padded 12/16 with the first cell 18 on its left; Growth pill fits its Plan cell
- [ ] 820: Domain and Owner side by side, 240px each, ending level; both lists stack label over value
- [ ] 820: tiles 3 columns (147px), descriptions wrap, tiles in the row one height
- [ ] 820 stress (F29): long name and domain wrap inside their cells; "Pending — awaiting DNS" and the long email fit the stacked lists; nothing clipped
- [ ] 820 with the sidebar collapsed: the lists still stack and the band keeps 12/16 (window width, not column)
- [ ] 820 stress (F29), expanded 264px sidebar: Studio is the two-line item, warn mail icon, "Invite sent — check your email", nav icon 2px down, label and line 2px apart, 53.5px tall
- [ ] 1024 (F30, F31): content 708; band 212 / 212 / 141 / 141 at 16/20; Pair 342px each with the 112px label column; every value matches the 1280 frame
- [ ] Studio at READY (F28, F30) is a plain item; the drawn "Ready — open to start writing" is void

### F32–F33 · Notices (NOTICES)

- [ ] Archived (F32): the warning notice "This tenant is archived …" sits between the heading and Your site, 24px above and below; heading pill `neutral` "Archived"; the notice is a status region; cards below unchanged
- [ ] Setup stopped (F33): the setup card sits in the same slot; error Alert "Your site's setup stopped" with "Try again", announced as an alert; 16px below it the open steps card "Setting up your site" with "3 of 6 done", Connect domain failed, settled steps with relative times; cards below unchanged
- [ ] Not started shows the warning Alert with "Start setup"; running shows the steps card alone
- [ ] The archived notice's date is plain text "Oct 14, 2026" (the board's `<time>` is void)
- [ ] The steps card keeps its white trigger (14px 18px, no tint, no 50px minimum), title 14/20/600, `neutral` count pill, `faint` chevron turned open, panel 18px under a #eef0f3 rule

### DB3-S states (F8–F12, F16–F23)

Copy, icon, tone and wrapping per DB3; geometry per LB/SH1; colours per TH1 (§8.3).

- [ ] INVITE_SENT: mail icon, warn #8a5f00, "Invite sent — check your email"
- [ ] ACTIVATING: clock icon, brand #4f46e5, "Setting up…", no animation
- [ ] STALLED: warning icon and "Needs attention" both #b42318
- [ ] READY: no line, no pill
- [ ] Hovered Studio with a line: INVITE_SENT and ACTIVATING text turns #2a303b; STALLED text stays #b42318; icons keep their tones (S1)
- [ ] Focus (F20): the sidebar ring wraps both lines; a screen reader reads "Studio, <line>" once, with the comma from the hidden separator and no "Studio" description (no native title)
- [ ] Operator tenant detail (F21): Studio without a line
- [ ] German (F22): line wraps, nothing truncated
- [ ] Phone Menu (F23): Studio row in SH1's row padding, 53.5px tall (about 9.5px taller than its 44px siblings), "Needs attention"; other rows 44; no badge on the Menu trigger
- [ ] Phone Menu name (F23): the Studio row reads "Studio, Needs attention" once, with no native `title`; at READY it reads "Studio" and keeps `title` = "Studio"
- [ ] Phone Menu line colours (§8.5): line text #5b6472 and the toned icon on the row as the shell draws it; on a hovered row the line text stays #5b6472 (no swap). The row ground, label and icon colours, hover ground and current plate are #6376's and are checked in its manual test
- [ ] READY in the expanded sidebar: Studio keeps `title` = "Studio" like every other row; with a line it has none
- [ ] Studio page (F16–F18): Studio current with its line; access card copy unchanged; buttons per §8.6

### F34–F42 · Collapsed rail (RAIL-BADGE)

Only the rail and the badge count; C1's page content is void (§2).

- [ ] F34–F36: badge on Studio's icon (mail #8a5f00, clock #4f46e5, warning #b42318), 14px circle, 10px icon at stroke 2.6, overlapping the icon's lower-right corner by 6.5px; tooltip "Studio · <line>" to the right, 6px, centred
- [ ] F37 READY: no badge; tooltip "Studio" only
- [ ] F34–F36, F40: exactly one tooltip on Studio, "Studio · <line>"; the row's name tooltip "Studio" never shows beside or after it
- [ ] F38 at rest: no fill, no tooltip; badge circle on #eef0f3
- [ ] Hovered: badge circle on the row hover #d9dde4
- [ ] F39 current: white plate, 3px bar, badge circle #fff
- [ ] F40 keyboard focus: gapped ring (2px #eef0f3, 2px #4f46e5); icon #12141a; tooltip at once; Escape hides it
- [ ] F41 German: tooltip on one line, growing over the page
- [ ] F42 in context: the badge is the only status on the rail; no status in the top bar. C1's page content is void (§2): the page is checked against F1, not C1
- [ ] A screen reader hears the name "Studio" then the status once as its description; no native title; the hidden description and the tooltip sit outside the link, and no two description ids repeat in the document
- [ ] DB3-S F19: the same model (name, description, badge, right-hand tooltip); its dark colours and 44px item are void

### Heading edge cases (F25–F27)

Layout and copy only; sizes and colours per LB (§9).

- [ ] Long name wraps, pill on its own line
- [ ] Archived shows `neutral` "Archived" (dot) only
- [ ] Operator tenant Overview keeps the plan pill

### Dark (after #6291; #6369)

- [ ] Repeat F1, F4, F28 and F34–F40 in Dark (layout from those Light frames; colours from SH1-TH1 D1–D4, whose page content is void, §2): cards on `surface` / `surface-head` #1d2027, pills, the Studio line (`side-muted` #8d96a6; icons #f5c451 / #a5b4fc / #fca5a0; STALLED text #fca5a0; hovered muted text #c9cfda) and the badge (#f5c451 / #a5b4fc / #fca5a0 on #0a0c0f / #1c1f26 / #20242e) meet 4.5:1 (text) and 3:1 (icons); the focused rail icon is #ffffff; the shell matches SH1-TH1 D1–D4
- [ ] Phone Menu in Dark (P2): the Studio line text #a3abb8 with icons #f5c451 / #a5b4fc / #fca5a0, still #a3abb8 on a hovered row; "Coming soon" #a3abb8 on the popup neutral-pill ground #323845 (not #262a33); the rows themselves are #6376's on #6291's popover tokens
- [ ] DNS in Dark: #e8eaef on `surface-head` #1d2027 at rest, hover ground #22262f; Open site's hover border `brand-ink` #a5b4fc

## Out of scope (optional follow-up)

Not filed; listed so a later round can pick them up.

- **Archived and unfinished heading copy** (NOTICES): whether "Everything here
  is live." and Open site should change on an archived tenant or one whose
  setup has not finished. D4 keeps both today.
- **A `<time>` element in the archived notice** (NOTICES F32): the board wraps
  "Oct 14, 2026" in `<time datetime>`; the notice stays today's plain text (D4).
- **44px rows on the desktop collapsed rail** (RAIL-BADGE): the board proposes
  every rail row rise to 44×44. SH1's rows stand; a change belongs to the shell
  set.
- **Filled icon variants** (the Voice quote, the palette's dots), only if the registered outlines are later
  replaced (S2 keeps them): a registry ticket before any consumer.
