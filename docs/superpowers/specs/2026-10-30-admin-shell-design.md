# Admin shell: SH1 · Classic sidebar, in TH1 colours

Design of record for the platform admin shell, direction **SH1 · Classic
sidebar**, chosen on 30 Oct 2026, painted in **TH1** colours under the
precedence rule the user approved on 30 Oct ("Yes, use that rule"):

- **Shell structure and geometry** (sidebar, top bar, collapse button first in
  the top bar, breadcrumb, account menu at the sidebar foot, phone Menu, popup
  geometry) come from **SH1**.
- **Colour and tokens** (light and dark palettes, popover colours, control
  borders, focus ring, sidebar ground and active plate and bar, the
  Light / Dark / System switch) come from **TH1**.
- **Tooltip**: layout B's look; opens after Base UI's hover delay, at once on
  keyboard focus.
- **Page head, cards and pills** come from dashboard layout B and are not the
  shell's (§5).
- Pages a board drew only as a backdrop are out of scope (end of this doc).

The visual reference is the Admin redesign canvas
(https://claude.ai/artifact/LVch29ZcSE9Lh5T3Cocm9J). Board letters used below:

| Letter | Board                                                                                                                  | What it settles                                                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D**  | "SH1 · Classic sidebar (chosen, revised) · Desktop" (`shell-SH1-classic-sidebar-desktop`)                              | Geometry, 1440×900                                                                                                                                   |
| **S**  | "SH1 · Classic sidebar (chosen, revised) · States and phone" (`shell-SH1-classic-sidebar-states`), frames 1–15         | Geometry of every state and the phone                                                                                                                |
| **G1** | "SH1 shell in TH1 colours — Light and Dark" (`gap-shell-sh1-in-th1`), frames L1–L4, D1–D4, P1, P2 and the token legend | **The builder's single colour reference**: SH1 geometry in TH1 tokens, Light and Dark                                                                |
| **G2** | "Phone Menu sub-menus" (`gap-shell-phone-menu-submenus`), frames 1–4 and the "Current row vs highlighted row" specimen | Workspace dropdown and account menu opened from inside the phone Menu (a proposal for D2, D20)                                                       |
| **G3** | "Operator phone Menu" (`gap-shell-phone-menu-operator`), frames 1–3                                                    | Phone Menu height when its content is short (D18)                                                                                                    |
| **G4** | "Phone breadcrumb states" (`gap-shell-breadcrumb-phone-states`), frames 1–8                                            | Three-crumb phone trail, "…" hover, focus and open, Full path menu placement (D4, D13, D14)                                                          |
| **G5** | "Account states, grey sidebar" (`gap-shell-account-states`), sections 1–3                                              | Account trigger hover and the email-only account (D15, D16)                                                                                          |
| **T1** | `gap-dash-band-820` (dashboard set), the 820 and 1024 frames                                                           | The shell at tablet widths: "Top bar and sidebar are SH1 unchanged", the toggle then "Dashboard", the 264px sidebar                                  |
| **T2** | `gap-voice-820` (Voice set), "820 · keyboard focus and tooltip"                                                        | The shell at 820: the 264px SH1 sidebar, the 59px bar with page content sticky under it, the shared Tooltip shifting left at the window's right edge |

Geometry values are copied from D and S, colours from G1 (and TH1's tokens).
None is rounded. Where boards disagree, the row names which one wins and why.
The cross-set decisions this doc applies are recorded in the reconciliation
note (`2026-10-30-admin-redesign-resolutions.md`, X1–X30); the ones that touch the shell are cited by
number.

The build is done when every row of the **Acceptance checklist (§19)** can
be ticked against the running app, side by side with the board frame it
names, at 390, 820, 1280, 1376, 1440 and 1920px, in Light, and in Dark once
#6291 has landed (X27).

## 1. Why

Manual QA of the admin on dev (30 Oct) found these problems:

- On a wide display the content is centred instead of starting at the sidebar.
- The account dropdown has square top corners and reads like a tab.
- "Add tenant" sits in the sidebar, but it isn't a place to go.
- Long breadcrumbs wrap onto a second row.
- The collapse toggle is buried in the brand row.

Earlier design rounds shipped with items missing. One example is the
segmented stepper that is drawn on the onboarding board but absent from the
build. That is why this spec lists every element, and why §19 is a checklist
per frame and not a summary.

## 2. Scope

**In scope (the shell owns these):**

- The sidebar: the box, the brand row, the nav area and its scrolling, the
  collapsed rail, and the account at the foot.
- The top bar: the first slot (desktop toggle or phone Menu button), the
  shared Tooltip and the breadcrumb.
- The shared shell popup frame and every shell popup: the account menu, the
  Workspace dropdown's popup, the phone Menu and the breadcrumb's Full path
  menu.
- The content column: its padding, cap and alignment.

**Governed elsewhere. Drawn on the boards, built by another ticket:**

| Drawn on the boards                                                                              | Owner                                                                              | What this spec says about it                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The TH1 palette: grey sidebar, popover, control-border and side-field tokens, JetBrains Mono     | #6288 (theme set)                                                                  | Every shell colour is built on an `--admin-*` token, never a hex, so #6288 (Light) and #6291 (Dark) re-value it. §14 lists each token with its Light and Dark value.                                                                                                                         |
| The dark palette and the theme preference                                                        | #6291 (theme set)                                                                  | Dark is checked in the manual test once #6291 lands (X27). The Dark tooltip look (G1 D2) is #6291's to apply (§9.3).                                                                                                                                                                         |
| The sidebar's active plate and bar (`side-raised`, 3px `side-accent` bar)                        | #6341                                                                              | The shell renders the current row; its plate and bar are #6341's.                                                                                                                                                                                                                            |
| The Theme section in the account menu (Light / Dark / System, helper line)                       | #6345 (radio group), #6346 (desktop), #6347 (phone Menu)                           | The shell ships the menu with its header and Sign out. The menu keeps the trigger's width with the Theme section in it (§8.1).                                                                                                                                                               |
| Collapsed-rail row tooltips                                                                      | #6348                                                                              | Rail rows adopt the shared Tooltip (#6370) and, in the same change, drop their native `title` so only one tooltip shows (D26). The account button keeps its native `title` (G5 §3).                                                                                                          |
| The phone Menu button's "Menu" tooltip                                                           | #6366 (dashboard set)                                                              | The button's structure (§9.4) is unchanged; its tooltip lands before the phone Menu zones (#6376).                                                                                                                                                                                           |
| The Workspace switcher **trigger** (D, S F2/F7/F8/F13, G1 L1/L4)                                 | #6288 (colours), #6379 (geometry and structure)                                    | SH1 F7 structure and geometry (§6.3: min-height 52px, padding 8px 8px 8px 10px, 22×22 radius-4 avatar, one 16px down chevron, no "Workspace" label; X8) are **#6379's**, as #6288's own scope says; its TH1 `side-field` colours are #6288's.                                                |
| The Studio row's status line                                                                     | #6362, #6363 (dashboard set)                                                       | The shell renders whatever the row carries (X10).                                                                                                                                                                                                                                            |
| Badges (pills) on nav rows                                                                       | #6356 (20px pills, X12)                                                            | The shell renders the row's pill.                                                                                                                                                                                                                                                            |
| The page head (title, badges, description, actions)                                              | #6357 (global, X19)                                                                | §5. SH1's white header band is superseded.                                                                                                                                                                                                                                                   |
| New glyphs (`ICONS` + `@blog/ui` registry + platform registry)                                   | #6404 (keys, `@blog/ui`), #6405 (platform registry); both drafted in the voice set | #6404 adds the `ICONS.SIDEBAR` key and its `@blog/ui` glyph, because `@blog/ui`'s registry is a full `Record` over `ICONS` (X22a). #6405 registers `SIDEBAR` on the platform and also registers the existing `ICONS.CHEVRON_UP` with a new `chevron-up.svg` for #6375. Strokes wait on X22b. |
| The gapped focus ring                                                                            | #6337                                                                              | The shell uses the ring (§12); it does not redefine it.                                                                                                                                                                                                                                      |
| Overview cards (D, S, G1 backdrops)                                                              | #6289 and the dashboard set                                                        | Nothing. They are not checked against SH1.                                                                                                                                                                                                                                                   |
| The operator's tenant-detail sidebar (`/tenants/{id}`: "Tenant · {name}", "Platform actions", …) | —                                                                                  | Not drawn. Its sections and rows stay as today. It inherits every shell-level change (toggle, account foot, breadcrumb, content alignment, colours).                                                                                                                                         |
| Full-bleed pages (the embedded Studio)                                                           | —                                                                                  | The `isFullBleed` layout is unchanged. Only the shell chrome around it changes.                                                                                                                                                                                                              |

## 3. Frames and breakpoints

| Frame  | Board | Viewport                        | Shows                                                                                                                                                                                        |
| ------ | ----- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D      | D     | 1440×900                        | Tenant owner on Overview. Sidebar expanded (264px). Toggle at rest. Breadcrumb "Dashboard".                                                                                                  |
| 1      | S     | 390×760                         | Phone on Overview. No sidebar. The top-bar slot holds the **Menu** button (closed).                                                                                                          |
| 2      | S     | 390×760                         | Phone with the Menu open. Workspace dropdown pinned on top, nav scrolling, account pinned at the foot.                                                                                       |
| 3      | S     | 390×760                         | Phone, operator on Danger zone. The breadcrumb reads "… › Parent › Current", with the "…" menu open.                                                                                         |
| 4      | S     | 1376×620                        | Sidebar collapsed to 76px. The toggle is hovered: it reads "Expand sidebar" and shows its tooltip.                                                                                           |
| 5      | S     | 1440×600 (left 440 shown)       | Expanded. Keyboard focus on the toggle, with the "Collapse sidebar" tooltip.                                                                                                                 |
| 6      | S     | 1440×600 (left 440)             | Expanded. The account menu is open, opening upward.                                                                                                                                          |
| 7      | S     | 1440×600 (left 440)             | Expanded. The Workspace dropdown is open.                                                                                                                                                    |
| 8      | S     | 1440×600 (left 440)             | Expanded. Focus rings on the switcher, the "Look" row and the account trigger.                                                                                                               |
| 9      | S     | 1440×600 (left 390)             | Collapsed. The account is avatar-only and its menu opens to the right.                                                                                                                       |
| 10     | S     | 1920×1000 at 50%                | Content capped at 1180px from the sidebar edge.                                                                                                                                              |
| 11     | S     | 1376×700                        | Operator (super admin) on Tenants. Platform nav, no Workspace dropdown. "Add tenant" is the page's primary action.                                                                           |
| 12     | S     | 1376×58, header 640px wide      | Desktop long breadcrumb in a narrow column.                                                                                                                                                  |
| 13     | S     | 264×104 (sidebar strip)         | Switcher trigger with a long name and domain.                                                                                                                                                |
| 14     | S     | 264×96                          | Account trigger with a long name and email.                                                                                                                                                  |
| 15     | S     | 264×96                          | Account trigger with no name (email only).                                                                                                                                                   |
| L1, D1 | G1    | 1376, Light / Dark              | Expanded 264px: grey (Light) or near-black (Dark) sidebar, toggle first in the top bar, Look row hovered, Overview current with plate + bar.                                                 |
| L2, D2 | G1    | 1376, Light / Dark              | Collapsed 76px: "Expand sidebar" tooltip and focus ring on the toggle; Dark tooltip on the popover ground.                                                                                   |
| L3, D3 | G1    | 1376, Light / Dark              | Account menu open: 6px above the trigger, the trigger's width (239px; drawn 240, D29), header, Theme section, Sign out.                                                                      |
| L4, D4 | G1    | 1376, Light / Dark              | Workspace dropdown open on popover tokens, highlighted row on `popover-hover`, neutral Archived pill.                                                                                        |
| P1, P2 | G1    | 390, Light / Dark               | Phone Menu open on popover tokens: current row on `popover-hover` with the brand-ink bar, 44px rows.                                                                                         |
| G2-1…4 | G2    | 390, Light (1, 2) / Dark (3, 4) | Workspace dropdown opened from the Menu's pinned top (1, 3); account menu opened from its pinned foot (2, 4); keyboard highlight beside the current or checked row. Proposal for D2 and D20. |
| G3-1   | G3    | 390×760                         | Operator Menu (5 rows, no switcher) shrunk to its content: 352px. **Recommended, adopted (D18).**                                                                                            |
| G3-2   | G3    | 390×760                         | The rejected alternative: fixed 676px with ~325px of empty surface. Never build this.                                                                                                        |
| G3-3   | G3    | 390×420                         | The cap wins: 336px (viewport − 84); only the list scrolls, the foot stays pinned.                                                                                                           |
| G4-1…3 | G4    | 390                             | Three-crumb operator trail "Platform › Tenants › {tenant}" in full: short name, long name (the tenant leaf shrinks), focus on "Tenants".                                                     |
| G4-4…8 | G4    | 390                             | The "…" button at rest, hover, keyboard focus and open (Full path menu 7px below, left edges aligned), and the state table.                                                                  |
| G5-1   | G5    | 264, Light / Dark               | Expanded account trigger at rest, hover and open; email-only trigger at rest and hover.                                                                                                      |
| G5-2   | G5    | 1376, Light / Dark              | Email-only account, menu open: expanded (above the trigger) and collapsed (right of the rail).                                                                                               |
| G5-3   | G5    | 76, Light / Dark                | Collapsed 52px trigger at rest and hover, named and email-only.                                                                                                                              |
| T1     | T1    | 820, 1024                       | Owner Overview at tablet widths: 264px sidebar, toggle first in the bar, then "Dashboard". The page body is the dashboard set's.                                                             |
| T2     | T2    | 820                             | Voice at 820: 264px sidebar, 59px bar, the page's chip bar sticky directly under the bar, the shared Tooltip shifted left at the window's right edge. The page body is the Voice set's.      |

**Breakpoints.** "Phone" means below the `md` breakpoint (768px). There, the
sidebar is not rendered, and frames 1–3, P1/P2, G2, G3 and G4 apply. From
`md` up, the sidebar is in the flow and frames D, 4–12, L1–L4/D1–D4 and G5
apply. The shell's own boards draw no tablet frame, but two other sets' boards
draw the shell at tablet widths: T1 (`gap-dash-band-820`, 820 and 1024) and T2
(`gap-voice-820`, 820). Both draw SH1 unchanged, so they add no rule: at 820
and 1024 the desktop rules apply as they stand, a 264px sidebar or the 76px
rail with the content filling the rest. §19's "Tablet, 820 and 1024" rows
check the shell against T1 and T2.

## 4. Shell root and content column

| Element                     | Property  | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell root                  | layout    | Flex row from `md` (column below). Sidebar first in the DOM, then main. Background `--admin-bg` (#f6f7f9 / #0f1115), text `--admin-text` (#12141a / #e8eaef), Inter, line-height 1.5.                                                                                                                                                                                                                                                                                                                                                                                         |
| Main column                 | layout    | `flex:1`, `min-width:0`, column, `position:relative`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Content                     | max width | **1180px**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Content                     | alignment | **Starts at the sidebar's right edge. Not centred.** Spare width sits on the right (F10).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Content                     | padding   | 26px from `md`; 16px on phone                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Content                     | gap       | **Not the shell's; the content slot adds no gap at any width.** From `md` the boards draw 24px, which `components/shared/page-stack/` (`gap-6`) gives each page body. On a phone the boards disagree: S F1/F2 keep 24 (`.content.ph` overrides only the padding), while G1 P1/P2 (`.content.ph{gap:16px}`) and the owner-dashboard spec's <768 row draw 16. Page layout is dashboard layout B's under the precedence rule, so the phone gap is the page's to set (#6289's Overview `gap-4 md:gap-6`); S F1/F2's 24 is SH1's backdrop and no shell ticket builds or checks it. |
| Notice slot (above content) | alignment | Same as content: max 1180px, starts at the sidebar edge, 26px / 16px side padding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Sticky behaviour            | —         | Kept (D6): the sidebar is sticky at full viewport height from `md`, and the top bar is sticky and translucent with its blur (§9.1).                                                                                                                                                                                                                                                                                                                                                                                                                                           |

## 5. Page head (not the shell's)

The page head is global and owned by #6357 (X19, dashboard layout B):
no white band, title 24px/32 weight 600 −.01em wrapping anywhere (phone
22/28), description 13.5/20 muted 4px below, actions on the right with 44px
buttons on a phone. SH1's white header band (S F10: white fill from the
sidebar edge to the viewport edge, 28/20 padding, bottom rule) is
**superseded** and no shell ticket builds it. The shell's content column
simply holds whatever the page renders.

Page copy drawn on the boards (all existing, unchanged): Overview "Field
Notes" / "Your site at a glance. Everything here is live." / "Open site";
Danger zone "Danger zone" / "Irreversible actions for this tenant. Restricted
to superadmins."; Tenants "Tenants" / "Every site on the platform, with its
plan and status." / "Add tenant" (primary, plus icon).

## 6. Sidebar (from `md`)

Colours are TH1 tokens (G1 legend); the Light value is given first, Dark
second. #6288 re-values the tokens to Light; #6291 adds Dark. The shell code
names tokens only.

### 6.1 Box

| State     | Property          | Value                                                                                                                                                                                                                                                                  |
| --------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expanded  | width             | **264px** (includes the 1px right border)                                                                                                                                                                                                                              |
| Collapsed | width             | **76px**                                                                                                                                                                                                                                                               |
| Both      | background / text | `--admin-side` #eef0f3 / #0a0c0f; `--admin-side-text` #2a303b / #c9cfda                                                                                                                                                                                                |
| Both      | right border      | 1px `--admin-side-line` #d9dde4 / #1c1f26                                                                                                                                                                                                                              |
| Both      | layout            | Column: brand row (`flex:none`), switcher slot (`flex:none`; tenant only, expanded only), nav area (`flex:1`, `min-height:0`, scrolls on overflow), foot (`flex:none`, pinned to the bottom). The switcher slot sits **outside** the scrolling nav area (D, S F7/F13). |
| Both      | element           | `<aside id="sidebar" aria-label="Sidebar">`. The `id` is the target of the toggle's `aria-controls`.                                                                                                                                                                   |
| Both      | scrolling         | **The nav area scrolls, not the whole aside.** The brand row, the switcher slot and the foot stay put.                                                                                                                                                                 |

### 6.2 Brand row

| State     | Property | Value                                                                                                       |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| Expanded  | layout   | Flex, centre-aligned, gap 10px, padding 16px 18px, bottom border 1px `side-line`. Height ≈72px.             |
| Expanded  | mark     | 26×26, radius 4, gradient #6366f1 → #a855f7 (to bottom right), white "V" 13px/1 weight 700, `aria-hidden`   |
| Expanded  | name     | "Valstack", 14px, weight 700, letter-spacing .2px, `text-strong` #12141a / #ffffff                          |
| Expanded  | tagline  | "admin", 12px, `side-muted` #5b6472 / #8d96a6                                                               |
| Collapsed | layout   | Centred, padding 16px 8px, **the V mark only**. Height ≈59px.                                               |
| Both      | toggle   | **None.** The collapse toggle is no longer in the brand row (§9.2). TH1's brand-row toggle is dropped (X2). |

### 6.3 Workspace switcher slot (geometry #6379's, colours #6288's)

The slot is present for tenant users only, and only while the sidebar is
expanded. It is absent on the operator's Platform tree (F11) and absent from
the DOM when collapsed (F4, F9). The rule for when it renders stays as today
(more than one workspace). See D5.

The slot is `flex:none` between the brand row and the scrolling nav area, so
it never scrolls with the nav (§6.1).

As drawn (S F7 structure, G1 L1/L4 colours, X8): slot padding 12px 12px 4px.
The geometry and structure in this paragraph are **#6379's** (on `main`
the trigger has no minimum height, padding 8px 10px on both sides and a
`faint` chevron-right rotated 90°); the colours are #6288's.
The trigger is full width (239px: 264 − 1px border − 2×12px slot padding),
min-height 52px, padding 8px 8px 8px 10px, gap
9px, radius 4, background `side-field` #ffffff / #171a20, 1px border
`side-field-line` #7c8493 / #737d8d, small shadow. It holds a 22×22 avatar
(radius 4, 11px/700, "FN", `brand-weak` ground, `brand-strong` text), the
name (13px/600 `text`, **line-height 18px**, one line, ellipsis), the domain
(JetBrains Mono 11px `muted`, **line-height 16px**, one line, ellipsis) and one down chevron (16px `ICONS.CHEVRON_DOWN`,
already registered, unrotated, `muted`). No
"Workspace" label. When open, the border is `side-accent` #4f46e5 / #a5b4fc.
`aria-haspopup="menu"`, `aria-expanded`.

With both lines the trigger is **exactly 52px** (8 + 18 + 16 + 8 + 2px
border), the same arithmetic as the account trigger (§6.5). The boards render
it 52px. Left at the base line-height of 1.5, the 13px name and the 11px
domain would make it 54px under Tailwind's preflight. The line-heights are
pinned so that the Workspace dropdown's 4px gap (§8.3) is measured from a
known edge (D29).

### 6.4 Nav

| Element                  | Property       | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nav area                 | padding-bottom | 14px                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Section                  | layout         | Column, gap 6px, padding 14px 12px 0 (same when collapsed)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Section label            | type           | 11px, weight 700, letter-spacing .09em, uppercase, `side-muted` #5b6472 / #8d96a6, padding 0 10px 6px. Hidden when collapsed (`display:none`).                                                                                                                                                                                                                                                                                                                                                                    |
| Section landmark         | element        | One `<nav>` per section, named by its section label (X11; as the code has today)                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| List                     | layout         | Column, gap 2px, no bullets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Row                      | box            | Flex, centre-aligned, gap 10px, radius 4, padding 8px 10px, 13px **weight 400**, `side-text`, ≈35.5px tall. Icon `side-muted`. (SH1 D and F2 draw 400; G1 L1/P1 draw 500, but type is geometry, so SH1 wins.)                                                                                                                                                                                                                                                                                                     |
| Row                      | native `title` | **Expanded rows keep `title` = the label** (D, S F2, G1 L1 draw it on every row; a long label ellipses). Collapsed rail rows lose it when #6348 wraps them in the shared Tooltip, so only one tooltip ever shows (D26).                                                                                                                                                                                                                                                                                           |
| Row                      | hover          | Background `side-line` #d9dde4 / #1c1f26 (G1 L1/D1, "Look is hovered"), expanded and collapsed. RAIL-BADGE (`gap-dash-studio-rail-badge`) draws the rail hover as `--sidehover` #e3e6eb, which is no TH1 token; colour is TH1's, so G1's `side-line` wins on the rail too (D28). The dashboard set already voids #e3e6eb (#6363). RAIL-BADGE's amber corner badge #8a5f00 measures 4.15:1 on #d9dde4 (4.51:1 on #e3e6eb). The badge is a non-text icon, so the 3:1 non-text minimum applies and 4.15:1 passes it. |
| Row                      | current        | `aria-current="page"`, label **weight 600**; the `side-raised` plate (#ffffff / #20242e) with a 3px `side-accent` bar and `text-strong` text are **#6341's** (theme spec §7)                                                                                                                                                                                                                                                                                                                                      |
| Row icon                 | —              | 16px, as registered today (stroke 2, X22b)                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Row label                | —              | `flex:1`, one line, ellipsis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Row badge                | —              | `margin-left:auto`, `flex:none`; the pill itself is #6356's                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Inert row (unbuilt page) | —              | Not a link, not focusable, full opacity when expanded                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Row focus                | —              | The gapped ring: 2px `side` gap, 2px `side-accent` ring (F8, G1)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Collapsed row            | —              | Centred, padding 8px 0, the same 16px icon, **32px tall** (8 + 16 + 8: the label and badge are visually hidden and taken out of the flow, so only the icon sets the height; measured on G1 L2, all 12 rows; S F4 uses the same CSS). D25: SH1's row stands; RAIL-BADGE's 44×44 rows with 17px icons are not adopted. Label and badge kept as the accessible name. Inert rows at **50%** opacity. Row tooltips are #6348's, which also drops the row's native `title` (D26).                                       |
| Collapsed current row    | —              | **Keeps its plate and bar** (G1 L2/D2 note "The active icon keeps its plate and bar"): the `side-raised` plate with the small shadow fills the 52px-wide centred row, and the 3px `side-accent` bar sits at the row's left edge, as when expanded. Built by #6341; checked in §19 Frame 4.                                                                                                                                                                                                                        |

**Tenant nav, in order** (D, F2, F4–F10, G1). Unchanged from today.

| Section       | Row         | Icon          | Badge                             | State on D |
| ------------- | ----------- | ------------- | --------------------------------- | ---------- |
| Dashboard     | Overview    | house         | —                                 | current    |
| Content       | Studio      | pencil        | "Ready" (ok, with dot)            | —          |
| Configuration | Look        | palette       | —                                 | —          |
|               | Voice       | quote         | —                                 | —          |
|               | Features    | gear          | —                                 | —          |
|               | Leads       | paper plane   | "2 new" (brand, no dot)           | —          |
|               | Languages   | open book     | —                                 | —          |
|               | Domain      | globe         | —                                 | —          |
|               | Email       | envelope      | —                                 | —          |
|               | Subscribers | three lines   | "Coming soon" (neutral, with dot) | inert      |
|               | Comments    | speech bubble | "Coming soon"                     | inert      |
|               | Team        | two people    | "Coming soon"                     | inert      |

The Studio row's content (pill today, status line after #6362) is the
dashboard set's. The shell renders whatever the row carries.

**Operator nav (F11, G3).** One section, "Platform", with no Workspace dropdown:

| Row              | Icon                 | State on F11 |
| ---------------- | -------------------- | ------------ |
| Tenants          | 2×2 grid             | current      |
| Findings         | warning triangle     | —            |
| Releases         | clipboard with check | —            |
| Blocked sign-ups | shield with check    | —            |
| Data requests    | padlock              | —            |

**There is no "Add tenant" row.** "Add tenant" stays reachable as the Tenants
page's primary action. The `/tenants/new` breadcrumb still reads
"Platform › Tenants › Add tenant". Which row is current there is D17 (open).

### 6.5 Foot: the account trigger

| State                     | Property                | Value                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All                       | foot box                | `flex:none`, pinned to the bottom, padding 12px, top border 1px `side-line`                                                                                                                                                                                                                                                                                                                       |
| Expanded                  | trigger                 | Full width (≈239px), min-height 52px, padding 8px 10px, gap 10px, **radius 6**, transparent background, left-aligned, 1px border `--admin-control-line-tint` #7c8493 / #737d8d (X14: a control on a tinted ground; G1; 3.30:1 on `side` in Light, 4.71:1 in Dark). `aria-haspopup="menu"`, `aria-expanded`. With both lines the trigger is **exactly 52px** (8 + 18 + 16 + 8 + 2px border, G5-1). |
| Expanded                  | avatar                  | **30×30 circle**, `brand` ground (#4f46e5 / #5850ec), white 12px/600 initials ("AM"), `aria-hidden`                                                                                                                                                                                                                                                                                               |
| Expanded                  | name                    | 13px/600, **line-height 18px**, `text` (#12141a / #e8eaef; G1 L1/D1, theme spec §7.4), one line, ellipsis ("Alex Morgan"). The name line carries **`title` = the full name** (the email when there is no name), as G5-1 draws, so a truncated name can be read on hover.                                                                                                                          |
| Expanded                  | email                   | 12px, **line-height 16px**, `muted` (#5b6472 / #a3abb8; G1, theme spec §7.4), one line, ellipsis ("alex.morgan@example.com"). No `title`.                                                                                                                                                                                                                                                         |
| Expanded                  | chevron                 | 16px, `muted` (#5b6472 / #a3abb8), pointing **up**                                                                                                                                                                                                                                                                                                                                                |
| Hover (D15)               | trigger                 | Background `side-raised` (#ffffff / #20242e); border, text and chevron unchanged (G5-1). Not the nav-row hover `side-line`: the muted email on #d9dde4 measures 4.39:1 and fails 4.5:1. On `side-raised` the email measures 5.98:1 / 6.71:1.                                                                                                                                                      |
| Open                      | trigger                 | Border `side-accent` (#4f46e5 / #a5b4fc), background `side-raised` (G1 L3/D3; SH1 F6 draws the accent border on open).                                                                                                                                                                                                                                                                            |
| Focus                     | trigger                 | The gapped ring on the sidebar ground (F8). Focus does not change the border or fill.                                                                                                                                                                                                                                                                                                             |
| Collapsed                 | trigger                 | **52×52**, no padding, centred, avatar only. `title` = name. `aria-label` = "Account: {name}, {email}". Same border, radius 6, hover, open (F9) and focus states as the expanded trigger. Hover shows only the native `title`; there is no custom tooltip on the account button (G5-3).                                                                                                           |
| Long text (F14)           | trigger                 | Name and email each truncate with an ellipsis ("Alexandra Konstantinopoulou-Whitfield", "alexandra.konstantinopoulou@whitfield-editorial.example.com"); the name line's `title` holds the full name. The popup header shows both in full. The avatar reads **"AK"** (today's `getInitials`, unchanged).                                                                                           |
| No name (F15, G5)         | trigger                 | The **email takes the name line** (13px/600 `text`, #12141a / #e8eaef, the name's colour per D21; G5's Dark #ffffff is superseded), and the email line is **not rendered**. The avatar shows **one initial**, the email's first letter ("S" for sam.rivera@valstack.dev). Hover as above (G5-1 "Email-only · hover").                                                                             |
| No name (D16, G5-2, G5-3) | collapsed / menu header | Collapsed `title` = the email, `aria-label` = "Account: {email}" (`account.triggerCollapsedLabelNoName`). The menu header shows the email once, on the name line (13px/600), with no email line, then the role line ("Owner · Field Notes").                                                                                                                                                      |
| Operator (F11)            | content                 | "SR" / "Sam Rivera" / "sam.rivera@valstack.dev"                                                                                                                                                                                                                                                                                                                                                   |

**Boards disagree, resolved.** G5 draws the trigger's rest border in
`side-line` and its open border in `control-line-tint`; G1 draws rest in
`control-line-tint` and open in `side-accent`. G1 wins: it is the designated
builder's reference, it maps SH1's visible rest border and accent-on-open
(F6) onto TH1 tokens, X14 names `control-line-tint` for a control on a
tinted ground, and `side-line` on `side` measures 1.19:1, which fails the
3:1 boundary a control needs. G5's Dark frames also draw the name #ffffff
(`text-strong`) and the email and chevron #8d96a6 (`side-muted`); G1 D1/D3
draws them `text` #e8eaef and `muted` #a3abb8, which theme spec §7.4 also
names, so G1 wins there too. G5 is used for what it was drawn to settle: the
hover ground, the line-heights (18 / 16, which make the trigger exactly
52px), the name line's `title`, and the email-only account.

**Theme spec §7.4 must change to match (cross-spec blocker X-7.4).** It is
titled "colours for #6375" but still gives the rest border as 1px
`side-line` and the open border as `control-line-tint` on `side-raised`. The
rest value fails 1.4.11, so the theme spec's Rest and Open rows are corrected
to this table (rest `control-line-tint`, open `side-accent` on `side-raised`)
before #6375 is dispatched. Its Name and Email rows (`text`, `muted`)
already agree with this table.

The top bar no longer carries an account control at any width. On a phone
the account lives at the foot of the Menu (§10, X6). Until #6376 lands,
the phone keeps today's top-bar account.

## 7. Shell popup frame (shared by every shell popup)

Every shell popup uses TH1's popover tokens in both themes (X7). SH1's dark
popup colours (#0f1115 ground, #5b6472 border, black shadow) are dropped.
Geometry is SH1's.

| Element                   | Property                        | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup                     | background                      | `--admin-popover` #ffffff / #262b35                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Popup                     | border                          | 1px `--admin-popover-line` #e5e7eb / #4a5260                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Popup                     | radius                          | 6px on **every** corner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Popup                     | padding                         | 4px (phone Menu: 6px)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Popup                     | shadow                          | `--shadow-admin-lg`: `0 12px 40px rgba(16,24,40,.14)` / `0 12px 40px rgba(0,0,0,.55)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Popup                     | text                            | `--admin-text` #12141a / #e8eaef; secondary text and icons `--admin-muted` #5b6472 / #a3abb8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Item list                 | layout                          | Column, gap 2px                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Item                      | box                             | Flex, centre-aligned, gap 10px, **min-height 44px at every width**, padding 6px 8px, radius 4, 13px weight 500, `text`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Item                      | highlighted (hover or keyboard) | Background `--admin-popover-hover` #eef1f6 / #323845, text unchanged, **no ring** (TH1 §20.15). Any focus-visible ring an item carries on `main` (the Workspace dropdown items' `ring-admin-side-accent`, the sidebar row's side-ground ring reused in the phone Menu) is removed inside a popup. **One exception:** the Theme section's three `menuitemradio` segments (#6345's block, theme spec §9.3) are not §7 items. When highlighted they keep the `popover-hover` plate **plus an inset 2px `brand-ink` ring** (`box-shadow: inset 0 0 0 2px`, no gap), as G2 frames 2 and 4 draw (D32). The item slot never styles them, and the "no ring" rule does not reach them. |
| Group label (not an item) | type                            | 11px/700/.09em uppercase **`muted`** (#5b6472, 6.4:1 on white; G4 moved it off SH1's #7d8696, which fails 4.5:1), padding 8px 8px 4px                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Header divider            | rule                            | 1px `popover-line`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

No new token: `popover`, `popover-line`, `popover-hover` come from #6288 and
`--shadow-admin-lg` exists (#6291 gives it the Dark value). SH1's
`--admin-side-pop-line` and `--shadow-admin-side-pop` are not added.

The shared variants file is introduced by #6371 with the **popup** slot
only (its first user is the phone Menu). The **item** slot is added by
#6375 (first user: the account menu) and the **group label** slot by
#6378 (first user: the Full path menu). No slot ships before a popup uses
it.

| Popup                     | Frame (§7 popup) | Item (§7 item)                                     | Group label                 |
| ------------------------- | ---------------- | -------------------------------------------------- | --------------------------- |
| Account menu (§8.1)       | yes              | yes ("Sign out")                                   | no                          |
| Workspace dropdown (§8.3) | yes              | **no**: its own two-line item, §8.3                | no                          |
| Phone Menu (§10)          | yes, 6px padding | **no**: sidebar-shaped rows on popover tokens, §10 | no (sidebar section labels) |
| Full path menu (§11.3)    | yes              | yes ("Tenants")                                    | yes ("Platform")            |

## 8. Popups

### 8.1 Account menu, expanded sidebar (F6, G1 L3/D3, G5-2)

| Property             | Value                                                                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role and name        | `role="menu"`, `aria-label="Account"`                                                                                                                                                                                                                                                   |
| Placement            | Opens **upward** above the trigger, left edges aligned, **6px gap** (D1, F6 note; G1 L3)                                                                                                                                                                                                |
| Width                | **The trigger's width**, with or without the Theme section: 239px at the 264px sidebar (264 − 1px border − 2×12px foot padding). The boards draw the trigger 239px and the popup a fixed 240px. That 1px is drawing noise: the popup takes the anchor's width, never a fixed 240 (D29). |
| Header (not an item) | Padding 10px 8px, bottom border 1px `popover-line`, 4px below it, column with gap 2px. Name 13px/600 `text`, **wraps anywhere**. Email 12px `muted`, wraps anywhere. Role line 12px `muted`, 4px above it: "{role} · {scope}" ("Owner · Field Notes").                                  |
| Theme section        | #6346's, between the header and Sign out (G1 L3): label "Theme", Light / Dark / System segments that **size to their labels** so all three fit in the 239px popup, helper "System follows your device setting.". Not built by this set.                                                 |
| Items                | **"Sign out"**, last, with a 16px power icon (`muted`) before the label.                                                                                                                                                                                                                |
| Focus on open        | The first item ("Sign out" until #6346 adds the Theme section). The header is never focusable.                                                                                                                                                                                          |
| No name              | §6.5 "No name" (G5-2).                                                                                                                                                                                                                                                                  |

**Boards disagree, resolved.** G5-2 draws the menu 300px wide because three
labelled theme buttons "do not fit" a 240px popup; G1 L3/D3 draw the same
section inside the trigger's width (239px, drawn 240) by sizing the segments to their
labels. Popup geometry comes from SH1 (trigger width), and G1 shows it fits,
so the menu stays the trigger's width.

### 8.2 Account menu, collapsed sidebar (F9, G5-2)

The same popup and content, opening **to the right of the rail**. Its left
edge is 8px right of the rail's edge (20px from the trigger's right edge), and
its bottom aligns with the trigger's bottom (12px above the shell bottom).
On F9 the trigger spans x 12–64, the rail ends at x 76 and the menu starts at
x 84. Base UI positions against the trigger, so the build is `side="right"`,
`align="end"`, **`sideOffset` 20**. Width **a fixed 240px**, not the anchor's
width (the collapsed trigger is 52px). The trigger shows its open state.

### 8.3 Workspace dropdown popup (F7, G1 L4/D4; popup only)

| Property          | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role and name     | `role="menu"`, named by the trigger (`aria-labelledby`)                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Placement         | **4px below the trigger's bottom edge** (`sideOffset` 4), left-aligned (F7), from the exactly-52px trigger of §6.3. Inside the phone Menu: 6px below the pinned trigger (G2-1, part of D2). The boards place the popup at an absolute top (S F7: 142) computed for a 54px trigger. Against the 52px trigger they render, the gap measures 6px (G1 L4/D4: trigger bottom 1882, popup top 1888). The 4px gap from the trigger's real edge is the rule; the board's extra 2px is drawing noise (D29). |
| Width             | The trigger's width: 239px in the sidebar (the boards' fixed 240px is 1px of drawing noise, D29); 262px inside the phone Menu (G2)                                                                                                                                                                                                                                                                                                                                                                 |
| Surface           | §7                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Item              | Column: the name row (name, flex 1, and an optional badge, gap 6px) over the domain (JetBrains Mono 11px `muted`). Padding 6px 8px, radius 4. Name 13px **weight 500** `text`. Highlight `popover-hover`. The name-and-domain block is **centred vertically** in the item (`justify-content:center`, G2 frames 1 and 3), so below `md` it sits in the middle of the 44px row.                                                                                                                      |
| Items drawn       | "Field Notes" / "fieldnotes.valstack.dev" (current); "Kitchen Table Recipes" / "recipes.valstack.dev" (highlighted); "Old Portfolio" + neutral "Archived" pill (no dot) / "portfolio.valstack.dev". The pill is `muted` text on the **popup neutral-pill ground**: `--admin-pill-neutral` #eef0f3 in Light, `--admin-popover-hover` #323845 in Dark (§14; G1 `pillneupop`; theme spec §5.2 and §8)                                                                                                 |
| Current row       | **D20 (open).** F7/X8: no checkmark or marker. G2's "Current row vs highlighted row" specimen proposes four states: rest; highlighted (the `popover-hover` plate, no bar, no ring); current (a 3px `side-accent` bar, 600 name and `aria-current`, no plate); and **current and highlighted: the bar on the plate**, with the 600 name and no ring. The D20 answer settles all four.                                                                                                               |
| Long names (D10)  | **Wrap**: full text in the popup (F13 note).                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Item height (D11) | No minimum from `md` (F7); **at least 44px below `md`** (platform phone-target rule), with the content centred vertically (above). G1 L4 draws 44px at 1376; F7's geometry wins from `md`.                                                                                                                                                                                                                                                                                                         |

### 8.4 Phone Menu popup: see §10.

### 8.5 Breadcrumb Full path menu: see §11.3.

## 9. Top bar

### 9.1 Bar

| Element                  | Property | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bar                      | layout   | Flex, centre-aligned, gap 14px, padding 11px 26px (phone 11px 16px), bottom border 1px `--admin-line` (#e5e7eb / #2b303a), background `bg` at 90% (rgba(246,247,249,.9) / rgba(15,17,21,.9)), sticky with its blur (X4, D6).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Children, in order       | —        | 1. **Slot** (desktop toggle, or the phone Menu button). 2. Breadcrumb (`flex:1`, `min-width:0`). **Nothing after the breadcrumb.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Bar                      | height   | Exactly **59px from `md`** (36px toggle + 2×11px padding + 1px border) from #6374 on. The toggle is the bar's tallest child; today's account pill (22px chip avatar + 4px padding + 1px border, 32px) does not raise it. **67px on a phone** (44px Menu button + 22 + 1), which is the phone bar's height on `main` too.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `--spacing-admin-topbar` | value    | **The bar's real height: 67px below `md`, 59px from `md`** (D34). It sets the document's scroll padding under the sticky bar (`scroll-pt-admin-topbar`) and is the **sticky offset for every page element that sticks under the bar** (`top-admin-topbar`; on `main` the Leads inbox, the Look form and the Voice surface card use it from `lg`). Pages never hard-code a bar height. Pages draw their sticky elements against the real heights: T2 pins the Voice chip bar "under it (59px)", and `gap-voice-phone-chipbar-unpinned` uses "sticky, top 67". At 68 a sticky element would leave a 9px gap under the 59px bar. `gap-look-mid-widths` A/B's "68 px top bar" predates SH1's bar and is superseded. #6374 re-values the token, with a media-query override of the variable so that both utilities follow it. This supersedes resolutions X4's "`--spacing-admin-topbar` stays 68", which assumed the token was only scroll padding. |

### 9.2 Desktop collapse toggle (F4, F5, D, G1 L1/L2)

| State         | Property | Value                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest          | box      | **36×36**, border 1px `--admin-control-line` (#878f9d / #737d8d, X14), radius 4, background `surface` (#ffffff / #171a20), icon `muted`, centred                                                                                                                                                                                                                                             |
| Rest          | icon     | 16px **sidebar panel** (`ICONS.SIDEBAR`, from #6404): rect x3 y4.5 18×15 rx1.6 plus the divider M9 4.5 V19.5. **The same glyph, unrotated, expanded and collapsed** (the toggle's `CHEVRON_RIGHT` icon is rotated 180° while expanded, `isCollapsed: false`, today; it becomes the unrotated `ICONS.SIDEBAR` glyph in both states and the `rotate-180` variant is removed). Stroke per X22b. |
| Hover         | —        | Border `brand-ink` (#4f46e5 / #a5b4fc), icon `text`                                                                                                                                                                                                                                                                                                                                          |
| Focus-visible | —        | Hover colours plus the gapped ring: 2px `bg` gap (#f6f7f9 / #0f1115), 2px `brand-ink` ring (F5, G1 L2)                                                                                                                                                                                                                                                                                       |
| Expanded      | name     | `aria-label="Collapse sidebar"`, `aria-expanded="true"`, `aria-controls="sidebar"`                                                                                                                                                                                                                                                                                                           |
| Collapsed     | name     | `aria-label="Expand sidebar"`, `aria-expanded="false"`, `aria-controls="sidebar"`                                                                                                                                                                                                                                                                                                            |
| Behaviour     | —        | Toggles the collapse state, with the same cookie persistence as today                                                                                                                                                                                                                                                                                                                        |

### 9.3 Tooltip (new shared primitive, #6370)

| Property    | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Opens on    | Hover after Base UI's default delay; keyboard focus **at once** (D19, X1)                                                                                                                                                                                                                                                                                                                                                                            |
| Closes on   | Pointer leave, blur, Escape and activation; the next time it opens it carries the trigger's new name                                                                                                                                                                                                                                                                                                                                                 |
| Placement   | Below the trigger, left-aligned with it, 6px gap (the shared default; callers may pass side, align and offset)                                                                                                                                                                                                                                                                                                                                       |
| Tokens      | `--admin-tooltip` (ground), `--admin-tooltip-text`, `--admin-tooltip-line` (edge). **#6288 adds their Light values** and #6291 their Dark ones (theme spec §5.2). #6370 reads them and waits for #6288; it names no hex and no `text-white`.                                                                                                                                                                                                         |
| Box, Light  | `--admin-tooltip` #12141a, `--admin-tooltip-text` #fff, no visible edge, 12px weight 500, line-height 1.5, padding 4px 8px, radius 4, no wrap, shadow `--shadow-admin-lg` (X1, LB look; SH1 draws the same)                                                                                                                                                                                                                                          |
| Box, Dark   | The same tokens re-valued by #6291: ground #262b35 (the popover), a 1px #4a5260 edge, text #e8eaef, Dark `--shadow-admin-lg` (G1 D2). No TH1 board draws a dark tooltip; G1 is the reference. #6370 ships the Light look, and the Dark look is checked in #6291 and #6380, never in #6370.                                                                                                                                                           |
| Collision   | **Base UI's default collision handling stays on; no caller turns it off.** When the preferred side has no room the tooltip flips to the opposite side, and along its axis it shifts to stay fully inside the viewport. It never wraps to fit. T2 ("At the right edge it shifts left to stay in the window") and RAIL-BADGE ("never wraps; it grows to the right over the page. Base UI flips or shifts it if the viewport ends") rely on this (D33). |
| Copy        | The trigger's current accessible name ("Collapse sidebar" / "Expand sidebar" on the toggle)                                                                                                                                                                                                                                                                                                                                                          |
| Semantics   | Visual only (`aria-hidden`). The trigger's `aria-label` carries the name. A trigger that gets this Tooltip drops its native `title`: the toggle here, the rail rows in #6348 (D26), the Menu button in #6366.                                                                                                                                                                                                                                        |
| Other users | The portable-text editor toolbar moves onto it (11.5px/400, may wrap → 12px/500, one line; its placement stays). Later: rail rows (#6348), the phone Menu button (#6366), Look and Voice. One implementation in apps/platform.                                                                                                                                                                                                                       |

### 9.4 Phone Menu button (F1, F2)

44×44, in the same slot, same border, radius and colours as the toggle. It
uses the 16px hamburger icon (three lines from x4 to x20 at y7, y12, y17).
`aria-label="Menu"`, `aria-haspopup="menu"`, `aria-expanded`. When open, the
border is `brand-ink` and the icon `text`. Its "Menu" tooltip is #6366
(X5). The account pill leaves the phone top bar with #6376.

## 10. Phone Menu popup (F2, G1 P1/P2, G2, G3)

| Zone                  | Property          | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup                 | role and name     | `role="menu"`, `aria-label="Menu"` (X5/O3). No scrim (TH1's scrim is dropped).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Popup                 | position and size | 16px from the left, 5px below the top bar (72px from the viewport top on F2), **288px wide**. The Menu button spans y 11–55 and the bar ends at y 67, so the popup is **17px below the button**: `sideOffset` 17 from the button (or the top bar as anchor with 5). Today's `sideOffset={6}` would overlap the bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Popup                 | height (D18)      | **Shrinks to fit its content, maximum viewport − 84px** (72 above, 12 below). F2's tenant Menu reaches the cap (676px at 390×760); the operator Menu measures 352px (G3-1); at 390×420 the cap gives 336px and only the list scrolls (G3-3). Never a fixed height (G3-2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Popup                 | surface           | §7 with 6px padding. The popup **itself does not scroll.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Top zone (pinned)     | box               | Rendered **only when the switcher renders** (§6.3: tenant users with more than one workspace, D5). Then: `flex:none`, padding 6px 6px 10px, bottom border 1px `popover-line`. With no switcher (an operator, or an owner with one workspace) the top zone is **not rendered at all**: no padding, no divider, and the middle zone starts directly inside the popup's 6px padding (G3 frames 1 and 3). The operator Menu's 352px (G3-1) depends on this.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Top zone              | content           | The Workspace switcher trigger (§6.3), the same component and colours as in the sidebar (`side-field` ground, `side-field-line` border, `side-accent` border when open; G2 frames 1 and 3). The zones **replace** today's `switcherSlot()` (px-3 pt-3 pb-1) and `section()` (px-3 pt-[14px]) wrappers, never sit around them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Middle zone (scrolls) | box               | `flex:1`, `min-height:0`, **scrolls vertically**, padding 0 2px 8px                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Middle zone           | sections          | Padding 10px 4px 0; labels as the sidebar's, in `muted`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Middle zone           | rows              | The sidebar row shape (§6.4), **not** the §7 item: padding 8px 10px, gap 10px, 13px **weight 400**, `text`, 16px icon in `muted`, radius 4, each **min-height 44px**. Badges shown: "{count} new" as in the sidebar; the neutral "Coming soon" pills (with dot) on the popup neutral-pill ground (§14: #eef0f3 / #323845). "Coming soon" rows inert at **full opacity** (S F2, G1 P1/P2). G2 frames 1–4 draw the Subscribers, Comments and Team rows at `opacity:.6`. G2 was drawn to settle the inner popups, not the rows, so S and G1 win (D31). Each row keeps `title` = its label, as S F2 draws (D26). (G1 P1 draws 14px/500; SH1 F2's 13px/400 wins as geometry.)                                                                                                                                                                                                                                                                                         |
| Middle zone           | row states        | Hover and keyboard highlight: `popover-hover` plate, no bar, **no focus ring** (the sidebar row's side-ground ring does not show on the popup), weight unchanged (D12). **Current** (Overview on F2): `popover-hover` plate **plus a 3px `brand-ink` bar**, label **weight 600**, `text` icon, `aria-current="page"` (G1 P1/P2, G2 frames 1–4). The bar sits **flush with the row's left edge** (`left:0`), 3px wide, inset 10px from the row's top and bottom, with **radius 0 2px 2px 0** (square on the left edge, 2px on the right), as G1 (`.pmenu .row.on::before`) and G2 (`.bar`) both draw. The bar tells current from highlighted (G2 specimen). **Icon colour:** G1 P1/P2 draw the current row's icon in `text` (#12141a / #e8eaef); G2 frames 1–4 draw it in the accent (#4f46e5 / #a5b4fc). Colour is TH1's, and G1 is the builder's colour reference, so `text` wins (D30).                                                                        |
| Foot zone (pinned)    | box               | `flex:none`, padding 8px 2px 2px, top border 1px `popover-line`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Foot zone             | content           | The full account trigger (§6.5 expanded form and geometry, 270px wide here): "AM" / "Alex Morgan" / "alex.morgan@example.com" / up chevron. Operators get their own account ("SR" / "Sam Rivera", G3). **On the popup its colours are the pinned switcher's (G2 frames 2 and 4)**, not §6.5's sidebar ones: ground `side-field` (#ffffff / #171a20), 1px `side-field-line` border (#7c8493 / #737d8d; 3.76:1 / 4.19:1 against the field), name `text` (#12141a / #e8eaef), email and chevron `muted` (#5b6472 / #a3abb8; 5.98:1 / 7.53:1 on the field). **Open:** border `side-accent` (#4f46e5 / #a5b4fc), ground unchanged. **Hover:** not drawn; it is part of D2 (proposal: ground `popover-hover` #eef1f6 / #323845, border and text unchanged; email 5.28:1 / 5.08:1). Focus: the gapped ring with a `popover` gap. G1 P1/P2's transparent ground with a `control-line` border is superseded by G2, which draws the trigger in its open and closed states. |
| Roles and submenus    | —                 | **D2 (open).** G2 draws the proposal: the switcher opens its dropdown 6px **below** the pinned trigger at the trigger's width, over the nav list; the account opens its menu 6px **above** the foot trigger at its width (header, Theme from #6347, Sign out); the Menu stays open underneath; only one inner popup at a time; **Down arrow, Enter or Space on a pinned trigger opens its popup with the first row highlighted**; Escape closes only the inner popup and returns focus to its trigger, a second Escape closes the Menu and returns focus to the Menu button; Tab or a press outside closes everything; choosing a workspace closes both and navigates. While its popup is open each pinned trigger shows the `side-accent` border (G2 frames 1–4).                                                                                                                                                                                               |
| Trigger               | open state        | The Menu button shows `brand-ink` border and `text` icon while open (§9.4).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

The top bar on a phone holds only the Menu button and the breadcrumb.

## 11. Breadcrumb

### 11.1 Common

| Element                       | Property | Value                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmark                      | —        | `<nav aria-label="Breadcrumb">`                                                                                                                                                                                                                                                                                                                                                                 |
| List                          | layout   | Flex, **no wrap**, centre-aligned, gap 7px, 14px `muted`, `white-space:nowrap`, `min-width:0`                                                                                                                                                                                                                                                                                                   |
| Item                          | —        | Flex, centre-aligned, gap 7px, `min-width:0`                                                                                                                                                                                                                                                                                                                                                    |
| Separator                     | —        | "›", 12.5px `faint`, never shrinks, `aria-hidden`, inside the following item before its content (X9: TH1's chevron separators are dropped)                                                                                                                                                                                                                                                      |
| Link                          | —        | Block, radius 4, padding 2px 4px, `muted`, ellipsis. Hover: background `line-2`, text `text`. Keyboard focus: the gapped ring on the bar ground (G4-3). On a phone it keeps a **44px tap height**, including on the shrinkable crumb (today's `inline-flex min-h-11`).                                                                                                                          |
| Current, or a page-less label | —        | Weight 600 `text`. Only the leaf carries `aria-current="page"`. "Platform" uses the same style **without** `aria-current`, and is never focusable.                                                                                                                                                                                                                                              |
| Current crumb                 | cap      | **max-width 280px, ellipsis** (`overflow:hidden`, `text-overflow:ellipsis`). Every board draws it (`.bcur`: S F1–F5, F11, F12, F3's "Danger zone", G4 frames 4–7), and `main`'s breadcrumb `current` slot already carries it (`max-w-[280px] truncate`). Adopted (D35). A capped current crumb carries its full text as `title`. No current label in the admin today reaches 280px at 14px/600. |
| Fixed item                    | —        | Never shrinks (`flex:none`). The leaf never truncates below its own text (D3), up to the 280px cap above…                                                                                                                                                                                                                                                                                       |
| Shrinkable item               | —        | …except that **the tenant-name crumb is the only shrinkable crumb, even when it is the leaf** (X9; G4-2): `flex:0 1 auto`, **min-width 48px**, ellipsis, and a `title` with its full name (TH1 §20.25).                                                                                                                                                                                         |

**Dark** (tokens, §14; G1 D1 draws the Dark crumb "Dashboard" #e8eaef 600): list `muted` #a3abb8; separators `faint` #8590a0; link hover ground `line-2` #232730 with `text` #e8eaef; current and "Platform" 600 #e8eaef; focus ring 2px `brand-ink` #a5b4fc with a 2px `bg` #0f1115 gap. No board draws the Dark link hover or focus. These are the tokens' values, and the Dark breadcrumb frame owed below (§11.3) draws them before #6380 is filed.

### 11.2 Trails

| Context                               | Trail                                                                                                                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner, any `/dashboard` page          | "Dashboard" alone on Overview (D, F1, F2, F4–F10, G1). Other pages as today.                                                                                                                    |
| Operator Tenants (F11, G3)            | "Platform" (label) › "Tenants" (current)                                                                                                                                                        |
| Operator `/tenants/new`               | "Platform" › "Tenants" (link) › "Add tenant" (current). This must survive Add tenant leaving the sidebar.                                                                                       |
| Operator tenant overview (G4-1, G4-2) | "Platform" (label) › "Tenants" (link) › "{tenant name}" (current, **shrinkable**). On a phone it renders in full (D4); a long name truncates to its 48px floor with its full name in `title`.   |
| Operator tenant page, desktop (F12)   | "Platform" (label, fixed) › "Tenants" (link, fixed) › "{tenant name}" (link, **shrinkable**) › "Danger zone" (current, fixed). One row; only the tenant name truncates. The toggle stays first. |

### 11.3 Phone collapse (F3, G4)

Below `md`, a trail collapses **only when at least one crumb it would hide
is a link** (D4, drawn in G4-1). A three-crumb trail whose hidden crumb is
only the "Platform" label renders in full, like one- and two-crumb trails. A
collapsed trail renders as:

1. A **"…" button** (fixed item): min-width 44px, height 44px, padding 0 6px,
   border 1px `--admin-control-line`, radius 4, background `surface`, glyph
   `text` 14px/600, centred. `aria-label="Show full path"`,
   `aria-haspopup="menu"`, `aria-expanded`. **No tooltip** on hover (G4-5).
   States (D14, G4-4…8):

   | State            | Border         | Ground · glyph     | Ring                            | `aria-expanded` |
   | ---------------- | -------------- | ------------------ | ------------------------------- | --------------- |
   | Rest             | `control-line` | `surface` · `text` | none                            | false           |
   | Hover            | `brand-ink`    | `surface` · `text` | none                            | false           |
   | Focus-visible    | `control-line` | `surface` · `text` | 2px `bg` gap, 2px `brand-ink`   | false           |
   | Open             | `brand-ink`    | `surface` · `text` | none while the menu holds focus | true            |
   | Closed by Escape | `control-line` | `surface` · `text` | ring; focus is back on "…"      | false           |

   Unlike the toggle, keyboard focus keeps the rest border (G4-6); a pointer
   press shows no ring.

   **Dark** (tokens, §14): rest border `control-line` #737d8d on `surface`
   #171a20, glyph #e8eaef; hover and open border `brand-ink` #a5b4fc;
   focus-visible ring #a5b4fc with a 2px `bg` #0f1115 gap. G4 frames 1–8 are
   Light only. A Dark G4 frame (the "…" at rest, hover, focus and open, and the
   Full path menu) is **owed before #6380 is filed** (undrawn frame
   `gap-shell-breadcrumb-phone-states` Dark; the 30 Oct rule "frames the
   boards never drew get drawn before filing").

2. The second-to-last crumb (shrinkable link): "Kitchen Table Recipes and
   Seasonal Preserves", truncated.
3. The leaf (fixed, current): "Danger zone".

The "…" opens the **Full path menu**:

| Property      | Value                                                                                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role and name | `role="menu"`, `aria-label="Full path"`                                                                                                                                                                                                      |
| Placement     | **7px below the "…" button, left edges aligned** (D13; G4-7 draws the menu at x 74, top 62 against the button at x 74, y 11–55). F3's 2px left shift is a drawing offset, not a rule.                                                        |
| Width         | 220px                                                                                                                                                                                                                                        |
| Surface       | §7                                                                                                                                                                                                                                           |
| Content       | Every hidden crumb, in order. A crumb **without a page** ("Platform") is a **group label**; its following links sit in that group (`role="group"`, `aria-labelledby` the label). A crumb with a page is a link item ("Tenants", `menuitem`). |
| Focus on open | The first link item ("Tenants"), drawn highlighted (`popover-hover`, no ring). The group label is never focusable. Escape closes and returns focus to "…".                                                                                   |
| Dark          | The §7 frame: `popover` #262b35, 1px `popover-line` #4a5260, highlight `popover-hover` #323845; "Platform" `muted` #a3abb8; "Tenants" `text` #e8eaef. Owed in the Dark G4 frame (above).                                                     |

From `md` up the full trail renders (§11.2), with no "…".

## 12. Focus order and accessibility

- **Tab order on desktop:** Workspace switcher → nav rows, top to bottom →
  account trigger → top-bar toggle → breadcrumb links → page content. This
  follows from the DOM order (sidebar before main). No `tabindex` is added.
- **Tab order on phone:** Menu button → breadcrumb ("…" if collapsed, then
  links) → page content (G4-3: "Platform" and the leaf take no focus).
- **Focus ring:** one gapped ring (X13; #6337 owns it): a 2px gap in the
  ground's colour, then a 2px ring in `brand-ink` (#4f46e5 / #a5b4fc); on the
  sidebar the ring is `side-accent`. The shell uses it; it does not
  redefine it.
- **Menus:** Base UI `Menu` semantics (`role="menu"`, `menuitem`) with arrow
  keys, Escape to close and return focus to the trigger, and typeahead.
  Group labels are not focusable. Keyboard highlight is the `popover-hover`
  plate with no ring, in every shell popup: the account menu, the Workspace
  dropdown, the Full path menu and the phone Menu's rows (G1 L4/D4, G2
  frames 1–4 and its "Current row vs highlighted row" specimen, G4-7). The
  one exception is the Theme section's `menuitemradio` segments, inside the
  account menu on the desktop and inside the phone Menu's account popup.
  Those keep the plate plus an inset 2px `brand-ink` ring (theme spec §9.3,
  G2 frames 2 and 4, D32).
- **Collapsed rail:** every row keeps its label as its accessible name. The
  account trigger's `aria-label` is "Account: {name}, {email}" or
  "Account: {email}".
- **Landmarks:** `<aside aria-label="Sidebar">`, one `<nav>` per section
  named by its label, `<nav aria-label="Breadcrumb">`, `<main>` (X11).
- **Touch targets on phone:** the Menu button, the "…" button, menu items,
  Menu rows, Workspace dropdown items (D11), breadcrumb links and page-head
  buttons are all ≥44px.
- **Contrast** (G1, G2, G4, G5): every text pair ≥4.5:1, every non-text
  pair ≥3:1 in Light and Dark (e.g. muted email on the hovered trigger 5.98 /
  6.71; account trigger border on `side` 3.30 / 4.71; muted email on the
  popup's foot trigger 5.98 / 7.53; group label 6.4; current bar on popover
  6.29 / 7.12; side-muted #8d96a6 on the Dark popover would be only 4.76,
  which is why the popup uses `muted`).

## 13. Copy

Platform UI copy is never a Voice candidate. Every string here is **fixed**.
Each new key lands in all five locales (en, de, es, fr, nl).

| String (en)                                                   | Key                                                                                            | Status               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------- |
| Valstack                                                      | `sidebar.brandName`                                                                            | exists               |
| admin                                                         | `sidebar.brandTagline`                                                                         | exists               |
| Collapse sidebar                                              | `sidebar.collapseToggle`                                                                       | exists               |
| Expand sidebar                                                | `sidebar.expandToggle`                                                                         | exists               |
| Sidebar                                                       | `sidebar.ariaLabel` (the `<aside>` has no name on `main`; X11 assumed it had, D27)             | **new, pending D27** |
| Menu                                                          | `topbarNavMenu.triggerLabel` (also the popup's name)                                           | exists               |
| Breadcrumb                                                    | `topbar.breadcrumbAriaLabel`                                                                   | exists               |
| Show full path                                                | `topbar.showFullPath`                                                                          | **new**              |
| Full path                                                     | `topbar.fullPathMenuLabel`                                                                     | **new**              |
| Account                                                       | `account.menuLabel`                                                                            | **new**              |
| Account: {name}, {email}                                      | `account.triggerCollapsedLabel`                                                                | **new**              |
| Account: {email}                                              | `account.triggerCollapsedLabelNoName`                                                          | **new**              |
| {role} · {scope}                                              | `account.roleLine` (moved from `topbar.roleChip`, which nothing else reads once the pill goes) | **moved**            |
| Sign out                                                      | `account.signOut`                                                                              | exists               |
| Archived                                                      | `tenantSwitcher.archived`                                                                      | exists               |
| Add tenant (the `/tenants/new` breadcrumb leaf)               | `navSections.addTenant` (no longer read by the sidebar)                                        | exists               |
| Section and row labels, "Coming soon", "{count} new", "Ready" | `navSections.*`                                                                                | exist                |

The Theme section's strings on G1, G2 and G5 ("Theme", "Light", "Dark",
"System", "System follows your device setting.") are #6345/#6346's, not
this set's. G1's Studio line copy is the dashboard set's.

## 14. Tokens

Every value is an existing `--admin-*` token after #6288 (Light) and #6291
(Dark). This set adds no token; #6374 re-values one (`--spacing-admin-topbar`, §9.1).

| Role                                                            | Token                                                                                         | Light                            | Dark                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------- |
| Sidebar ground                                                  | `--admin-side`                                                                                | #eef0f3                          | #0a0c0f                       |
| Sidebar rules, row hover                                        | `--admin-side-line`                                                                           | #d9dde4                          | #1c1f26 ¹                     |
| Nav text                                                        | `--admin-side-text`                                                                           | #2a303b                          | #c9cfda                       |
| Section label, nav icon                                         | `--admin-side-muted`                                                                          | #5b6472                          | #8d96a6                       |
| Active plate, account hover/open ground                         | `--admin-side-raised`                                                                         | #ffffff                          | #20242e                       |
| Active bar, focus on sidebar, open border                       | `--admin-side-accent`                                                                         | #4f46e5                          | #a5b4fc                       |
| Wordmark, sidebar current row text                              | `--admin-text-strong`                                                                         | #12141a                          | #ffffff                       |
| Workspace field / border; the phone Menu's foot account trigger | `--admin-side-field` / `--admin-side-field-line`                                              | #ffffff / #7c8493                | #171a20 / #737d8d             |
| Account trigger border                                          | `--admin-control-line-tint`                                                                   | #7c8493                          | #737d8d                       |
| Toggle, Menu button, "…" border                                 | `--admin-control-line`                                                                        | #878f9d                          | #737d8d                       |
| Popup ground (and Dark tooltip)                                 | `--admin-popover`                                                                             | #ffffff                          | #262b35                       |
| Popup border, dividers                                          | `--admin-popover-line`                                                                        | #e5e7eb                          | #4a5260                       |
| Popup highlight, phone current row                              | `--admin-popover-hover`                                                                       | #eef1f6                          | #323845                       |
| Focus ring, hover border, Menu current bar                      | `--admin-brand-ink`                                                                           | #4f46e5                          | #a5b4fc                       |
| Avatar ground                                                   | `--admin-brand`                                                                               | #4f46e5                          | #5850ec                       |
| Top-bar rule                                                    | `--admin-line`                                                                                | #e5e7eb                          | #2b303a                       |
| Page ground (top bar at 90%)                                    | `--admin-bg`                                                                                  | #f6f7f9                          | #0f1115                       |
| Control ground                                                  | `--admin-surface`                                                                             | #ffffff                          | #171a20                       |
| Text / muted / faint (incl. the account name / email / chevron) | `--admin-text` / `-muted` / `-faint`                                                          | #12141a / #5b6472 / #7a8394      | #e8eaef / #a3abb8 / #8590a0   |
| Link hover ground                                               | `--admin-line-2`                                                                              | #eef0f3                          | #232730                       |
| Neutral pill on the page and sidebar                            | `--admin-pill-neutral`                                                                        | #eef0f3                          | #262a33                       |
| Neutral pill inside a shell popup ²                             | `--admin-pill-neutral` (Light) / `--admin-popover-hover` (Dark)                               | #eef0f3                          | #323845                       |
| Popup and tooltip shadow                                        | `--shadow-admin-lg`                                                                           | `0 12px 40px rgba(16,24,40,.14)` | `0 12px 40px rgba(0,0,0,.55)` |
| Tooltip ground / text / edge                                    | `--admin-tooltip` / `--admin-tooltip-text` / `--admin-tooltip-line` (#6288 Light, #6291 Dark) | #12141a / #ffffff / none         | #262b35 / #e8eaef / #4a5260   |
| Bar height (scroll padding, page sticky offset)                 | `--spacing-admin-topbar` (re-valued by #6374, §9.1)                                           | 67px below `md`, 59px from `md`  | the same                      |
| Radii 4 / 6 / full                                              | `--radius-admin-control`, `--radius-admin`, `rounded-full`                                    | —                                | —                             |

¹ No TH1 board draws a Dark row hover; G1 uses SH1's own row hover (#1c1f26).
The Dark tooltip ground likewise comes from G1 alone (§9.3).

² The "Archived" pill in the Workspace dropdown and the "Coming soon" pills in
the phone Menu sit on a popup, where `pill-neutral`'s Dark #262a33 is darker
than the #262b35 ground. G1 (`pillneupop`), G2 (frames 3 and 4) and theme spec
§5.2 draw #eef0f3 in Light and #323845 in Dark. No token holds that pair, and
this set adds none: the pill keeps reading `--admin-pill-neutral`, and
#6291's Dark rules re-point `--admin-pill-neutral` to `--admin-popover-hover`
inside the shared popup frame (§7), as #6291 applies the Dark tooltip. The
shell names only those two tokens.

## 15. Code mapping

Paths are relative to `apps/platform/src`. Each row names the ticket that
changes it (§18).

| File                                                                                                                                                         | Change                                                                                                                                                                                                                                                                                                                                                        | Ticket              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `components/shared/portable-text-editor/.../toggle-button/*` → `components/shared/tooltip/`                                                                  | The inline Base UI Tooltip moves to one shared Tooltip (§9.3 Light look, on #6288's `--admin-tooltip*` tokens); the toggle button uses it                                                                                                                                                                                                                     | #6370               |
| new `components/shared/menu-surface/` (shell popup variants)                                                                                                 | §7 popup slot (#6371), item slot (#6375), group-label slot (#6378), each with its first user, all on popover tokens                                                                                                                                                                                                                                           | #6371, #6375, #6378 |
| `components/features/layout/topbar/components/topbar-nav-menu/*`                                                                                             | Popup frame adopts §7 (#6371). Zones replacing `switcherSlot()`/`section()`, 17px offset, fit-to-content height, 44px rows and states (#6376)                                                                                                                                                                                                                 | #6371, #6376        |
| `components/features/layout/admin-shell/components/shell-frame/shell-frame-variants.ts`                                                                      | Drop `mx-auto` from `content` and `noticeSlot`. No gap added.                                                                                                                                                                                                                                                                                                 | #6372               |
| `utils/nav-sections/nav-sections.ts`, `components/features/layout/operator-breadcrumb/*`, `components/features/layout/sidebar/components/sidebar-nav-link/*` | Remove the Add tenant item, keep the `/tenants/new` leaf via an explicit label, current row on `/tenants/new` per D17                                                                                                                                                                                                                                         | #6373               |
| `components/features/layout/sidebar/components/sidebar-collapse-toggle/*` → `components/features/layout/topbar/components/`                                  | Move and restyle (§9.2), `aria-controls`, Tooltip, `ICONS.SIDEBAR`                                                                                                                                                                                                                                                                                            | #6374               |
| `components/features/layout/sidebar/sidebar.tsx`, `sidebar-variants.ts`                                                                                      | `id`, `aria-label`, remove the toggle slot and the collapsed brand `flex-col gap-2`                                                                                                                                                                                                                                                                           | #6374               |
| `components/features/layout/sidebar/*`                                                                                                                       | Nav-area wrapper (scrolls; the switcher slot stays outside it) and foot slot                                                                                                                                                                                                                                                                                  | #6375               |
| `components/features/layout/topbar/components/account-menu/*` → `components/features/layout/account-menu/`                                                   | **Moved, not copied** (one implementation): rebuilt as the account trigger and menu (§6.5, §8.1, §8.2), keeping `signOutAction`. From `md` the sidebar foot renders it; below `md` the top bar keeps today's pill trigger, now a `pill` appearance of the same component that opens the same menu, until #6376 deletes that appearance and the top-bar render | #6375, #6376        |
| `styles/admin-theme.css` (`--spacing-admin-topbar` only)                                                                                                     | 67px below `md`, 59px from `md` (§9.1, D34)                                                                                                                                                                                                                                                                                                                   | #6374               |
| `components/features/layout/signed-in-account/*` (`account.signedInAs`)                                                                                      | **Unchanged** by this set (the shell-less pages; #6288 recolours it)                                                                                                                                                                                                                                                                                          | —                   |
| `components/shared/avatar/*`                                                                                                                                 | New `account` variant (30px circle, `brand` ground) and a single initial for an email-only account                                                                                                                                                                                                                                                            | #6375               |
| `assets/icons/chevron-up.svg` (new asset), `components/shared/icon/icon-registry.ts`                                                                         | Register the existing `ICONS.CHEVRON_UP` in the platform registry with a new `chevron-up.svg` (apps/platform has only `chevron-down.svg` and `chevron-right.svg` on `main`), and register `ICONS.SIDEBAR`. Both are #6405's (voice set), so #6374 and #6375 depend on it. `power.svg` is registered; #6375 reuses it.                                         | #6405               |
| `server/layout/load-admin-shell-chrome.ts` and every layout passing `roleChip`                                                                               | Pass `userName` and `userEmail` separately. `roleChip` becomes account props (name, email, role line).                                                                                                                                                                                                                                                        | #6375               |
| `components/features/layout/topbar/topbar.tsx`                                                                                                               | Remove `AccountMenu` (desktop in #6375, phone in #6376)                                                                                                                                                                                                                                                                                                       | #6375, #6376        |
| `components/shared/breadcrumbs/*`, `components/features/layout/tenant-breadcrumb/*`                                                                          | No wrap; `isShrinkable` + full-name `title` on the tenant crumb, leaf included                                                                                                                                                                                                                                                                                | #6377               |
| `components/shared/breadcrumbs/*`                                                                                                                            | Phone "…" collapse and the Full path menu (a client leaf)                                                                                                                                                                                                                                                                                                     | #6378               |
| `components/features/layout/tenant-switcher/*`, the `switcher` Avatar variant                                                                                | Trigger geometry and structure (§6.3: 52px, 8px 8px 8px 10px, 11px/700 initials, down chevron). Popup adopts §7, the trigger's width, 4px offset, wrapping items with no ring, 44px below `md`, the D20 answer                                                                                                                                                | #6379               |
| `docs/features/platform-shell.md`                                                                                                                            | Each ticket updates the part it changes                                                                                                                                                                                                                                                                                                                       | all                 |

Not in this set: `ICONS.SIDEBAR` and its svgs (#6404, #6405), the platform `chevron-up.svg` (#6405), `styles/admin-theme.css`
apart from #6374's `--spacing-admin-topbar` value (#6288 and the token chain, the `--admin-tooltip*` tokens included), the Theme section (#6345/#6346/#6347), rail
tooltips (#6348), the active plate and bar (#6341), the Menu
button tooltip (#6366).

## 16. Behaviour rules

1. The toggle and the Menu button share one slot. Desktop shows only the
   toggle, and phone shows only the Menu button. They never appear together.
2. Collapsing hides the switcher slot, section labels, row labels and badges.
   It dims inert rows to 50%, reduces the brand to the mark and the account to
   the avatar, and turns the account menu to open to the right.
3. Content always starts at the sidebar's right edge, expanded or collapsed.
4. The page head is the page's (#6357); the shell adds no band.
5. The breadcrumb never wraps. Only the tenant-name crumb shrinks, leaf or
   not, with its full name in `title`; every current crumb is also capped at
   280px with an ellipsis (§11.1, D35), a cap no current label reaches today. On a phone, when at least one crumb
   before the last two is a link (D4), everything before the last two moves
   into the "…" menu; otherwise the full trail renders.
6. Popups never show square corners and never attach flush to their trigger.
   Every shell popup sits on the popover tokens in both themes.
7. A popup row's highlight (hover or keyboard) is the `popover-hover` plate,
   with no ring; only the Theme section's segments add an inset ring (D32).
   In the phone Menu the current page adds a 3px `brand-ink` bar, which stays
   on the plate when that row is also highlighted. In the Workspace dropdown
   the current workspace's marker is D20, which covers the current row when
   it is also highlighted (§8.3).
8. The phone Menu is as tall as its content, never taller than viewport −
   84px; only its middle zone scrolls.
9. Every colour is a token; no shell component names a hex.
10. A page element that sticks under the top bar uses `top-admin-topbar`,
    which equals the bar's height at every width (§9.1).

## 17. Decisions

A ticket blocked on an open decision is not dispatched until the user's
answer is written into its body (CLAUDE.md, "Mid-task decisions land in the
ticket").

| #     | Question                                                                                                                                                                                                                                                                    | Status and answer                                                                                                                                                                                                                                                                                                                                                                                                                                          | Ticket                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| D1    | Account popup gap above the trigger                                                                                                                                                                                                                                         | Resolved by board: **6px** (F6 note; G1 L3).                                                                                                                                                                                                                                                                                                                                                                                                               | #6375                                                  |
| D2    | How the Workspace dropdown and the account menu open from inside the phone Menu; roles and keys; the pinned triggers' hover                                                                                                                                                 | Decided 31 Oct: G2's proposal stands. The dropdown opens 6px below the pinned top trigger and the account menu 6px above the pinned foot trigger, each at its trigger's width; one inner popup at a time; Escape closes the inner popup, then the Menu; the pinned triggers' hover is the `popover-hover` ground with border and text unchanged (§10 "Roles and submenus", "Foot zone").                                                                   | #6376                                                  |
| D3    | Does the leaf crumb truncate?                                                                                                                                                                                                                                               | Resolved by board: it never shrinks, **except** the tenant-name crumb when it is the leaf (F3/F12 notes; X9; G4-2). Every current crumb also keeps the 280px cap (D35).                                                                                                                                                                                                                                                                                    | #6377                                                  |
| D4    | Phone collapse with three crumbs                                                                                                                                                                                                                                            | Resolved by board (G4-1): collapse only when a hidden crumb is a link.                                                                                                                                                                                                                                                                                                                                                                                     | #6378                                                  |
| D5    | Switcher for an owner with one workspace                                                                                                                                                                                                                                    | Decided 31 Oct: today's rule stays (the switcher shows only for more than one workspace). Not blocking.                                                                                                                                                                                                                                                                                                                                                    | —                                                      |
| D6    | Sticky sidebar and translucent sticky top bar                                                                                                                                                                                                                               | Resolved by board: keep (X4).                                                                                                                                                                                                                                                                                                                                                                                                                              | —                                                      |
| D7    | Shell popups in the light theme                                                                                                                                                                                                                                             | Resolved by rule: TH1 popover tokens (X7).                                                                                                                                                                                                                                                                                                                                                                                                                 | #6371                                                  |
| D8    | Switcher trigger: #6288's label and up-down chevron vs SH1 F7                                                                                                                                                                                                               | Resolved by rule: SH1 F7 structure, TH1 colours, no label, one chevron (X8). #6288's.                                                                                                                                                                                                                                                                                                                                                                      | #6288                                                  |
| D9    | Email-only avatar                                                                                                                                                                                                                                                           | Resolved by board: "S" for the email-only account only; `getInitials` unchanged (F15).                                                                                                                                                                                                                                                                                                                                                                     | #6375                                                  |
| D10   | Workspace dropdown long names                                                                                                                                                                                                                                               | Resolved by board: wrap (F13).                                                                                                                                                                                                                                                                                                                                                                                                                             | #6379                                                  |
| D11   | Workspace dropdown items below `md`                                                                                                                                                                                                                                         | Resolved by rule: ≥44px below `md`, none from `md`.                                                                                                                                                                                                                                                                                                                                                                                                        | #6379                                                  |
| D12   | Phone Menu keyboard highlight                                                                                                                                                                                                                                               | Resolved by board: `popover-hover` plate; current adds the 3px bar (G1 P1, G2).                                                                                                                                                                                                                                                                                                                                                                            | #6376                                                  |
| D13   | Full path menu offset                                                                                                                                                                                                                                                       | Resolved by board: 7px below, left edges aligned (G4-7).                                                                                                                                                                                                                                                                                                                                                                                                   | #6378                                                  |
| D14   | "…" hover, focus and open                                                                                                                                                                                                                                                   | Resolved by board: §11.3 state table (G4-4…8).                                                                                                                                                                                                                                                                                                                                                                                                             | #6378                                                  |
| D15   | Account trigger hover                                                                                                                                                                                                                                                       | Resolved by board: `side-raised` ground, border and text unchanged (G5-1).                                                                                                                                                                                                                                                                                                                                                                                 | #6375                                                  |
| D16   | Email-only menu header and collapsed label                                                                                                                                                                                                                                  | Resolved by board: §6.5 "No name" rows (G5-2, G5-3).                                                                                                                                                                                                                                                                                                                                                                                                       | #6375                                                  |
| D17   | Current sidebar row on `/tenants/new` once Add tenant leaves                                                                                                                                                                                                                | Decided 31 Oct: Tenants is the current row on `/tenants/new`, through an explicit match for that route (not a general prefix match).                                                                                                                                                                                                                                                                                                                       | #6373                                                  |
| D18   | Phone Menu height with short content                                                                                                                                                                                                                                        | Resolved by board: fit content, maximum viewport − 84px (G3-1, G3-3).                                                                                                                                                                                                                                                                                                                                                                                      | #6376                                                  |
| D19   | Tooltip timing                                                                                                                                                                                                                                                              | Resolved by rule: Base UI hover delay, at once on focus, closes on activation (X1).                                                                                                                                                                                                                                                                                                                                                                        | #6370, #6374                                           |
| D20   | Current workspace in the Workspace dropdown: no marker (F7, X8) or G2's 3px `side-accent` bar + 600 name + `aria-current`, no plate?                                                                                                                                        | Decided 31 Oct: no visual marker, as SH1 F7 and X8 draw it; the item keeps `aria-current` for screen readers. G2's bar proposal is not built.                                                                                                                                                                                                                                                                                                              | #6379                                                  |
| D21   | Account trigger border and text colours (G1 vs G5)                                                                                                                                                                                                                          | Resolved by rule: G1 (§6.5): rest `control-line-tint`, open `side-accent` on `side-raised`, name `text` (also for the email on the name line of an email-only account), email and chevron `muted`. Theme spec §7.4 still differs on the border (X-7.4).                                                                                                                                                                                                    | #6375                                                  |
| D22   | Account menu width with the Theme section (G1 240 vs G5 300)                                                                                                                                                                                                                | Resolved by rule: the trigger's width (§8.1).                                                                                                                                                                                                                                                                                                                                                                                                              | #6375, #6346                                           |
| X22b  | Icon glyph stroke (SH1 1.6 vs TH1 2), incl. the new sidebar-panel glyph                                                                                                                                                                                                     | Decided 31 Oct: the registered outlines stay and every stroked admin icon is drawn at stroke 2 (#6352); #6404 adds `ICONS.SIDEBAR` at stroke 2. No LX redraw.                                                                                                                                                                                                                                                                                              | #6404                                                  |
| X-7.4 | Theme spec §7.4 gives the account trigger a `side-line` rest border (1.19:1, fails 3:1) and a `control-line-tint` open border                                                                                                                                               | **Blocker, not a choice.** The theme spec's §7.4 Rest and Open rows are corrected to §6.5 (rest `control-line-tint`, open `side-accent` on `side-raised`) before #6375 is dispatched.                                                                                                                                                                                                                                                                      | #6375                                                  |
| #6404 | Which ticket supplies the shell's glyphs                                                                                                                                                                                                                                    | **Resolved (drafts exist in the voice set).** #6404 adds the `ICONS.SIDEBAR` key and its `@blog/ui` glyph; #6405 (← #6404, #6361) registers `SIDEBAR` on the platform and registers the existing `ICONS.CHEVRON_UP` with a new `chevron-up.svg`. #6374 and #6375 depend on #6405. Strokes wait on X22b.                                                                                                                                                    | #6374, #6375                                           |
| D23   | #6287's type: X3 (the recorded resolution) keeps it as SH1's implementation ticket, adding "the collapse tooltip adopts #6370" and "on a phone the account lives at the Menu foot (#6376)"; or #6287 becomes the parent epic                                                | Decided 31 Oct: #6287 becomes the shell epic (§18.1). It depends only on #6314, and no NEW-SH1 ticket depends on it. Every criterion in its live body belongs to #6372, #6373, #6374, #6375 or #6377, so its body is replaced by the epic body. The edges other sets held on #6287 (#6288, #6289, #6368, #6423) are dropped or repointed at the NEW-SH1 ticket that owns the shared file (for example `sidebar-variants` → #6374; `admin-shell/` → #6372). | #6287, #6288, #6289, #6368, #6423                      |
| D24   | Covering check for the styling-only tickets: apps/platform has no Storybook, so #6371, #6372 and #6379 name the manual test #6380 in place of a story                                                                                                                       | Decided 31 Oct: #6380's per-frame steps substitute for stories in #6371, #6372 and #6379 (apps/platform has no Storybook).                                                                                                                                                                                                                                                                                                                                 | #6371, #6372, #6379                                    |
| D25   | Collapsed-rail row size: RAIL-BADGE (`gap-dash-studio-rail-badge` "Row size" note, row-anatomy panel, C1 at 1376×760) draws every rail row 44×44 with 17px icons and asks the whole rail to rise to 44; the owner-dashboard spec (§8.4, Out of scope) hands it to this set  | Resolved by rule (shell geometry is SH1's): **SH1's rail row stands**: padding 8px 0, the 16px icon, **32px tall** (8 + 16 + 8; the hidden label and badge take no height; measured on G1 L2 and S F4). Expanded rows are ≈35.5px. RAIL-BADGE's 44×44 / 17px rows are not built; the proposal is listed under Out of scope. The rail's hover ground is D28.                                                                                                | — (no ticket changes rail rows)                        |
| D26   | Native `title` on nav rows: D, S F2/F4 and G1 L1–L4/P1 draw a `title` on every row (S F4: rail rows keep the label "as a title tooltip"); RAIL-BADGE's semantics panel says "No native title"; once #6348 adds the shared Tooltip a leftover `title` shows a second tooltip | Resolved by board and rule: **expanded sidebar rows and phone Menu rows keep `title` = the label** (SH1 draws it; long labels ellipse). **Collapsed rail rows drop it** in the change that gives them the shared Tooltip (#6348), so one tooltip shows; S F4's title tooltip is superseded by X1's shared Tooltip. The account button keeps its native `title` (G5-3). #6348's scope (theme set) must say it drops the rail row's `title`.                 | #6376, #6348                                           |
| D27   | The `<aside>`'s name: resolutions X11 says its `aria-label="Sidebar"` already exists in the code and "no new landmark copy is needed"; on `main` `sidebar.tsx` renders a bare `<aside>` and `en.json` has no `sidebar.ariaLabel`                                            | Decided 31 Oct: #6374 adds `sidebar.ariaLabel` "Sidebar" (fixed, five locales), as SH1 draws and X11 intends.                                                                                                                                                                                                                                                                                                                                              | #6374                                                  |
| D28   | Rail row hover ground: RAIL-BADGE `--sidehover` #e3e6eb vs G1 L1/D1 `side-line` #d9dde4                                                                                                                                                                                     | Resolved by rule (colour is TH1's; G1 is the colour reference): `side-line` on expanded and collapsed rows (§6.4). The dashboard set already voids #e3e6eb (#6363). The amber corner badge #8a5f00 is a non-text icon. It measures 4.15:1 on #d9dde4, which passes the 3:1 non-text minimum.                                                                                                                                                               | —                                                      |
| D29   | Popup and trigger geometry: the boards draw the expanded triggers 239px and the popups a fixed 240px. Their absolute popup top assumes a 54px Workspace trigger, while the trigger renders 52px, so the gap renders 6px                                                     | Resolved by board and rule: each popup takes its trigger's width (239px at the 264px sidebar), and the 1px is drawing noise. The Workspace trigger's name and domain get line-heights 18px / 16px, so the trigger is exactly 52px. The dropdown sits 4px below the trigger's bottom edge (S F7 note), and the board's extra 2px is drawing noise (§6.3, §8.1, §8.3).                                                                                       | #6375, #6379                                           |
| D30   | Phone Menu current-row icon colour: G1 P1/P2 `text` vs G2 frames 1–4 accent                                                                                                                                                                                                 | Resolved by rule (colour is TH1's; G1 is the colour reference): `text` (§10).                                                                                                                                                                                                                                                                                                                                                                              | #6376                                                  |
| D31   | Phone Menu inert rows: S F2 and G1 P1/P2 full opacity vs G2 frames 1–4 `opacity:.6`                                                                                                                                                                                         | Resolved by rule (row geometry is SH1's; G1 colour): full opacity. G2 drew the inner popups, not the rows (§10).                                                                                                                                                                                                                                                                                                                                           | #6376                                                  |
| D32   | Keyboard-highlighted Theme segment: G2 frames 2 and 4 draw the plate plus an inset 2px ring; §7/§12 said "no ring in every shell popup"                                                                                                                                     | Resolved by board (G2 frames 2/4; theme spec §9.3 already specifies it): the Theme section's `menuitemradio` segments keep the inset ring; the no-ring rule covers §7 items, Workspace items and phone Menu rows only.                                                                                                                                                                                                                                     | #6375, #6376 (neither styles the segments; #6345 does) |
| D33   | Tooltip near the viewport edge (T2, RAIL-BADGE rely on it; §9.3 pinned side, align, offset only)                                                                                                                                                                            | Resolved by board: Base UI's default collision handling stays on, so the tooltip flips and shifts to stay inside the viewport and never wraps (§9.3).                                                                                                                                                                                                                                                                                                      | #6370                                                  |
| D34   | Sticky offset under the top bar: §9.1 kept `--spacing-admin-topbar` at 68 while the bar is 59 / 67, and pages draw sticky elements at 59 (T2), 67 (`gap-voice-phone-chipbar-unpinned`) and 68 (`gap-look-mid-widths`)                                                       | Resolved by rule (the bar's geometry is SH1's): the token equals the bar's real height, 67px below `md` and 59px from `md`, and is both the scroll padding and every page's sticky offset (§9.1). It supersedes resolutions X4's "stays 68" and `gap-look-mid-widths`' 68.                                                                                                                                                                                 | #6374                                                  |
| D35   | Current-crumb cap: every board's `.bcur` (and `main`) caps the current crumb at 280px with an ellipsis; §11.1 said the leaf never truncates                                                                                                                                 | Resolved by board: the cap is adopted (§11.1), and the current crumb carries its full text as `title` when it is capped. No current label reaches 280px today.                                                                                                                                                                                                                                                                                             | #6377                                                  |

## 18. Ticket map

**#6314** is the docs-only ticket drafted in the onboarding set
(`tickets/onboarding.json`). It commits this doc, the other five reconciled
specs and `2026-10-30-admin-redesign-resolutions.md` under `docs/superpowers/specs/`. Until it merges,
the path every shell ticket's `## Design` cites does not exist on `main`. So
**every shell ticket, #6370 and the #6287 epic included, lists #6314 in
`dependsOn`**, as the theme, dashboard, Look, Voice and onboarding sets do.
"A ← B" below means B merges first, for the shared file or symbol named.

| Ref   | Title (short)                                                               | Depends on                                                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #6287 | The parent epic (§18.1), **pending D23**                                    | #6314                                                                                                                                                                                              |
| #6370 | Shared Tooltip on #6288's tooltip tokens; the editor toolbar adopts it      | #6314, #6288 (`--admin-tooltip*` tokens)                                                                                                                                                           |
| #6371 | Shared shell popup frame on the popover tokens; the phone Menu adopts it    | #6314, #6288 (popover tokens), D24                                                                                                                                                                 |
| #6372 | Content starts at the sidebar edge                                          | #6314, D24                                                                                                                                                                                         |
| #6373 | Add tenant leaves the operator sidebar                                      | #6314, D17                                                                                                                                                                                         |
| #6374 | Collapse toggle first in the top bar; the bar-height token                  | #6314, #6370 (Tooltip), #6405 (`ICONS.SIDEBAR` on the platform; X22b), #6288 (`sidebar-variants.ts`, toggle variants, `admin-theme.css`), #6373 (`layout/sidebar/`), #6371 (`layout/topbar/`), D27 |
| #6375 | Account at the sidebar foot; adds the §7 item slot                          | #6314, #6371 (frame), #6374 (`sidebar/`, `topbar/`), #6288 (tokens, `signed-in-account-variants.ts`), #6405 (`chevron-up.svg`), X-7.4                                                              |
| #6376 | Phone Menu: pinned switcher, scrolling nav, pinned account                  | #6314, #6375, #6379, #6366 (`topbar/`, Menu button), D2                                                                                                                                            |
| #6377 | Breadcrumb on one row; only the tenant crumb truncates                      | #6314, #6374 (`topbar/` and the breadcrumbs, resolutions §4)                                                                                                                                       |
| #6378 | Phone breadcrumb collapse and Full path menu; adds the group-label slot     | #6314, #6377 (`breadcrumbs/`), #6375 (item slot)                                                                                                                                                   |
| #6379 | Workspace switcher trigger geometry (§6.3) and its popup on the popup frame | #6314, #6371, #6288, #6335 (`tenant-switcher/`), D20, D24                                                                                                                                          |
| #6380 | Manual test: the shell against SH1, G1–G5 and T1/T2, Light and Dark         | #6314, #6370, #6371, #6372, #6373, #6374, #6375, #6376, #6377, #6378, #6379, #6288, #6291, #6341, #6346, #6347, #6348, #6366; prerequisite, not an edge: the Dark G4 frame drawn (§11.3)           |

The reconciliation note (§4) lists four "X ← #6287" merge edges: #6372
(`admin-shell/`), #6373 (`sidebar/`), #6374 (`topbar/`, collapse
provider) and #6288 (`sidebar-variants.ts`, `signed-in-account-variants.ts`).
The drafts carry D23's recommended epic shape (§17 D23 says why X3's shape
cannot be drafted), so none of them is an edge: an implementation ticket can
wait on another, but nothing can merge after an epic that closes last. If the
user keeps X3, D23's row says what follows. The theme set's #6288 ← #6287 and
the other sets' "← #6287" edges are dropped or repointed before filing (D23).

The reconciliation note's #6377 ← #6374 edge (`topbar/`,
breadcrumbs) is **kept**. #6377's criterion checks the trail on one row
after the toggle, which exists only once #6374 has landed. An earlier
draft dropped this edge on its own reasoning without recording a decision.

Edges added for shared folders: #6374 ← #6288 (`sidebar-variants.ts`
and the collapse-toggle variants, which #6288 recolours), #6374 ←
#6373 (`layout/sidebar/`), #6374 ← #6371 (`layout/topbar/`:
`topbar-nav-menu/`), #6373 ← #6371 (`topbar-nav-menu/`, shared current-row match), #6370 ← #6288 (the `--admin-tooltip*` tokens it
reads). #6375 and #6377 share no file and may run in parallel once
#6374 has merged.

**Cross-ticket criteria.** A ticket states only what it can verify when it
merges. Dark values are checked in #6291 (which carries the shared Tooltip's
Dark criterion) and in #6380, never as a "once #6291 has landed"
criterion in a ticket that does not depend on #6291. The same goes for a
criterion that needs a later ticket (the bar's 59px is #6374's own; the
toggle before the breadcrumb is checked in #6377 because #6377
follows #6374).

**Never in parallel (same files):** `layout/sidebar/` and `nav-item-content/`
— #6373, #6374, #6375, #6341, #6346, #6348, #6362, #6363;
`layout/topbar/` (`topbar.tsx`, `topbar-nav-menu/`, `account-menu/`) —
#6371, #6374, #6375, #6376, #6362, #6364, #6366, #6347;
`shared/breadcrumbs/` — #6377, #6378; `tenant-switcher/` — #6288,
#6379. #6287 under X3 touches all four.

**Retiring this doc.** It is deleted in a docs pull request once #6380
is closed and `docs/features/platform-shell.md` carries its shape, never
earlier: #6380 checks the build against §19.

### 18.1 If D23 makes #6287 the parent epic

#6287's body becomes, in the epic shape:

- **Why:** the five QA findings of §1.
- **Shape:** geometry SH1, colour TH1 tokens (#6288 Light, #6291 Dark, no
  new token); content from the sidebar edge, 1180px cap; sidebar = brand,
  switcher (pinned), scrolling nav, account foot with name and email, no Add
  tenant; the toggle first in the top bar with the shared Tooltip, the phone
  Menu button in the same slot, bar 59px from `md` and 67px on a phone; every
  shell popup on one shared frame; a one-row breadcrumb in which only the
  tenant name truncates, collapsing on a phone when a hidden crumb is a link.
- **Order:** #6314 first. #6372 (D24) alone runs in parallel with
  the others; #6373 (D17) after #6371; #6370 and #6371 (D24) after #6288; #6379 after
  #6371, #6288 and #6335 (D20, D24); #6374 after #6370, #6371, #6373, #6288
  and #6405 (D27); #6375 after #6374 and #6405 (X-7.4);
  #6377 after #6374; #6378 after
  #6375 and #6377; #6366 after #6370 and #6378;
  #6376 after #6375, #6379 and #6366 (D2); #6380
  last, after #6291 and #6341, #6346, #6347, #6348.
- **Done when:** `docs/features/platform-shell.md` describes the shell
  (content alignment, the account foot, the toggle slot and Tooltip, bar
  heights, breadcrumb rules, the phone Menu, the shared popup frame);
  #6380 is closed; then this doc is deleted.
- **Design:** this doc; the canvas boards D, S, G1–G5.

The epic needs the theme set's #6288 to drop its `#6287` edge (D23).

## 19. Acceptance checklist (tick each against its frame)

Check each frame at its drawn width, side by side with the board. Light
first; repeat every row in Dark once #6291 has landed, against the matching
G1 Dark frame (D1–D4, P2), G2/G5 Dark frame or the Dark G4 frame owed by
§11.3. "As today" means compare with `main` before the change. These rows
are checked in #6380, which depends on #6291; no implementation ticket
carries a Dark row.

**Frame D / G1 L1 (D1): owner Overview, 1376–1440, expanded**

- [ ] Sidebar 264px on `side` (#eef0f3 / #0a0c0f) with a 1px `side-line` right border
- [ ] Brand row: V mark (gradient), "Valstack" in `text-strong`, "admin" in `side-muted`. No toggle in it.
- [ ] Workspace switcher below the brand row on the white field (when it renders, D5): at least 52px tall, padding 8px 8px 8px 10px, 22×22 radius-4 avatar, name and Mono domain, one 16px down chevron; it stays put while only the nav area scrolls
- [ ] Sections "Dashboard", "Content", "Configuration" with 12 rows in the §6.4 order, icons and badges
- [ ] Rows 13px weight 400; "Overview" current at weight 600 (plate + bar per #6341); "Look" hovered shows the `side-line` ground and its native `title` (D26)
- [ ] Foot: account trigger exactly 52px tall, 30px `brand` "AM" circle, "Alex Morgan" 13px/18 `text` (with `title`), "alex.morgan@example.com" 12px/16 `muted`, `muted` up chevron, 1px `control-line-tint` border, radius 6
- [ ] Top bar: 36px toggle first (`control-line` border, white ground), then "Dashboard". Nothing to the right. 59px tall, translucent, `line` rule.
- [ ] Content starts at x=264.

**Tablet, 820 and 1024 (T1, T2)**

- [ ] At 820 and 1024 expanded: the 264px sidebar, the toggle first in the 59px bar, then "Dashboard" (T1); content from x=264
- [ ] At 820 collapsed: the 76px rail, content from x=76
- [ ] At 820 on Voice: the page's chip bar sticks directly under the 59px bar with no gap (T2, D34)
- [ ] At 820, a tooltip on a control near the window's right edge shifts left to stay inside the window and stays on one line (T2, D33)

**Sticky offset**

- [ ] At 1440, a page element that sticks under the bar (the Leads inbox list) sits flush under the 59px bar; at 390 a phone sticky element sits under the 67px bar; an anchor jump lands below the bar at both widths (D34)

**Frame 1: phone Overview, 390**

- [ ] No sidebar
- [ ] Top bar: 44px Menu button first, then "Dashboard". No account pill (after #6376). 67px tall.
- [ ] Content padding 16. The gap between page children is the page's (§4), not checked here.

**Frame 2 / G1 P1 (P2): phone Menu open**

- [ ] Popup 288 wide, 16px from the left, top at y=72 (17px under the Menu button), bottom 12px above the viewport (676px at 390×760), 6px padding, `popover` ground, `popover-line` border, radius 6 all round, `--shadow-admin-lg`
- [ ] Switcher pinned at the top with no extra inset and a `popover-line` divider under it
- [ ] Three sections with `muted` labels, 12 rows at ≥44px, 13px/400 `text`, badges shown ("Coming soon" on the popup neutral-pill ground, §14), "Coming soon" rows at full opacity. The list scrolls and the popup does not.
- [ ] "Overview" current: `popover-hover` plate with a 3px `brand-ink` bar flush with the row's left edge (radius 0 2px 2px 0, inset 10px top and bottom), a 600 label and a `text` icon (D30). Hover and keyboard highlight: plate only, no focus ring, weight unchanged (D12). Each row keeps its `title` (D26).
- [ ] Account trigger pinned at the foot with a `popover-line` divider above it, on `side-field` with a `side-field-line` border, name `text`, email and chevron `muted`
- [ ] Menu button in its open state (`brand-ink` border, `text` icon)
- [ ] Zone paddings: top 6px 6px 10px; middle 0 2px 8px (sections 10px 4px 0); foot 8px 2px 2px

**G3-1, G3-3: operator phone Menu**

- [ ] At 390×760: Platform section of five rows, no switcher **and no top zone** (no padding, no divider: the section starts inside the popup's 6px padding), "SR / Sam Rivera" pinned directly under the list; the popup is 352px tall, with no empty band
- [ ] At 390×420: the popup is 336px tall, only the list scrolls, the foot stays pinned

**G2-1…4: submenus inside the phone Menu (only once D2 is answered as drawn)**

- [ ] Down arrow, Enter or Space on a pinned trigger opens its popup with the first row highlighted; the open trigger shows the `side-accent` border
- [ ] The Workspace dropdown opens 6px below the pinned trigger, at its width, over the list; its items are ≥44px with the name and domain centred vertically; the Menu stays open behind
- [ ] The account menu opens 6px above the foot trigger, at its width: header, Theme (#6347), Sign out (44px)
- [ ] Highlight on the row after the current one shows the plate; the current workspace shows the D20 answer, including when it is itself highlighted (G2 specimen state 4, "bar on the plate", if D20 adopts the bar)
- [ ] Escape closes the inner popup and returns focus to its trigger; a second Escape closes the Menu onto the Menu button

**Frame 3 / G4-4…8: phone operator Danger zone**

- [ ] Breadcrumb: "…" (44px, `control-line` border) › truncated tenant name › "Danger zone" whole, on one row
- [ ] "…" hover: `brand-ink` border; keyboard focus: rest border + gapped ring; open: `brand-ink` border, `aria-expanded=true`; no tooltip
- [ ] Full path menu 220 wide, 7px below "…" with left edges aligned, popover frame, 4px padding: "Platform" as a `muted` group label, "Tenants" as an item, focused and highlighted (`popover-hover`, no ring)
- [ ] Escape returns focus to "…" with its ring
- [ ] Tenant-name crumb and "Tenants" links keep a 44px tap height
- [ ] Dark (the owed Dark G4 frame): "…" border #737d8d on #171a20 with a #e8eaef glyph, hover and open #a5b4fc, focus ring #a5b4fc with a #0f1115 gap; separators #8590a0; link hover #232730 with #e8eaef; the Full path menu #262b35 with a #4a5260 border, "Platform" #a3abb8, "Tenants" highlighted #323845

**G4-1…3: phone three-crumb trail**

- [ ] "Platform › Tenants › Field Notes" renders in full with no "…"
- [ ] A long tenant name (the leaf) truncates to no less than 48px and shows its full name in `title`; "Platform" and "Tenants" stay whole
- [ ] Tab: Menu → "Tenants" (gapped ring on the bar ground) → page content

**Frame 4 / G1 L2 (D2): collapsed, 1376**

- [ ] Rail 76px. Brand is the V mark only. No switcher. No section labels.
- [ ] Rows icon-only and centred, 32px tall with 16px icons (D25, not 44 and not the expanded ≈35.5). Inert rows at 50%.
- [ ] "Overview" (current) keeps its `side-raised` plate with the small shadow across the 52px-wide row and the 3px `side-accent` bar at the row's left edge (G1 L2/D2 note)
- [ ] Hovering a rail row shows the `side-line` ground (#d9dde4 / #1c1f26, D28)
- [ ] Account is a 52px square with the "AM" avatar only, `control-line-tint` border, radius 6
- [ ] Toggle hovered or focused: `brand-ink` border; tooltip "Expand sidebar" below, left-aligned (Light #12141a; Dark on `popover` with a `popover-line` edge); no native `title`; the same sidebar-panel glyph as expanded, unrotated
- [ ] Content starts at x=76

**Frame 5: toggle focus, expanded**

- [ ] Focus shows the hover colours plus the gapped ring (2px `bg` gap, 2px `brand-ink`)
- [ ] Tooltip "Collapse sidebar" shows on focus alone, at once; on hover after the delay; closes on click and next reads "Expand sidebar"
- [ ] Screen reader: "Collapse sidebar, button, expanded"; the control targets the sidebar, named "Sidebar"

**Frame 6 / G1 L3 (D3): account menu open**

- [ ] Opens upward, 6px gap, exactly the trigger's width (239px; the board's 240 is drawing noise, D29), radius 6 all round, 4px padding, popover frame
- [ ] Header: padding 10px 8px, `popover-line` divider with 4px below it. "Alex Morgan" 13px/600 `text` / email 12px `muted` / "Owner · Field Notes" 12px `muted` with 4px above. Not focusable.
- [ ] "Sign out" last: 16px power icon + label 10px apart, 44px tall, padding 6px 8px, radius 4, 13px/500, highlight `popover-hover` with no ring, by pointer or keyboard
- [ ] With #6346 landed: the Theme section sits between header and Sign out and fits in the 239px popup
- [ ] Trigger open: `side-accent` border, `side-raised` fill

**G5-1, G5-3: account trigger hover**

- [ ] Expanded and collapsed triggers on hover: `side-raised` ground, border, text and chevron unchanged
- [ ] Collapsed hover shows only the native `title` (name, or the email)

**Frame 7 / G1 L4 (D4): Workspace dropdown open**

- [ ] Trigger exactly 52px tall (name 13px on an 18px line, Mono domain 11px on a 16px line); popup 4px under its bottom edge (D29; the board renders 6px, drawing noise), exactly the trigger's width (239px), popover frame
- [ ] Items: name (13px/500 `text`) over Mono domain (`muted`). Neutral "Archived" pill on Old Portfolio, `muted` on #eef0f3 / #323845 (§14 ²). Highlighted row (pointer or arrow keys) on `popover-hover` with no ring. Current row per D20.
- [ ] Items have no minimum height from `md`; ≥44px below `md`
- [ ] Trigger border `side-accent`

**Frame 8: focus rings**

- [ ] Switcher, a nav row and the account trigger each show the gapped ring in `side-accent` on the sidebar ground

**Frame 9 / G5-2 collapsed: collapsed account menu**

- [ ] The menu opens to the right of the rail, its left edge at x 84, bottom aligned with the trigger, a fixed 240 wide
- [ ] Trigger in its open state

**Frame 10: 1920**

- [ ] Content max 1180, starting at the sidebar edge. Spare width on the right. The top bar spans to 1920.

**Operator `/tenants/new`, 1376**

- [ ] Breadcrumb "Platform › Tenants › Add tenant". The current sidebar row per D17.

**Frame 11: operator Tenants, 1376**

- [ ] One "Platform" section: Tenants (current), Findings, Releases, Blocked sign-ups, Data requests. **No Add tenant.** No switcher.
- [ ] Breadcrumb "Platform › Tenants"
- [ ] "Add tenant" primary button in the page head
- [ ] Account "SR" / "Sam Rivera" / "sam.rivera@valstack.dev"

**Frame 12: long trail, narrow**

- [ ] Toggle first. "Platform › Tenants › Kitchen Table Recipes… › Danger zone" on one row. Only the tenant name truncates (never below 48px) and its `title` holds the full name.
- [ ] Every current crumb is capped at 280px with an ellipsis (D35); "Danger zone" stays whole
- [ ] Dark (G1 D1 for the crumb): current #e8eaef 600, separators #8590a0, link hover #232730 with #e8eaef

**Frames 13–15 / G5-2: long text and email-only**

- [ ] F13: switcher name and domain each on one line with an ellipsis. The popup wraps them in full (D10).
- [ ] F14: account name and email each truncate; hovering the name shows its full text (`title`). The popup header wraps them in full. Avatar "AK".
- [ ] F15 / G5: no name. The email on the name line in 13px/600 `text` (#12141a / #e8eaef), no second line, avatar "S". Menu header shows the email once, then "Owner · Field Notes". Collapsed: `title` = email, name "Account: {email}".

**Collapse persistence**

- [ ] Collapsing, reloading and navigating keep the rail collapsed (cookie, as today)

## Out of scope (optional follow-up)

Not filed. Drawn on the shell boards only as a backdrop, or drafted elsewhere
for a backdrop page (reconciliation note §3):

- SH1 F3 Danger zone and F11 Tenants page bodies (the shell around them is in
  scope).
- G3's Tenants page on a phone, the first 390-wide drawing of it: the Active /
  All buttons measure 38px, under the 44px phone target. A Tenants phone pass
  would fix it.
- TH1 Tenants items: table rows and headers, Mono domains, Manage links
  (NEW-TH1-18), the Search tenants field (NEW-TH1-19), the Tenants page head
  and its Add tenant button (NEW-TH1-20), sorting arrows (§20.19) and the
  Active / All toggle beside search (§20.22).
- TH1 `roleLabel.SUPERADMIN` → "Superadmin" (§20.24) and the English
  `formatDate` change (§20.23); the account role line keeps today's
  `roleLabel`.
- The Overview cards behind G1 and G4 belong to the dashboard set, not to a
  follow-up.
- RAIL-BADGE's proposal that every collapsed-rail row rise to 44×44 with
  17px icons (D25). SH1's rail row stands; raising it would be a shell
  follow-up.
