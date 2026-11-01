# Admin theme: grey light sidebar, dark palette and theme switch

Design of record for direction **TH1 · Grey light sidebar**, chosen on 30 Oct
2026, as reconciled with the five other chosen directions on the same day. The
dark dropdowns were revised that day to the popover tokens #262b35 / #4a5260 /
#323845. The canvas is the visual reference:
https://claude.ai/artifact/LVch29ZcSE9Lh5T3Cocm9J.

**Boards this doc is checked against**

| Board id                            | Title on the canvas (or in-board heading where the board is not on the canvas yet)     | On the canvas | What it settles here                                                                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme-TH1-grey-sidebar-desktop`    | "TH1 · Grey light sidebar (chosen, revised) · Desktop" (1440 × 1852)                   | yes           | Frame D1 (colours only, §3) and D2 "Palettes and contrast": every light and dark token value and the 58 key pairs                                                            |
| `theme-TH1-grey-sidebar-states`     | "TH1 · Grey light sidebar (chosen, revised) · States and phone" (1440 × 3616)          | yes           | Frames S1–S13 (colours only, §3), the Theme section, the gapped focus ring, popover rows, S13 Studio sync                                                                    |
| `gap-shell-sh1-in-th1`              | "SH1 shell in TH1 colours — Light and Dark"                                            | **no**        | **The builder's single shell reference**: SH1 geometry in TH1 colours. L1–L4 and D1–D4 (expanded, collapsed, account menu open, Workspace dropdown open), P1–P2 (phone Menu) |
| `gap-theme-token-dark-values`       | "Gap · Theme token dark values — #6381, #6403, #6321"                                  | **no**        | Dark values and key pairs for every colour and shadow token the Look, Voice and onboarding sets add (§5.4)                                                                   |
| `gap-shell-account-states`          | "Gap · Account states on the grey sidebar — trigger hover, and the email-only account" | **no**        | Account trigger rest / hover / open colours, the email-only account with the Theme section, Light and Dark                                                                   |
| `gap-shell-phone-menu-submenus`     | "Gap · Phone Menu — Workspace dropdown and account menu opened from inside it"         | **no**        | Theme section at 44px inside the phone account menu; the highlighted theme item beside the checked one, Light and Dark; phone Menu contrast pairs                            |
| `gap-shell-breadcrumb-phone-states` | "Gap · Phone breadcrumb — the three-crumb operator trail and the “…” button states"    | **no**        | Colours of the "…" button and its Full path menu (§10)                                                                                                                       |
| `gap-onboarding-dark`               | "Setup wizard in Dark"                                                                 | **no**        | The onboarding wizard (step 3, 1440 and 390) in Dark: what #6291's dark palette must render there; the rail stays dark in both themes                                        |
| `gap-dash-studio-rail-badge`        | "Studio rail badge"                                                                    | **no**        | The only drawn rail-row tooltips (Studio row, Light): placement right of the row, one line that grows to the right, Base UI collision (§9.5)                                 |
| `gap-theme-sidebar-row-states`      | "Sidebar row states"                                                                   | yes           | The undrawn sidebar states of §7 (#6342), Light and Dark                                                                                                                     |
| `gap-theme-lead-row-focus`          | "Lead row focus"                                                                       | yes           | The focused lead row (read, unread, selected), Light and Dark (§12 "Feature surfaces", #6340)                                                                                |

The manual test (#6353) also compares against four boards of other sets: `gap-dash-notices` A (step 30), `gap-voice-820` (steps 26 and 34), `gap-voice-phone-head` frame 2 and `gap-look-mid-widths` A and C (step 34).

Every board above is on the canvas, and `gap-theme-token-dark-values` carries
the Dark preview-stage "Stage" specimen (§5.4), drawn as the proposal #1d2027.

Every value in this doc is copied from a board source. None is rounded. When
this doc and a board disagree, the board wins and this doc is corrected —
after the precedence rule below picks which board.

**Precedence rule (approved by the user, 30 Oct).** Where boards from
different directions disagree, each kind of detail comes from one source:

| Kind of detail                                                                                                                                                                               | Source                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Shell structure: sidebar, top bar, collapse button first in the top bar, breadcrumbs, account menu at the sidebar foot, phone Menu, popup geometry                                           | **SH1** — `docs/superpowers/specs/2026-10-30-admin-shell-design.md`                |
| **Colour and tokens**: light and dark palettes, popover colours, control borders, focus ring, sidebar ground and active plate/bar, pill grounds, Mono font, the Light / Dark / System switch | **TH1 — this doc**                                                                 |
| Cards, status pills, page heading, detail lists                                                                                                                                              | Dashboard layout B — `docs/superpowers/specs/2026-10-30-owner-dashboard-design.md` |
| Tooltip                                                                                                                                                                                      | Layout B's look; opens after Base UI's hover delay, at once on keyboard focus      |
| Look / Voice / onboarding pages                                                                                                                                                              | LX + G2 / V3a / W2, each in its own spec                                           |
| Pages a board drew only as a backdrop                                                                                                                                                        | out of scope (§22)                                                                 |
| Anything no board draws                                                                                                                                                                      | drawn before filing                                                                |

So this doc owns the **colours** of everything, the **dark palette**, the
**theme preference** and its switch, the **Studio sync**, the **gapped focus
ring** and the **popover tokens on form popups**. Where a TH1 frame also draws
structure (a labelled Workspace field, a collapse button in the brand row, a
solid 68px top bar, chevron breadcrumb separators, a 300px account menu), the
structure is SH1's and is not built from TH1. The cross-set resolutions file,
which #6314 lands beside the six specs, records every conflict; its numbers
(X1–X30) are cited below.

This doc lands on `main` in the docs-only change tracked in #6314, together with the five
other reconciled specs and the resolutions file, before any ticket that cites
it is created, so every ticket's Design line points at a live path.

`apps/platform` has no Storybook. A styling-only ticket in this set is covered
by the manual-test issue's numbered step for its frame, which the ticket names.

## 1. Why

The admin has a light theme only, with a near-black sidebar. The card header is
almost the same white as the card body. Control borders (#818a99) read as very
dark. The workspace switcher looks like part of the sidebar rather than a
dropdown. Owners asked for a Light / Dark / System switch, a grey sidebar in
Light that passes WCAG, and an admin theme that stays in step with the embedded
Studio's own theme.

Earlier admin designs were built without some of their drawn items, such as the
segmented stepper on the onboarding page. This doc therefore lists **every**
element per frame in §19. A ticket is not done until each row of its slice is
ticked against the build.

## 2. Goals and non-goals

Goals:

- A complete light palette and a complete dark palette, 34 tokens each (8 of
  them new; 68 values in all), plus the §5.2 extras, with every key pair on
  board D2 and the shell pairs of §5.3.1 passing its WCAG threshold and
  guarded in CI.
- Dark values, with guarded key pairs, for every colour and shadow token the
  Look, Voice and onboarding sets add (§5.4).
- A grey light sidebar with TH1's active plate and bar, a white raised
  Workspace field, and TH1 colours on every shell element SH1 builds.
- Popover tokens for every menu, popup and option list, so dark menus sit one
  step above the surface they open over.
- One gapped focus ring and the TH1 control borders on every admin control.
- A Light / Dark / System theme switch in the account menu (desktop, rail and
  phone), applied on the server with no flash on load.
- The embedded Studio follows the admin theme, and the Studio's Appearance menu
  updates the admin.

Non-goals:

- **Shell structure.** Sidebar widths and rows, the brand row, landmarks, the
  collapse button (first in the top bar, X2), the top bar (translucent, 59px /
  67px, X4), breadcrumbs (X9), the account trigger and menu geometry, the
  Workspace dropdown structure (X8) and the phone Menu (no scrim) are the shell
  set's (#6287, #6370, #6371, #6372, #6373, #6374, #6375, #6376, #6377, #6378, #6379, #6380). They are built on this doc's tokens.
- **Cards, pills, page head, buttons' metrics.** Card chrome is #6355
  (X15), the StatusBadge primitive — metrics and its tone-to-token map —
  #6356 (X12), the page head #6357 (X19), button hover #6358.
  They take their colours from this doc's tokens.
- **The Tooltip primitive.** #6370 owns it (X1). This doc gives it its dark
  colours (§5.2) and the rail rows adopt it (#6348).
- **Icon glyphs and sizes.** New glyphs are #6404 (keys and `@blog/ui` glyphs) and #6405 (platform registrations); sizes and `strokeWidth`
  are #6361. Whether every admin icon moves to stroke 2 is open (§15,
  §20 item 2).
- **The segmented control's look** (X17): #6385 (LX geometry on these
  tokens).
- **The save bar** (X16): #6413 and its chain.
- **Field order** (error and hint, X18) and every field, button and card
  **metric**: the page boards' (§12).
- The public site's themes. `apps/platform/src/components/features/site-preview/`
  and the Look / Voice / onboarding preview frames keep rendering the tenant's
  own tokens in either admin theme.
- The onboarding wizard's rail (`rail-brand`, `rail-intro`,
  `onboarding-rail-step`) and its phone step header: they stay #0f1115 in both
  admin themes (resolved, §20 item 6; `gap-onboarding-dark`). The rest of the
  onboarding pages and the sign-in pages follow the admin theme.
- Pages TH1 drew only as a backdrop — the Tenants table, search and page head,
  the Features card, the Email form's field order and footer — are §22.

## 3. Frames and what each contributes

TH1 frames are used for **colour** only; where a TH1 frame draws structure,
the structure is checked against `gap-shell-sh1-in-th1` instead.

| Frame | Board       | Size       | Theme | Used here for                                                                                                                                                                   | Structure checked against                                       |
| ----- | ----------- | ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| D1    | TH1 desktop | 1440 × 780 | Light | Sidebar ground, rules, row and label colours, active plate and bar, pills' colours, account menu popover colours, Theme section (System checked)                                | `gap-shell-sh1-in-th1` L1, L3                                   |
| D2    | TH1 desktop | 1440 wide  | both  | 34 tokens × 2 palettes and 29 key pairs × 2                                                                                                                                     | —                                                               |
| S1    | TH1 states  | 1384 × 600 | Dark  | Dark sidebar, top bar, breadcrumb, account trigger and menu colours, Theme section (Dark checked). The Tenants table, search, page head and Add tenant are backdrop (§22)       | `gap-shell-sh1-in-th1` D1, D3                                   |
| S2    | TH1 states  | 440 × 380  | Light | Workspace field and dropdown colours                                                                                                                                            | `gap-shell-sh1-in-th1` L4                                       |
| S3    | TH1 states  | 440 × 380  | Dark  | Same, Dark                                                                                                                                                                      | `gap-shell-sh1-in-th1` D4                                       |
| S4    | TH1 states  | 440 × 380  | Light | Gapped focus ring on the Workspace field and on a nav row                                                                                                                       | —                                                               |
| S5    | TH1 states  | 670 × auto | Light | Input border, focus ring, invalid border, error colour, switch colours and focus. Field order and the card-footer save bar are backdrop (§22)                                   | page boards                                                     |
| S6    | TH1 states  | 670 × auto | Dark  | Same as S5, Dark                                                                                                                                                                | page boards                                                     |
| S7    | TH1 states  | 390 × 780  | Light | Phone page and top bar colours                                                                                                                                                  | `gap-shell-sh1-in-th1` P1                                       |
| S8    | TH1 states  | 390 × 780  | Light | Phone Menu popover colours, active row plate and bar                                                                                                                            | `gap-shell-sh1-in-th1` P1                                       |
| S9    | TH1 states  | 390 × 780  | Dark  | Phone Menu in Dark, Theme section 44px with Dark checked                                                                                                                        | `gap-shell-sh1-in-th1` P2, `gap-shell-phone-menu-submenus` 2, 4 |
| S10   | TH1 states  | 300 × 680  | Light | Rail ground, rule, icon colours, active plate and bar on the rail. S10 draws **no** tooltip (rail rows carry `aria-label`s only); the tooltip is `gap-dash-studio-rail-badge`'s | `gap-shell-sh1-in-th1` L2                                       |
| S11   | TH1 states  | 1040 wide  | Light | Breadcrumb colours; the undrawn superadmin tenant groups' context                                                                                                               | shell spec (SH1 F3, F12)                                        |
| S12   | TH1 states  | 1040 wide  | Dark  | Same, Dark                                                                                                                                                                      | shell spec                                                      |
| S13   | TH1 states  | 1040 wide  | —     | Behaviour: theme preference and Studio sync                                                                                                                                     | —                                                               |

New frames drawn for this set and its neighbours:

| Board                           | Frames                                                                                                                          | Used here for                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `gap-shell-sh1-in-th1`          | L1–L4, D1–D4 (1376), P1–P2 (390)                                                                                                | Every shell colour in Light and Dark, the Theme section's metrics in SH1's trigger-width popup, row hover, the Dark tooltip      |
| `gap-theme-token-dark-values`   | Palettes and contrast (Light, Dark), Specimens, "Already in TH1", Shadows, Open, Notes                                          | §5.4                                                                                                                             |
| `gap-shell-account-states`      | 1 (expanded rest / hover / open, Light and Dark), 2 (email-only, expanded and collapsed, menu open), 3 (collapsed rest / hover) | Account trigger colours (§7.4); the Theme section is unchanged for an email-only account                                         |
| `gap-shell-phone-menu-submenus` | 2 (Light, Dark highlighted beside checked Light), 4 (Dark, System highlighted beside checked Dark)                              | Theme items 44px on a phone; the keyboard highlight beside the checked item (§9.3)                                               |
| `gap-onboarding-dark`           | Step 3 at 1440, step 3 at 390                                                                                                   | The onboarding pages in Dark (§6 Scope); its preview-toolbar values are placeholders superseded by `gap-theme-token-dark-values` |
| `gap-dash-studio-rail-badge`    | Frames 1–4, the keyboard focus frame, the long-locale (de) "Invite sent" frame — all on the Studio row, Light only              | Rail row tooltip: the row's name, to the right of the row, one line growing to the right, Base UI collision (§9.5)               |

Manual test widths: 390, 1040, 1280 and 1440, Light and Dark. Breakpoints are
the shell spec's (`md` for the sidebar and the phone Menu).

**How colours are written.** In Light many tokens share a hex (brand,
brand-ink and side-accent are all #4f46e5; text and text-strong #12141a; muted
and side-muted #5b6472; surface, side-raised, side-field and popover #ffffff;
line and popover-line #e5e7eb; surface-head and popover-hover #eef1f6; line-2,
side, pill-neutral and theme-track #eef0f3; control-line-tint and
side-field-line #7c8493). A wrong token passes every Light check and only
breaks in Dark. So every colour in this doc and in every ticket names its
**token first**, then the light hex, then the dark hex:
`brand-ink #4f46e5 / #a5b4fc`. A build that picks a different token with the
same light hex is wrong.

### 3.1 Where boards disagree — what the build follows

These are the places where two boards draw a different value for the same
element. Each is settled by the precedence rule; a side-by-side check expects
the "Build" column. Anything else that differs is a defect.

| Where                                | Boards                                                                                                                                                                                                                                                                                                           | Build                                                                                                                                                                                                                        | Settled by                                                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Account menu width                   | TH1 and `gap-shell-account-states`: 300. `gap-shell-sh1-in-th1` L3/D3: the trigger's width (240)                                                                                                                                                                                                                 | the trigger's width (SH1); the Theme segments size to their labels so all three fit (§9.3)                                                                                                                                   | popup geometry = SH1                                                                                                                    |
| Theme segment metrics                | TH1: equal width, padding 5px 8px, gap 6. `gap-shell-sh1-in-th1`: `flex: 1 1 auto`, padding 5px 4px, gap 5                                                                                                                                                                                                       | `gap-shell-sh1-in-th1`'s, which fit the 240 popup                                                                                                                                                                            | popup geometry = SH1; drawn to fit                                                                                                      |
| Theme track ground, Dark             | TH1: theme-track #0f1115. `gap-shell-sh1-in-th1` paints line-2 (#232730)                                                                                                                                                                                                                                         | theme-track #0f1115                                                                                                                                                                                                          | colour = TH1                                                                                                                            |
| Raised shadow, Dark                  | TH1: `0 1px 2px rgba(0,0,0,.4)`. `gap-shell-sh1-in-th1`: two layers at .3 / .35                                                                                                                                                                                                                                  | TH1's single layer                                                                                                                                                                                                           | colour = TH1                                                                                                                            |
| Account trigger rest border          | TH1 and `gap-shell-account-states`: side-line. `gap-shell-sh1-in-th1`: control-line-tint                                                                                                                                                                                                                         | side-line at rest and on hover; control-line-tint when open (§7.4)                                                                                                                                                           | colour = TH1 (two boards agree)                                                                                                         |
| Sidebar row hover                    | TH1 draws none. `gap-shell-sh1-in-th1`: side-line #d9dde4 / #1c1f26. `gap-dash-studio-rail-badge`: #e3e6eb                                                                                                                                                                                                       | side-line, expanded and rail alike; the Studio badge's circle takes side-line on hover                                                                                                                                       | the shell colour reference                                                                                                              |
| Highlighted theme item               | TH1 §20.15 (old draft): ring only. `gap-shell-phone-menu-submenus` 2 / 4 (`.seg button.hl`): popover-hover plate, an **inset** 2px brand-ink ring (`box-shadow: inset 0 0 0 2px`), no gap, label and icon text #12141a / #e8eaef. An earlier draft of this doc asked for the outer §4 gapped ring                | the drawn inset ring on the plate, label and icon text (§9.3). The §4 gapped ring would reach 4px outside a segment that sits 3px from its neighbour                                                                         | TH1 key pair "Check and focus ring on hovered row" (ring on the plate, 5.55 / 5.89); drawn                                              |
| Theme item under the pointer         | No board draws it. Base UI sets `data-highlighted` for pointer and keyboard alike; `gap-shell-phone-menu-submenus` labels its one highlight state "(keyboard or pointer)"                                                                                                                                        | the same highlighted look as the keyboard: plate, inset ring, text label and icon (§9.3)                                                                                                                                     | one Base UI state; the board's legend                                                                                                   |
| Account trigger text, Dark           | §7.4 (old draft): name text #e8eaef, email muted #a3abb8, chevron unstated. TH1 S1 and `gap-shell-account-states` 1 and 3: name #ffffff, email (role line on S1) and chevron #8d96a6, and that board's pairs                                                                                                     | name text-strong #12141a / #ffffff; email and chevron side-muted #5b6472 / #8d96a6 (§7.4)                                                                                                                                    | colour = TH1 (two boards agree)                                                                                                         |
| Breadcrumb separator                 | TH1 D1, S1, S11 / S12: an icon in faint #7a8394 / #8590a0. `gap-shell-sh1-in-th1`: the "›" glyph in muted by inheritance                                                                                                                                                                                         | faint #7a8394 / #8590a0, `aria-hidden` (§10); the glyph and its size are SH1's                                                                                                                                               | colour = TH1                                                                                                                            |
| Focused rail row icon                | `gap-dash-studio-rail-badge` (`.row.fv .ic`): text-strong #12141a. TH1 S4: the focused nav row keeps its side-muted #5b6472 icon                                                                                                                                                                                 | side-muted, as at rest; only the ring changes (§7)                                                                                                                                                                           | colour = TH1                                                                                                                            |
| Phone Menu active row icon           | `gap-shell-sh1-in-th1` P1 / P2 and TH1 S8: text. `gap-shell-phone-menu-submenus` (`.row.on .ic`): brand-ink                                                                                                                                                                                                      | text #12141a / #e8eaef (§11)                                                                                                                                                                                                 | colour = TH1 (S8 and the shell reference agree)                                                                                         |
| Phone Menu inert rows                | `gap-shell-sh1-in-th1` P1 / P2: full opacity. `gap-shell-phone-menu-submenus`: opacity .6                                                                                                                                                                                                                        | full opacity (§11); the .5 opacity is the collapsed rail's only                                                                                                                                                              | the shell colour reference                                                                                                              |
| Phone Menu pinned triggers           | `gap-shell-sh1-in-th1` P1 / P2: account trigger with a control-line border on a transparent ground. `gap-shell-phone-menu-submenus` 1–4: side-field ground, side-field-line border, side-accent when open. Both: Workspace field side-field / side-field-line                                                    | both triggers side-field #ffffff / #171a20 with a side-field-line #7c8493 / #737d8d border; open border side-accent (§11)                                                                                                    | colour = TH1: TH1 S8 draws the pinned Workspace field that way; the board's pair "Trigger border on popover 3.76 / 3.41" is this border |
| "…" breadcrumb button                | `gap-shell-breadcrumb-phone-states` 5 and 7: hover and open border "brand #4f46e5" (Light only)                                                                                                                                                                                                                  | brand-ink #4f46e5 / #a5b4fc, as the Menu button it copies (§10)                                                                                                                                                              | the token's role (hover borders are brand-ink)                                                                                          |
| Studio badge and line tones, Dark    | `gap-dash-studio-rail-badge` notes: DB3's dark tones #fbbf24 / #a5b4fc / #f87171 on #0a0c0f                                                                                                                                                                                                                      | warn #f5c451, brand-ink #a5b4fc, bad #fca5a0 (§7 Studio row); DB3's dark tones are void                                                                                                                                      | colour = TH1                                                                                                                            |
| Onboarding preview toolbar, Dark     | `gap-onboarding-dark`: pressed #262b35, hover #2b303a (marked placeholder)                                                                                                                                                                                                                                       | `gap-theme-token-dark-values`: pressed popover-hover #323845, hover #22262f                                                                                                                                                  | the token board (the onboarding board defers)                                                                                           |
| Phone theme items and Sign out       | TH1 S9: 32 / 36 tall                                                                                                                                                                                                                                                                                             | 44 tall                                                                                                                                                                                                                      | platform phone-target rule                                                                                                              |
| Workspace field open border          | TH1: brand-ink. `gap-shell-sh1-in-th1`: side-accent                                                                                                                                                                                                                                                              | side-accent (same hex in both themes: #4f46e5 / #a5b4fc)                                                                                                                                                                     | sidebar context token                                                                                                                   |
| Account trigger open border          | `gap-shell-sh1-in-th1` L3 / D3 (`.acct.open`): side-accent on side-raised. `gap-shell-account-states` 1 "Open, for comparison" and TH1 S1 (#737d8d): control-line-tint                                                                                                                                           | control-line-tint #7c8493 / #737d8d on side-raised (§7.4); a side-by-side with L3 / D3 expects this border, not L3's accent                                                                                                  | colour = TH1 (two boards agree)                                                                                                         |
| Active row shadow, Dark              | `gap-shell-sh1-in-th1` D1 / D2 (`.row.on{box-shadow:var(--shsm)}`): raised shadow. TH1 S1: `box-shadow: none`                                                                                                                                                                                                    | none in Dark; the raised shadow in Light only (§7)                                                                                                                                                                           | colour = TH1                                                                                                                            |
| Current workspace bar                | §8 (old draft): side-accent. §5.3.1: brand-ink on popover. `gap-shell-phone-menu-submenus` "Current row vs highlighted row" labels it side-accent and paints `--accent`                                                                                                                                          | **brand-ink** #4f46e5 / #a5b4fc: the bar sits on the popover, not the sidebar, and brand-ink is the popover's accent (phone Menu active-row bar)                                                                             | one token per role (§3, "How colours are written")                                                                                      |
| Phone Theme section metrics          | `gap-shell-phone-menu-submenus` 2 / 4 (`.thsec`): padding 6px 8px 12px; segments equal width, padding 5px 8px, gap 6. `gap-shell-sh1-in-th1` L3 / D3: padding 8px 8px 10px, `flex: 1 1 auto`, 5px 4px, gap 5                                                                                                     | §9.3's metrics (`gap-shell-sh1-in-th1`) at every width; only the item height changes (44 on a phone)                                                                                                                         | one block (#6345); popup geometry = SH1                                                                                                 |
| Phone Menu button open border        | `gap-shell-phone-menu-submenus` (`.tgl.open`): brand (#5850ec in Dark). `gap-shell-sh1-in-th1` (`.tgl.open`) and §10: brand-ink                                                                                                                                                                                  | brand-ink #4f46e5 / #a5b4fc (§10)                                                                                                                                                                                            | the token's role (hover and open borders are brand-ink)                                                                                 |
| Active Voice chip hover, Light       | `gap-voice-820`, `gap-voice-show-preview-pressed`, `gap-voice-phone-chipbar-unpinned` (`.chip.on:hover`): #4338ca. `gap-theme-token-dark-values`: brand-hover #3730a3                                                                                                                                            | brand-hover #3730a3 / #6159ee (§5.4; §20 item 3)                                                                                                                                                                             | colour = TH1 (the token board)                                                                                                          |
| Preview stage and frame chrome, Dark | `gap-onboarding-dark` (`.stage`): surface-head #1d2027 ground with a line #2b303a border; frame bar #1d2027, dots #4a5260, frame border #737d8d. `gap-theme-token-dark-values` "Device frame": bar surface #171a20 with a line #2b303a rule, dots frame-dot #3a404b, border control-line #737d8d; no stage drawn | frame chrome from the token board (§5.4 "Preview stage and device frame"); the stage has no border in either theme (onboarding spec §11.5) and its own token, preview-stage, whose Dark value is drawn before #6291 is filed | the token board (the onboarding board defers, onboarding spec §11.5)                                                                    |
| Link-button hover ground             | `gap-dash-band-820`, `gap-dash-notices` (`.lbtn:hover`): #e3e7ee                                                                                                                                                                                                                                                 | hover #e2e5ea / #22262f (§5.4)                                                                                                                                                                                               | "Reuse before you create" (dashboard spec, DNS link)                                                                                    |
| Disabled secondary button            | `gap-voice-820` saving strip (`.btns:disabled`): #c4c9d2 border, muted text. §12 (old draft): today's disabled opacity                                                                                                                                                                                           | control-line-locked #c5cad3 / #424956 border, muted label, surface ground, no opacity (§12)                                                                                                                                  | the nearest TH1 token (one step from #c4c9d2)                                                                                           |
| Selected preset card, Dark           | `gap-onboarding-dark`: 1.5px #a5b4fc border, 3px #23244a halo, dot #a5b4fc with a #0f1115 tick. `shared/preset-picker` today: border and dot brand                                                                                                                                                               | brand-ink border and dot, brand-weak halo, on-brand-ink tick (§6.1)                                                                                                                                                          | colour = TH1 (brand would be #5850ec in Dark)                                                                                           |

## 4. Global conventions

| Item                | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mono font           | `'JetBrains Mono', ui-monospace, monospace`, weight 500 (X24: #6335 owns it, as its first user). Used for every domain string (Workspace field and dropdown, tenant detail header, Domain page, onboarding site address) and every token name or hex value shown in the UI (Look). A loader already exists (`config/font-loaders/jetbrains-mono-font.ts`, weights 400–500, `preload: false`) but the admin shell does not apply it: reuse it, never add a second loader.                                                                                                                                                                                                                                                                                                                     |
| Raised shadow       | Light `0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)`. Dark `0 1px 2px rgba(0,0,0,.4)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Menu shadow         | Light `0 12px 40px rgba(16,24,40,.14)`. Dark `0 12px 40px rgba(0,0,0,.55)`. Every shell popup and the tooltip use it (X7).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Focus ring          | `box-shadow: 0 0 0 2px <ground>, 0 0 0 4px <brand-ink>`: a 2px gap in the ground the element sits on, then a 2px ring (X13). Ring #4f46e5 light, #a5b4fc dark; on the sidebar side-accent (same values). Grounds: sidebar side (#eef0f3 / #0a0c0f); page bg (#f6f7f9 / #0f1115) for breadcrumb links, the top-bar toggle and the phone Menu button; card surface (#ffffff / #171a20); card header surface-head (#eef1f6 / #1d2027); inside a popover (#ffffff / #262b35); inside the theme group theme-track (#eef0f3 / #0f1115). The ring **replaces** a raised shadow; it never stacks with it. One exception: on the toast (ground tooltip #12141a / #262b35) brand-ink is 2.93:1 in Light, so the toast's controls take the same geometry with a **white (fixed)** ring (18.41 / 14.20). |
| Switch thumb shadow | `0 1px 2px rgba(16,24,40,.25)` in both themes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

Pill metrics (20px, X12), card metrics (X15), radii, icon sizes and the tooltip
box are owned by the tickets named in §2; this doc gives them colours only.

## 5. Tokens

### 5.1 Palette

`apps/platform/src/styles/admin-theme.css`. Every token is `--admin-<name>`
with a matching `--color-admin-<name>` in `@theme inline`. ● marks a token
that does not exist today. "Today" is the current light value.

| Token               | Role                                                                                 | Light   | Dark    | Today       |
| ------------------- | ------------------------------------------------------------------------------------ | ------- | ------- | ----------- |
| bg                  | Page background; the top bar at 90%                                                  | #f6f7f9 | #0f1115 | #f6f7f9     |
| surface             | Card, input, top-bar toggle and Menu button ground                                   | #ffffff | #171a20 | #ffffff     |
| surface-2           | Card footer, row hover                                                               | #fbfbfd | #1b1e25 | #fbfbfd     |
| surface-head ●      | Card header tint                                                                     | #eef1f6 | #1d2027 | —           |
| line                | Card border, header rule, top-bar rule                                               | #e5e7eb | #2b303a | #e5e7eb     |
| line-2              | Row dividers                                                                         | #eef0f3 | #232730 | #eef0f3     |
| control-line        | Input, select, checkbox, switch off, top-bar toggle, Menu button, theme group border | #878f9d | #737d8d | **#818a99** |
| control-line-tint ● | Controls on a grey or tinted ground; the open account trigger                        | #7c8493 | #737d8d | —           |
| text                | Body text                                                                            | #12141a | #e8eaef | #12141a     |
| muted               | Secondary text, hints                                                                | #5b6472 | #a3abb8 | #5b6472     |
| faint               | Icons and chevrons only, never text                                                  | #7a8394 | #8590a0 | **#8a93a3** |
| brand               | Primary fill, switch on, avatar                                                      | #4f46e5 | #5850ec | #4f46e5     |
| brand-ink ●         | Links, brand text, focus rings, hover borders                                        | #4f46e5 | #a5b4fc | —           |
| brand-weak          | Brand and plan pill ground, Workspace initials ground                                | #eef2ff | #23244a | #eef2ff     |
| brand-strong        | Plan pill text, Workspace initials                                                   | #3730a3 | #c7cdfd | #3730a3     |
| side                | Sidebar ground                                                                       | #eef0f3 | #0a0c0f | **#0f1115** |
| side-line           | Sidebar rules, sidebar row hover, account trigger border                             | #d9dde4 | #1c1f26 | **#1c1f26** |
| side-text           | Nav row text                                                                         | #2a303b | #c9cfda | **#c9cfda** |
| side-muted          | Section labels, sidebar meta, nav icons                                              | #5b6472 | #8d96a6 | **#7d8696** |
| side-raised         | Active nav row plate; account trigger hover and open ground                          | #ffffff | #20242e | **#20242e** |
| side-accent         | Active bar, sidebar focus ring, open Workspace field border                          | #4f46e5 | #a5b4fc | **#a5b4fc** |
| side-field ●        | Workspace field                                                                      | #ffffff | #171a20 | —           |
| side-field-line ●   | Workspace field border                                                               | #7c8493 | #737d8d | —           |
| ok                  | Success text, Live pill text                                                         | #16794d | #6ee7a7 | #16794d     |
| ok-weak             | Live pill ground                                                                     | #e7f6ee | #10291d | #e7f6ee     |
| warn                | Warning text, Provisioning pill text                                                 | #8a5f00 | #f5c451 | #8a5f00     |
| warn-weak           | Provisioning pill ground                                                             | #fbf3df | #2c2410 | #fbf3df     |
| bad                 | Error text, Failed pill text                                                         | #b42318 | #fca5a0 | #b42318     |
| bad-weak            | Failed pill ground                                                                   | #fdeceb | #331716 | #fdeceb     |
| bad-line            | Invalid input border                                                                 | #dd6152 | #e5675a | #dd6152     |
| warn-on-dark        | Warning text on a dark chip or tooltip                                               | #f5c451 | #f5c451 | #f5c451     |
| popover ●           | Menus, popups, option lists; the Dark tooltip                                        | #ffffff | #262b35 | —           |
| popover-line ●      | Menu border and dividers; the Dark tooltip edge                                      | #e5e7eb | #4a5260 | —           |
| popover-hover ●     | Hovered or highlighted menu row; checked theme item in Dark; phone Menu active row   | #eef1f6 | #323845 | —           |

### 5.2 Extras

| Token                                                                                                  | Light                    | Dark                                                  | Where                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--admin-pill-neutral`                                                                                 | #eef0f3                  | #262a33                                               | Neutral pills on the page, the sidebar and tables: Coming soon, Archived, Free (resolved, §20 item 3). Not inside a popover: that is pill-neutral-popover.                                                                                                                                                                                  |
| `--admin-pill-neutral-popover`                                                                         | #eef0f3                  | #323845                                               | The neutral pill inside any popover: the Workspace dropdown's "Archived", the phone Menu's "Coming soon" and "Archived" (`gap-shell-sh1-in-th1` `--pillneupop` L4 / D4, P1 / P2; `gap-shell-phone-menu-submenus` `.dk .pop .t-neu`, frames 1 / 3). StatusBadge's neutral tone reads it inside a popover (#6356).                            |
| `--admin-segment-on`                                                                                   | #ffffff                  | #323845                                               | The checked theme item's plate (§9.3) and the pressed preview-toolbar icon button's plate (§5.4) (`gap-shell-sh1-in-th1` and `gap-shell-phone-menu-submenus` `--segon`; `gap-theme-token-dark-values` "Already in TH1"). One element, a different TH1 token per palette (surface in Light, popover-hover in Dark), so it has its own token. |
| `--admin-on-brand-ink`                                                                                 | #ffffff                  | #0f1115                                               | A mark drawn on a brand-ink fill: the selected preset card's tick (`gap-onboarding-dark`, §6.1). Added by #6291 with the preset picker's colours.                                                                                                                                                                                           |
| `--admin-switch-thumb`                                                                                 | #ffffff                  | #e8eaef                                               | Switch thumb                                                                                                                                                                                                                                                                                                                                |
| `--admin-shadow` / `--admin-shadow-menu` (CSS vars that `--shadow-admin` and `--shadow-admin-lg` read) | the light shadows in §4  | the dark shadows in §4                                | `@theme inline` values are static, so the dark override needs a var                                                                                                                                                                                                                                                                         |
| `--admin-scrim`                                                                                        | rgba(10,12,15,.35)       | rgba(10,12,15,.35)                                    | Sheet and dialog backdrops (the Look phone sheet takes it, `gap-theme-token-dark-values` "Already in TH1"). The phone Menu has **no** scrim (shell spec, #6376).                                                                                                                                                                            |
| `--admin-theme-track`                                                                                  | #eef0f3                  | #0f1115                                               | Theme group ground; the Look preview toolbar track. Light equals side / line-2, dark equals bg; a token can alias those.                                                                                                                                                                                                                    |
| `--admin-text-strong`                                                                                  | #12141a (= text)         | #ffffff                                               | The dark-theme texts drawn pure white rather than #e8eaef: "Valstack" wordmark, active nav row text and icon (sidebar and rail).                                                                                                                                                                                                            |
| `--admin-tooltip` / `--admin-tooltip-text` / `--admin-tooltip-line`                                    | #12141a / #ffffff / none | popover #262b35 / text #e8eaef / popover-line #4a5260 | The shared Tooltip (#6370's box). Light is LB's #12141a with white text; Dark sits on the popover with a 1px popover-line edge and the dark menu shadow (`gap-shell-sh1-in-th1` D2), so it never vanishes on the #0f1115 page.                                                                                                              |

The logo gradient `#6366f1 → #a855f7` and the white "V" are the same in both
themes. The top bar is bg at 90% (`rgba(246,247,249,.9)` / `rgba(15,17,21,.9)`,
X4), not a token of its own.

### 5.3 Contrast pairs (board D2)

All 58 pairs on board D2 must pass, and so must the pairs of §5.3.1 and §5.3.2. Text pairs need 4.5:1. Control borders,
tracks and focus rings need 3:1 (WCAG 1.4.11). The guard computes them from
the token values with `renderedContrastRatio` (`packages/utils/src/color/oklch.ts`)
and fails CI on any regression. The "Tokens" column is what the guard holds;
the hex columns are the board's values it must reproduce. Where a pair's
ground differs by palette (Warn on dark chip: the tooltip ground in Light, the
card in Dark), each palette's row names its own token; #6288 adds the light
`tooltip` value with the other light extras so it can guard that pair, and
#6291 adds its dark value. `white` is the fixed white of text on a brand fill,
not a token.

Light (29):

| Pair                                | Tokens (fg on bg)                 | fg on bg           | Ratio | Threshold |
| ----------------------------------- | --------------------------------- | ------------------ | ----- | --------- |
| Text on card                        | text on surface                   | #12141a on #ffffff | 18.41 | 4.5       |
| Text on card header                 | text on surface-head              | #12141a on #eef1f6 | 16.26 | 4.5       |
| Muted on card header                | muted on surface-head             | #5b6472 on #eef1f6 | 5.28  | 4.5       |
| Muted on page                       | muted on bg                       | #5b6472 on #f6f7f9 | 5.58  | 4.5       |
| Nav text on sidebar                 | side-text on side                 | #2a303b on #eef0f3 | 11.61 | 4.5       |
| Section label on sidebar            | side-muted on side                | #5b6472 on #eef0f3 | 5.24  | 4.5       |
| Active row text                     | text-strong on side-raised        | #12141a on #ffffff | 18.41 | 4.5       |
| Link on card                        | brand-ink on surface              | #4f46e5 on #ffffff | 6.29  | 4.5       |
| White on primary                    | white (fixed) on brand            | #ffffff on #4f46e5 | 6.29  | 4.5       |
| Live pill                           | ok on ok-weak                     | #16794d on #e7f6ee | 4.85  | 4.5       |
| Provisioning pill                   | warn on warn-weak                 | #8a5f00 on #fbf3df | 5.11  | 4.5       |
| Failed pill                         | bad on bad-weak                   | #b42318 on #fdeceb | 5.75  | 4.5       |
| Archived pill                       | muted on pill-neutral             | #5b6472 on #eef0f3 | 5.24  | 4.5       |
| Plan pill                           | brand-strong on brand-weak        | #3730a3 on #eef2ff | 8.88  | 4.5       |
| Input border on card                | control-line on surface           | #878f9d on #ffffff | 3.26  | 3         |
| Input border on page                | control-line on bg                | #878f9d on #f6f7f9 | 3.04  | 3         |
| Switch off track on card            | control-line on surface           | #878f9d on #ffffff | 3.26  | 3         |
| Switch on track on card             | brand on surface                  | #4f46e5 on #ffffff | 6.29  | 3         |
| Switcher border on sidebar          | side-field-line on side           | #7c8493 on #eef0f3 | 3.30  | 3         |
| Control on card header              | control-line-tint on surface-head | #7c8493 on #eef1f6 | 3.32  | 3         |
| 2px focus ring on card              | brand-ink on surface              | #4f46e5 on #ffffff | 6.29  | 3         |
| Focus ring on sidebar               | side-accent on side               | #4f46e5 on #eef0f3 | 5.51  | 3         |
| Error text on card                  | bad on surface                    | #b42318 on #ffffff | 6.57  | 4.5       |
| Invalid border on card              | bad-line on surface               | #dd6152 on #ffffff | 3.56  | 3         |
| Warn on dark chip                   | warn-on-dark on tooltip           | #f5c451 on #12141a | 11.31 | 4.5       |
| Text on menu                        | text on popover                   | #12141a on #ffffff | 18.41 | 4.5       |
| Muted on hovered menu row           | muted on popover-hover            | #5b6472 on #eef1f6 | 5.28  | 4.5       |
| Check and focus ring on hovered row | brand-ink on popover-hover        | #4f46e5 on #eef1f6 | 5.55  | 3         |
| Theme switch border on menu         | control-line on popover           | #878f9d on #ffffff | 3.26  | 3         |

Dark (29):

| Pair                                | Tokens (fg on bg)                 | fg on bg           | Ratio | Threshold |
| ----------------------------------- | --------------------------------- | ------------------ | ----- | --------- |
| Text on card                        | text on surface                   | #e8eaef on #171a20 | 14.48 | 4.5       |
| Text on card header                 | text on surface-head              | #e8eaef on #1d2027 | 13.54 | 4.5       |
| Muted on card header                | muted on surface-head             | #a3abb8 on #1d2027 | 7.04  | 4.5       |
| Muted on page                       | muted on bg                       | #a3abb8 on #0f1115 | 8.17  | 4.5       |
| Nav text on sidebar                 | side-text on side                 | #c9cfda on #0a0c0f | 12.52 | 4.5       |
| Section label on sidebar            | side-muted on side                | #8d96a6 on #0a0c0f | 6.57  | 4.5       |
| Active row text                     | text-strong on side-raised        | #ffffff on #20242e | 15.52 | 4.5       |
| Link on card                        | brand-ink on surface              | #a5b4fc on #171a20 | 8.74  | 4.5       |
| White on primary                    | white (fixed) on brand            | #ffffff on #5850ec | 5.56  | 4.5       |
| Live pill                           | ok on ok-weak                     | #6ee7a7 on #10291d | 10.06 | 4.5       |
| Provisioning pill                   | warn on warn-weak                 | #f5c451 on #2c2410 | 9.44  | 4.5       |
| Failed pill                         | bad on bad-weak                   | #fca5a0 on #331716 | 8.65  | 4.5       |
| Archived pill                       | muted on pill-neutral             | #a3abb8 on #262a33 | 6.21  | 4.5       |
| Plan pill                           | brand-strong on brand-weak        | #c7cdfd on #23244a | 9.54  | 4.5       |
| Input border on card                | control-line on surface           | #737d8d on #171a20 | 4.19  | 3         |
| Input border on page                | control-line on bg                | #737d8d on #0f1115 | 4.54  | 3         |
| Switch off track on card            | control-line on surface           | #737d8d on #171a20 | 4.19  | 3         |
| Switch on track on card             | brand on surface                  | #5850ec on #171a20 | 3.13  | 3         |
| Switcher border on sidebar          | side-field-line on side           | #737d8d on #0a0c0f | 4.71  | 3         |
| Control on card header              | control-line-tint on surface-head | #737d8d on #1d2027 | 3.92  | 3         |
| 2px focus ring on card              | brand-ink on surface              | #a5b4fc on #171a20 | 8.74  | 3         |
| Focus ring on sidebar               | side-accent on side               | #a5b4fc on #0a0c0f | 9.82  | 3         |
| Error text on card                  | bad on surface                    | #fca5a0 on #171a20 | 9.15  | 4.5       |
| Invalid border on card              | bad-line on surface               | #e5675a on #171a20 | 5.33  | 3         |
| Warn on dark on card                | warn-on-dark on surface           | #f5c451 on #171a20 | 10.70 | 4.5       |
| Text on menu                        | text on popover                   | #e8eaef on #262b35 | 11.79 | 4.5       |
| Muted on hovered menu row           | muted on popover-hover            | #a3abb8 on #323845 | 5.08  | 4.5       |
| Check and focus ring on hovered row | brand-ink on popover-hover        | #a5b4fc on #323845 | 5.89  | 3         |
| Theme switch border on menu         | control-line on popover           | #737d8d on #262b35 | 3.41  | 3         |

Why the dark menus changed: #262b35 is 1.33:1 on the page, 1.38:1 on the
sidebar and 1.23:1 on a card, and its #4a5260 border is 2.40:1 on the page.
The earlier #1d2027 fill with a #2b303a border matched the card header and its
own hovered row (1.00:1), so menus and hover went flat.

#### 5.3.1 Shell pairs (`gap-shell-account-states`, `gap-shell-phone-menu-submenus`)

Pairs the shell boards measure that D2 does not hold. They use the tokens
above and are guarded with the D2 pairs: Light by #6288, Dark by #6291 (8 per
palette). Board pairs that repeat a D2 pair are not listed again: email at
rest = Section label on sidebar; avatar initial = White on primary; muted on
the highlighted row = Muted on hovered menu row; highlight ring on the
highlighted segment = Check and focus ring on hovered row; Theme group border
on the popover = Theme switch border on menu.

| Pair                                       | Tokens (fg on bg)             | Light | Dark  | Threshold |
| ------------------------------------------ | ----------------------------- | ----- | ----- | --------- |
| Name on hovered account trigger            | text-strong on side-raised    | 18.41 | 15.52 | 4.5       |
| Email on hovered account trigger           | side-muted on side-raised     | 5.98  | 5.21  | 4.5       |
| Muted on menu (role line, domain, email)   | muted on popover              | 5.98  | 6.13  | 4.5       |
| Row text on highlighted row                | text on popover-hover         | 16.26 | 9.76  | 4.5       |
| Current bar on menu                        | brand-ink on popover          | 6.29  | 7.12  | 3         |
| Pinned trigger border on menu (phone Menu) | side-field-line on popover    | 3.76  | 3.41  | 3         |
| Name on account trigger at rest            | text-strong on side           | 16.12 | 19.58 | 4.5       |
| Neutral pill in a menu                     | muted on pill-neutral-popover | 5.24  | 5.08  | 4.5       |

`gap-shell-account-states` frame 2 ("Light · text contrast") measures the name
at rest, 16.12; no D2 pair holds text-strong on side, so it is guarded here.
The Dark value is computed from the tokens. The neutral pill in a menu is a
token pair of its own because pill-neutral-popover is its own token.

The muted email on side-line #d9dde4 would be 4.39:1, which is why the trigger
hovers to side-raised, not side-line (§7.4).

#### 5.3.2 Onboarding pair (`gap-onboarding-dark`)

| Pair                 | Tokens (fg on bg)         | Light | Dark | Threshold |
| -------------------- | ------------------------- | ----- | ---- | --------- |
| Selected preset tick | on-brand-ink on brand-ink | 6.29  | 9.48 | 3         |

Guarded by #6291, which adds on-brand-ink and adopts it (§6.1), in both
palettes.

### 5.4 Tokens other sets add: their dark values

`gap-theme-token-dark-values` gives every colour and shadow token that
#6381 and #6403 add a Dark value, drawn the way D2 draws the
palette. Those tickets add the light values (and the token names); #6291 adds
the dark values below with the rest of the dark palette. #6321 adds no
colour after narrowing (the device frame owns its dots).

| Token (`--admin-`)  | Light               | Dark                                                       | Added by | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------- | ---------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hover               | #e2e5ea             | #22262f                                                    | #6381    | Hover ground of the preview toolbar's icon buttons, the solo toolbar buttons (Follow, Full screen) and the link buttons on a card or card header (the dashboard's `.lbtn`, the Domain card's DNS link; `gap-dash-band-820` and `gap-dash-notices` draw #e3e7ee, mapped here, §3.1). A ground shift, not a boundary (1.11:1 on the track); the icon or label carries the state. The Voice chip's hover ground is **surface-2** (#fbfbfd / #1b1e25), not this token       |
| brand-hover         | #3730a3             | #6159ee                                                    | #6403    | Decided 31 Oct (§20 item 3): the active Voice chip hover. Light is #3730a3 on every board; the Voice boards' #4338ca is void (§3.1). D6 set brand-strong, which is #c7cdfd in Dark (white on it 1.55:1); brand-hover passes 5.03:1.                                                                                                                                                                                                                                     |
| brand-line          | #c7d2fe             | #343a78                                                    | #6403    | Two roles: the V3a note border, and the **fill of the disabled and saving Save button**, whose label is brand-strong (#3730a3 on #c7d2fe 6.66 / #c7cdfd on #343a78 6.71; exempt as disabled). A note-line / brand-line merge keeps the Save fill's value                                                                                                                                                                                                                |
| note-line           | rgba(79,70,229,.3)  | rgba(165,180,252,.3)                                       | #6381    | G2 note border. On brand-weak it renders #bebef7, 1.18:1 from brand-line: whichever of #6381 / #6403 lands second runs CLAUDE.md "Reuse before you create" and merges them only if every role is the same: brand-line also fills the disabled Save button, so a merge into note-line's translucent value would change that button. #6291 then sets the dark value of the survivor.                                                                                      |
| control-line-locked | #c5cad3             | #424956                                                    | #6381    | Locked control border (exempt from 1.4.11)                                                                                                                                                                                                                                                                                                                                                                                                                              |
| frame-dot           | #d5d9e0             | #3a404b                                                    | #6381    | Device-frame bar dots                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| frame-track         | rgba(18,20,26,.08)  | rgba(232,234,239,.14)                                      | #6381    | Follows the **preview** colour scheme the preview toolbar sets, not the admin theme (it sits on the sample site)                                                                                                                                                                                                                                                                                                                                                        |
| frame-thumb         | #5b6472             | #a3abb8                                                    | #6381    | Same: follows the preview scheme                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| fade-end            | rgba(246,247,249,0) | rgba(15,17,21,0)                                           | #6381    | Must be the page ground at zero alpha in each theme, or the fade turns grey in Dark. Only for a fade over bg; see "Fades" below for the other grounds                                                                                                                                                                                                                                                                                                                   |
| preview-stage       | #eef0f3             | #1d2027 (proposal, drawn on `gap-theme-token-dark-values`) | #6381    | The shared preview's stage ground (Look spec §12.3, onboarding spec P7), no border in either theme. No board draws the Dark stage: `gap-onboarding-dark`'s surface-head #1d2027 ground and #2b303a border are that board's provisional backdrop (onboarding spec §11.5). A "Stage" specimen is added to `gap-theme-token-dark-values` before #6291 is filed; the proposal it confirms or replaces is #1d2027. The light value is added to #6381's token list with #6314 |

Board values the colour rule maps onto an existing TH1 token, so they take its
dark value and add no token: toolbar track #eef0f3 → theme-track; popover
border #d0d4db → popover-line; popover shadow → menu shadow; sheet scrim
rgba(18,20,26,.45) → `--admin-scrim`; control borders #818a99 →
control-line.

Preview toolbar states (`gap-theme-token-dark-values` Specimens, "Preview
toolbar"). #6382 / #6390 build them on these tokens; #6291 makes
the Dark column true:

| State                       | Value                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group                       | theme-track #eef0f3 / #0f1115 ground, 1px control-line #878f9d / #737d8d border                                                                    |
| Icon button, rest           | transparent; icon muted #5b6472 / #a3abb8                                                                                                          |
| Icon button, hover          | ground hover #e2e5ea / #22262f; icon text #12141a / #e8eaef                                                                                        |
| Icon button, pressed        | plate surface #ffffff in Light, popover-hover #323845 in Dark; inset 1.5px brand-ink ring (#4f46e5 / #a5b4fc); icon brand-strong #3730a3 / #c7cdfd |
| Icon button, focus-visible  | 2px brand-ink outline at offset 2 (the §4 ring with a theme-track gap); ground and icon as at rest                                                 |
| Solo button, rest and hover | 1px control-line border; hover ground hover #e2e5ea / #22262f; icon text                                                                           |
| Solo button, pressed        | ground brand-weak #eef2ff / #23244a; 1px brand-ink border plus an inset 1px brand-ink ring; icon brand-strong #3730a3 / #c7cdfd                    |

The pressed icon button's plate is **segment-on** (#ffffff / #323845, §5.2), the
token the checked theme item uses; never surface, which would stay #171a20 in
Dark.

**Preview stage and device frame** (`gap-theme-token-dark-values` "Device
frame"; §3.1). #6390 builds them on these tokens; #6291 makes the Dark
column true:

| Element                     | Value                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage                       | preview-stage #eef0f3 / #1d2027 ground, radius 6, no border                                                                                                                                                                                                   |
| Frame border                | 1px control-line #878f9d / #737d8d                                                                                                                                                                                                                            |
| Bezel and browser bar       | surface #ffffff / #171a20; the bar's bottom rule line #e5e7eb / #2b303a                                                                                                                                                                                       |
| Bar dots                    | frame-dot #d5d9e0 / #3a404b                                                                                                                                                                                                                                   |
| Host text in the bar        | muted #5b6472 / #a3abb8                                                                                                                                                                                                                                       |
| Readouts beside the toolbar | on the preview column's ground bg #f6f7f9 / #0f1115: the onboarding address text #12141a / #e8eaef with a muted globe (onboarding spec P6); the size readout muted #5b6472 / #a3abb8. `gap-onboarding-dark` draws every readout muted; the address follows P6 |
| Scrollbar                   | frame-track and frame-thumb, following the preview scheme                                                                                                                                                                                                     |

**Other specimens** (`gap-theme-token-dark-values` Specimens):

| Specimen                      | Value                                                                                                                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locked control, group         | ground **bg** #f6f7f9 / #0f1115 (not theme-track), 1px control-line-locked #c5cad3 / #424956 border                                                                                                                  |
| Locked control, pressed item  | ground surface #ffffff / #171a20 with an inset 1px control-line #878f9d / #737d8d ring; label text #12141a / #e8eaef                                                                                                 |
| Locked control, plan line     | "Growth plan" muted #5b6472 / #a3abb8                                                                                                                                                                                |
| G2 note                       | border note-line; title brand-strong #3730a3 / #c7cdfd; body text #12141a / #e8eaef; divider note-line                                                                                                               |
| Disabled and saving Save      | fill brand-line #c7d2fe / #343a78, label brand-strong #3730a3 / #c7cdfd                                                                                                                                              |
| Phone index chips             | active: brand #4f46e5 / #5850ec ground, white (fixed) label; the rest: surface #ffffff / #171a20 ground, 1px control-line #878f9d / #737d8d border, text label; a 48px fade to fade-end at the cut edge              |
| Voice chip, rest              | ground surface #ffffff / #171a20; 1px control-line #878f9d / #737d8d border; label text #12141a / #e8eaef 13px / 600; count muted #5b6472 / #a3abb8 12px / 500                                                       |
| Voice chip, hover             | ground surface-2 #fbfbfd / #1b1e25; border, label and count unchanged (only the ground moves)                                                                                                                        |
| Voice chip, active            | fill and 1px border both brand #4f46e5 / #5850ec; label and count white (fixed)                                                                                                                                      |
| Voice chip, active hover      | fill and border both brand-hover #3730a3 / #6159ee; label and count white (fixed). Open with §20 item 3: if it is no, no brand-hover state is built                                                                  |
| Voice chip, active with error | the count gives way to a pill 20px tall, radius 999, padding 0 6px, gap 4, on surface #ffffff / #171a20, holding a 12px bad #b42318 / #fca5a0 error-circle icon at stroke 2.5 and a bad 12px / 600 label ("1 error") |

The Voice chip rows are `gap-theme-token-dark-values` "Voice chip bar · chip tones" (Light and Dark columns). Chip metrics (32 tall, padding 0 12px, radius 999, gap 8) and the error flow are the Voice set's (#6422); this doc gives their colours, and #6291 makes the Dark column true.

**Fades.** Every fade runs from the ground it covers to that same ground token
at zero alpha, never to a literal white or grey, so Dark draws no white or grey
haze:

| Fade                                                                                                                                                                                            | From → to (Light; Dark)                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Over the page: the Look phone index, the Look tabbed index (Look spec §7)                                                                                                                       | bg → fade-end (#f6f7f9 → rgba(246,247,249,0); #0f1115 → rgba(15,17,21,0))                           |
| Voice chip bar (`gap-voice-820` `.fd.fl/.fr`, `gap-voice-phone-footer-states`, `gap-voice-phone-chipbar-unpinned` pinned frame); Look desktop index (`gap-look-mid-widths` A and C, `.jn-fade`) | surface → surface at zero alpha (#ffffff → rgba(255,255,255,0); #171a20 → rgba(23,26,32,0))         |
| Voice phone language track (`gap-voice-phone-head` frame 2)                                                                                                                                     | theme-track → theme-track at zero alpha (#eef0f3 → rgba(238,240,243,0); #0f1115 → rgba(15,17,21,0)) |

No token is added per ground: the fade is written from the ground token and
that token at zero alpha. #6291 checks each in Dark.

**Alerts.** An Alert's border is its tone token at 30%, as `alert-variants.ts`
draws it today (`border-admin-warn/30`), never a literal: warn rgba(138,95,0,.3)
/ rgba(245,196,81,.3) on warn-weak #fbf3df / #2c2410; bad rgba(180,35,24,.3) /
rgba(252,165,160,.3) on bad-weak #fdeceb / #331716; ok rgba(22,121,77,.3) /
rgba(110,231,167,.3) on ok-weak. Boards: `gap-dash-notices` A and B,
`gap-voice-notices` A, B, C1 and C2. No token is added; a caller that writes
the rgba literal is the defect. Decorative edges, no minimum (the fill carries
the boundary).

Shadows (`--shadow-admin-<name>`; same offsets and blur in Dark, black at a
higher alpha):

| Name    | Light                            | Dark                          | Added by |
| ------- | -------------------------------- | ----------------------------- | -------- |
| frame   | `0 6px 20px rgba(16,24,40,.10)`  | `0 6px 20px rgba(0,0,0,.45)`  | #6381    |
| sheet   | `0 -8px 24px rgba(16,24,40,.18)` | `0 -8px 24px rgba(0,0,0,.55)` | #6381    |
| index   | `0 1px 2px rgba(16,24,40,.05)`   | `0 1px 2px rgba(0,0,0,.4)`    | #6381    |
| unsaved | `0 -4px 12px rgba(16,24,40,.08)` | `0 -4px 12px rgba(0,0,0,.45)` | #6381    |
| bar     | `0 2px 8px rgba(16,24,40,.08)`   | `0 2px 8px rgba(0,0,0,.45)`   | #6403    |
| dock    | `0 -2px 8px rgba(16,24,40,.06)`  | `0 -2px 8px rgba(0,0,0,.4)`   | #6403    |
| xs      | `0 1px 2px rgba(16,24,40,.08)`   | `0 1px 2px rgba(0,0,0,.4)`    | #6403    |
| tip     | `0 4px 12px rgba(16,24,40,.18)`  | `0 4px 12px rgba(0,0,0,.55)`  | #6403    |

Key pairs the guard adds with #6291, 17 per palette (the board's 22 minus the
two exempt disabled pairs and the three "no minimum" pairs: note border, frame
dot on bar, thumb on frame track):

| Pair                         | Tokens, Light (fg on bg)     | Tokens, Dark (fg on bg)      | Light | Dark  | Threshold |
| ---------------------------- | ---------------------------- | ---------------------------- | ----- | ----- | --------- |
| Hovered icon on hover        | text on hover                | text on hover                | 14.58 | 12.58 | 3         |
| Rest icon on toolbar track   | muted on theme-track         | muted on theme-track         | 5.24  | 8.17  | 3         |
| Rest icon on hover           | muted on hover               | muted on hover               | 4.74  | 6.55  | 3         |
| Pressed icon on plate        | brand-strong on segment-on   | brand-strong on segment-on   | 9.93  | 7.60  | 3         |
| Pressed ring                 | brand-ink on theme-track     | brand-ink on popover-hover   | 5.51  | 5.89  | 3         |
| Toolbar track border on card | control-line on surface      | control-line on surface      | 3.26  | 4.19  | 3         |
| Solo pressed icon            | brand-strong on brand-weak   | brand-strong on brand-weak   | 8.88  | 9.54  | 3         |
| Chip text on chip            | text on surface              | text on surface              | 18.41 | 14.48 | 4.5       |
| Chip count on chip           | muted on surface             | muted on surface             | 5.98  | 7.53  | 4.5       |
| Chip text on chip hover      | text on surface-2            | text on surface-2            | 17.81 | 13.86 | 4.5       |
| Chip border on page          | control-line on bg           | control-line on bg           | 3.04  | 4.54  | 3         |
| White on active chip         | white (fixed) on brand       | white (fixed) on brand       | 6.29  | 5.56  | 4.5       |
| White on active chip hover   | white (fixed) on brand-hover | white (fixed) on brand-hover | 9.93  | 5.03  | 4.5       |
| Active chip hover on page    | brand-hover on bg            | brand-hover on bg            | 9.27  | 3.75  | 3         |
| Error pill on active chip    | bad on surface               | bad on surface               | 6.57  | 9.15  | 4.5       |
| Locked text on page          | muted on bg                  | muted on bg                  | 5.58  | 8.17  | 4.5       |
| Focus ring on toolbar track  | brand-ink on theme-track     | brand-ink on theme-track     | 5.51  | 9.48  | 3         |

The pressed plate is segment-on in both palettes. The pressed ring keeps the
board's grounds (theme-track in Light, popover-hover in Dark), so that pair
names a different ground token per palette; the guard holds one token pair per
palette. The two brand-hover pairs exist
only if §20 item 3 is answered yes; if it is no, they are dropped and the
count is 15 per palette.

## 6. Theme mechanism

| Item               | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Values             | `LIGHT`, `DARK`, `SYSTEM`. A key/value const read only by `apps/platform` → `apps/platform/src/constants/theme.ts` (move to `@blog/config` the day `@blog/studio` or another workspace reads it).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Default            | `SYSTEM` for a viewer with no stored choice.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Storage            | Decided 31 Oct (§20 item 1): a per-device cookie, modelled on `utils/sidebar-collapsed-cookie/sidebar-collapsed-cookie.ts` and `server/layout/resolve-is-sidebar-collapsed.ts`. No `@blog/db` ticket.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Server render      | `app/[locale]/layout.tsx` reads the preference and sets `data-theme="light"`, `data-theme="dark"` or no attribute (System) on `<html>`, so the first paint has the right tokens. No flash on load, including a hard reload in Dark.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| CSS                | `:root` holds the light values. `:root[data-theme="dark"]` holds the dark values. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` holds the dark values again for System. `color-scheme: light` / `dark` follows, so native scrollbars and form controls match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| System             | Follows `prefers-color-scheme` live: changing the OS setting while the page is open switches the admin without a reload.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Scope              | The whole admin, sign-in and onboarding pages included. The onboarding rail and phone step header stay #0f1115 with their W2 colours in both themes (`gap-onboarding-dark`); the onboarding main column becomes surface #171a20 and its preview column bg #0f1115 with a line #2b303a between them. Never the tenant site preview: `site-preview/` and the Look / Voice / onboarding preview frames render the tenant's tokens and keep their own Light/Dark preview toggle (`usePreviewColorScheme`), independent of the admin theme; frame-track and frame-thumb follow that preview scheme (§5.4).                                                                                                                                                                                                                                             |
| Toasts             | The toast ground stays dark in both themes: today it is `bg-admin-text`, which would turn #e8eaef in Dark, so #6291 moves it to tooltip (#12141a / #262b35); its white text keeps its contrast (18.41 / 14.20). Its dismiss button's focus ring is the §4 geometry with a toast-ground gap and a white (fixed) ring.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Tooltip            | Light #12141a with white text; Dark on popover #262b35, 1px popover-line #4a5260 edge, dark menu shadow, text #e8eaef (§5.2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Hard-coded colours | These paint fixed white or dark values and are checked in Dark; any that becomes illegible or loses its edge moves to tokens in #6291: `shared/step-indicator` (the onboarding segmented stepper), `shared/avatar/avatar-variants.ts`, `features/email/email-preview/components/email-template-preview/` (its email body stays white: it previews an email), `shared/hue-slider`, `shared/preset-picker` (colours in §6.1), `shared/toast` (ground, above), `features/layout/dashboard-tenant-picker` (the Choose a workspace page on the onboarding rail). Pages also checked in Dark: sign-in, every onboarding step, Choose a workspace, Overview (owner home), Leads, and the dead-end pages (not found, no access). The preset thumbnails, the hue track and the sample site are content and keep their own colours (`gap-onboarding-dark`). |

### 6.1 Onboarding in Dark (`gap-onboarding-dark`, 1440 and 390)

Every colour the board draws besides the rail, by token. #6291 builds the
preset picker's (it owns `shared/preset-picker`'s hard-coded colours); the rest
follows from the tokens.

| Element                                   | Colour                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Main column, preview column               | surface #ffffff / #171a20; bg #f6f7f9 / #0f1115; a 1px line #e5e7eb / #2b303a between them                                              |
| Text, hints                               | text #12141a / #e8eaef; muted #5b6472 / #a3abb8                                                                                         |
| Continue                                  | brand #4f46e5 / #5850ec, white (fixed) label                                                                                            |
| Back, radio rings                         | 1px control-line #878f9d / #737d8d                                                                                                      |
| Card and swatch borders                   | line #e5e7eb / #2b303a                                                                                                                  |
| Footer rule                               | line-2 #eef0f3 / #232730                                                                                                                |
| Preset card, selected                     | 1.5px **brand-ink** #4f46e5 / #a5b4fc border (today brand, which would be #5850ec in Dark) with a 3px brand-weak #eef2ff / #23244a halo |
| Preset card check, selected               | dot brand-ink #4f46e5 / #a5b4fc, tick on-brand-ink #ffffff / #0f1115 (§5.3.2)                                                           |
| Address and size readouts                 | §5.4 "Preview stage and device frame"                                                                                                   |
| Preset thumbnails, hue track, sample site | content: their own colours in both themes                                                                                               |

## 7. Sidebar colours

Structure, widths, rows, landmarks (`aside "Sidebar"`, one `nav` per section,
X11), the brand row and the nav scroll are the shell spec's. This section gives
each element its colour. "Built by" names the ticket that applies it.

| Element                                 | Colour                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Built by                                                                                                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar ground and right border         | side #eef0f3 / #0a0c0f; 1px side-line #d9dde4 / #1c1f26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | #6288 (tokens)                                                                                                                                                                                                         |
| Brand row rule                          | side-line                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | #6288                                                                                                                                                                                                                  |
| "Valstack"                              | **text-strong** #12141a / #ffffff (today `text-white`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | #6288 (rides with the tokens: white on the grey side would be illegible)                                                                                                                                               |
| "admin"                                 | side-muted #5b6472 / #8d96a6 (today faint)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | #6288                                                                                                                                                                                                                  |
| Section labels                          | side-muted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | #6288                                                                                                                                                                                                                  |
| Row at rest                             | text side-text #2a303b / #c9cfda; icon side-muted (a colour, not an opacity)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | #6341                                                                                                                                                                                                                  |
| Row hover                               | ground side-line #d9dde4 / #1c1f26 (`gap-shell-sh1-in-th1` L1/D1 "Look is hovered"), expanded and rail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | #6341                                                                                                                                                                                                                  |
| Row active                              | `aria-current="page"`; ground side-raised #ffffff / #20242e; raised shadow in Light, **none** in Dark (not `gap-shell-sh1-in-th1` D1 / D2's shadow, §3.1); text and icon **text-strong** #12141a / #ffffff, 600. **Active bar**: absolute, left 0, inset 8px top and bottom (SH1's row padding; TH1 draws 7 on its 34px row), width 3, radius 0 2px 2px 0, side-accent #4f46e5 / #a5b4fc. The same plate and bar on the collapsed rail.                                                                                                                                                                | #6341                                                                                                                                                                                                                  |
| Row focus                               | transparent ground, ring `0 0 0 2px side, 0 0 0 4px side-accent`; text and icon keep their rest colours (side-text, side-muted icon), expanded and on the rail (TH1 S4; §3.1)                                                                                                                                                                                                                                                                                                                                                                                                                          | #6337 (helper), #6341 (rows)                                                                                                                                                                                           |
| Pills                                   | "{count} new" brand-ink on brand-weak (#4f46e5 on #eef2ff / #a5b4fc on #23244a); "Coming soon" muted on pill-neutral (#5b6472 on #eef0f3 / #a3abb8 on #262a33). The Studio row's access state is #6362's line under the label (X10), not the "Ready" pill `gap-shell-sh1-in-th1` copies from SH1                                                                                                                                                                                                                                                                                                       | #6288 (the `pill-neutral` and `pill-neutral-popover` tokens); #6356 (StatusBadge: `brand` tone text → brand-ink, neutral pills read pill-neutral, and pill-neutral-popover inside a popover; metrics) — resolutions §2 |
| Rail rows                               | same colours; Coming soon rows on the rail at opacity .5 (`gap-shell-sh1-in-th1` L2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | #6341, shell                                                                                                                                                                                                           |
| Studio row status (line and rail badge) | Built by the dashboard set on these tokens. Tones warn #8a5f00 / #f5c451 (INVITE_SENT), **brand-ink** #4f46e5 / #a5b4fc (ACTIVATING), bad #b42318 / #fca5a0 (STALLED). The ACTIVATING tone names brand-ink, never brand: brand is the same hex in Light but #5850ec in Dark, 2.96:1 on side-line. Badge ground side / side-line / side-raised (#eef0f3 / #d9dde4 / #ffffff; #0a0c0f / #1c1f26 / #20242e). Line text side-text. Dark ratios on the three grounds: warn 12.03 / 10.13 / 9.53, brand-ink 9.82 / 8.27 / 7.78, bad 10.28 / 8.66 / 8.15. DB3's dark tones (#fbbf24, #f87171) are void (§3.1) | #6362, #6363 (tokens); Dark values arrive with #6291; checked in Dark by #6369                                                                                                                                         |

The "{count} new" pill uses the `brand` StatusBadge tone, which today is
`text-admin-brand`. That tone's text becomes **brand-ink**; its ground stays
brand-weak. In Dark, brand #5850ec on #23244a would not match S3. The
StatusBadge primitive is #6356's (resolutions §2, pill half of NEW-TH1-2
dropped); #6288 adds only the `pill-neutral` token.

#### Undrawn row states (#6342)

None of these is drawn, apart from L2's inert rail rows. #6342 is the
sole owner of the sidebar's and the rail's inert rows (resolutions §2;
#6364 keeps the undotted Coming soon pill and the phone Menu's inert
rows, and depends on #6342). #6288 has already moved the reason line and
the note from faint to side-muted; #6342 sets their size and wrapping.
They take the shell's
row metrics and the colours below, which are the values the board
`gap-theme-sidebar-row-states` must draw (Light and Dark, 1440 expanded and
1280 collapsed, and the superadmin tenant groups at 1040) before #6342 is
filed. That board is not yet in resolutions §6 and is added there with this
doc.

| State                                        | Today                                                           | TH1                                                                                                                                                                                                               |
| -------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inert row (no href, with a `disabledReason`) | `span`, side-text; reason line in faint; on the rail opacity .5 | `span`, side-text, icon side-muted, no hover ground, `aria-disabled="true"`; reason line under the label 12px / 16 side-muted (#5b6472 / #8d96a6), wrapping; on the rail opacity .5, as SH1 draws inert rail rows |
| Section note (a group with no items)         | 12px faint                                                      | 12px / 16 side-muted, wraps                                                                                                                                                                                       |
| Plan-gated rows on Free                      | hidden                                                          | hidden (unchanged)                                                                                                                                                                                                |

The Studio row's access state is #6362's status line (X10), not a pill.

#### Tenant detail sidebar (superadmin; #6342)

Not drawn. A superadmin on `/tenants/<id>/…` (the page behind S11 / S12) sees
the tenant's own rows under a group label "Tenant · {tenantName}", and a group
"Platform actions" with Provisioning and Danger zone, each with a neutral
"platform" pill.

| Element                   | TH1                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Tenant · {tenantName}"   | the section-label colour (side-muted); one line, ellipsis, `title` = full text ("Tenant · The Long-Running Kitchen Table Recipes Collective of Greater Manchester") |
| Provisioning, Danger zone | the row colours above; icons as today                                                                                                                               |
| "platform" pill           | neutral pill: muted on pill-neutral (#5b6472 on #eef0f3 / #a3abb8 on #262a33), through StatusBadge's neutral tone once #6356 has moved it to pill-neutral           |

### 7.3 Workspace field (#6335; its `text-white` goes in #6288)

Structure is SH1 F7 (X8): 22px initials, name over domain, one down chevron,
no "Workspace" label, no check. Colours:

| Element   | Colour                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field     | ground side-field #ffffff / #171a20; 1px side-field-line #7c8493 / #737d8d border; raised shadow (Light / Dark)                                                                                                                                                                                                                                                                                                     |
| Open      | border side-accent #4f46e5 / #a5b4fc; ground and shadow unchanged                                                                                                                                                                                                                                                                                                                                                   |
| Focus     | the §4 ring with a side gap, replacing the raised shadow (S4)                                                                                                                                                                                                                                                                                                                                                       |
| Initials  | ground brand-weak, letters brand-strong (#eef2ff / #3730a3; #23244a / #c7cdfd), 11px / 700 (today side-raised / side-text)                                                                                                                                                                                                                                                                                          |
| Name      | text #12141a / #e8eaef                                                                                                                                                                                                                                                                                                                                                                                              |
| Domain    | JetBrains Mono 11px / 500 (`--font-admin-mono`; today Tailwind `font-mono`), muted #5b6472 / #a3abb8 (today faint)                                                                                                                                                                                                                                                                                                  |
| Chevron   | muted                                                                                                                                                                                                                                                                                                                                                                                                               |
| Long name | name and domain each on one line, cut with an ellipsis (shell §6.3); the field carries `title` = the active workspace's full name, so a cut name can be read on hover (S4 "Keyboard focus and long name": `title="The Long-Running Kitchen Table Recipes Collective"`; D1, S2 and S3 draw `title="Field Notes"`). The `title` is #6335's, in `tenant-switcher.tsx`; the shell spec pins the ellipsis but no `title` |

### 7.4 Account trigger (colours for #6375)

Structure, size and content are SH1's (name and email on the trigger, 52px,
radius 6; 52 × 52 on the rail). Colours, from TH1 and `gap-shell-account-states`:

| State               | Colour                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foot                | 1px side-line top rule                                                                                                                                                                                              |
| Rest                | 1px side-line #d9dde4 / #1c1f26 border, transparent ground                                                                                                                                                          |
| Hover               | ground side-raised #ffffff / #20242e; border, text and chevron unchanged (D15). Not side-line: the muted email on it is 4.39:1                                                                                      |
| Open                | 1px control-line-tint #7c8493 / #737d8d border on side-raised (not `gap-shell-sh1-in-th1` L3 / D3's side-accent, §3.1)                                                                                              |
| Avatar              | brand #4f46e5 / #5850ec ground, white initials                                                                                                                                                                      |
| Name                | **text-strong** #12141a / #ffffff, 600, at rest, on hover and open (TH1 S1; `gap-shell-account-states` 1 and 3, §3.1)                                                                                               |
| Email-only account  | one line: the email on the name line, 13px / 600 **text-strong** #12141a / #ffffff (not side-muted), at rest, on hover and open; no second line (`gap-shell-account-states` 1 "Email-only · rest" / "hover", and 2) |
| Email               | **side-muted** #5b6472 / #8d96a6 (TH1 S1's role line, `gap-shell-account-states`): 5.24 / 6.57 at rest, 5.98 / 5.21 on hover                                                                                        |
| Chevron             | side-muted #5b6472 / #8d96a6, at rest, on hover and open                                                                                                                                                            |
| Collapsed (52 × 52) | the same rest and hover colours; hover shows only the native `title` (no custom tooltip on the account button)                                                                                                      |

## 8. Workspace dropdown colours (for #6379)

Structure is SH1 F7 (X8): a list of name over domain with a neutral Archived
badge, named by its trigger; rows 44px below `md` (D11); long names wrap (D10).

| Element                 | Colour                                                                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup                   | popover #ffffff / #262b35, 1px popover-line #e5e7eb / #4a5260, menu shadow (X7)                                                                                                                                                                           |
| Highlighted / hovered   | popover-hover #eef1f6 / #323845, no ring (Base UI `data-highlighted`; resolved §20 item 15)                                                                                                                                                               |
| Name / domain           | text; domain Mono 11 muted (today `itemDomain` is faint)                                                                                                                                                                                                  |
| Archived badge          | muted on **pill-neutral-popover** #eef0f3 / #323845 (#5b6472 / #a3abb8 text; 5.24 / 5.08, §5.3.1)                                                                                                                                                         |
| Current workspace       | **proposal** in `gap-shell-phone-menu-submenus`: a 3px **brand-ink** #4f46e5 / #a5b4fc bar and 600 name, no plate (§3.1: the board labels it side-accent, but it sits on the popover). It is the shell's (SH1 D2 / X8); this doc gives it its colour only |
| Current and highlighted | the bar on the popover-hover #eef1f6 / #323845 plate, name 600 ("Current and highlighted — bar on the plate")                                                                                                                                             |

## 9. Account menu and theme switch

### 9.1 Popup (#6375 builds; colours here)

Geometry is SH1 F6 / F9: opens 6px above the trigger, the trigger's width
(240 in the 264 sidebar), radius 6 on every corner, padding 4, items 44px,
6px 8px, gap 10, 13px / 500; on the rail it opens to the right, 8px gap,
bottom-aligned, fixed 240 wide. Colours: popover ground, 1px popover-line
border, menu shadow; dividers popover-line.

### 9.2 Header (SH1; colours here)

Name 13px / 600 text (#12141a / #e8eaef), email 12px muted, role line
"Owner · Field Notes" 12px muted, a popover-line rule below. An email-only
account shows the email once on the name line and the avatar "S"
(`gap-shell-account-states` frame 2); the Theme section below is unchanged.

### 9.3 Theme section (#6345 block, #6346 adopts)

Sits between the header and Sign out (`gap-shell-sh1-in-th1` L3 / D3). The
same metrics hold in the phone account menu, apart from the 44 item height:
`gap-shell-phone-menu-submenus` 2 / 4 draw other padding and equal-width
segments, which §3.1 settles for these.

| Element     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Section     | column, gap 8, padding 8px 8px 10px, 1px popover-line rule below, margin-bottom 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Label       | "Theme", 11px / 14, 700, 0.09em, uppercase, muted #5b6472 / #a3abb8. It labels the group (`Menu.GroupLabel`; the group is `aria-labelledby` it).                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Group       | `role="group"` labelled by "Theme" and `aria-describedby` → the hint. flex, gap 3, padding 3, 1px control-line border (#878f9d / #737d8d), radius 4, ground theme-track #eef0f3 / #0f1115                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Items       | three `menuitemradio` with `aria-checked`, in the order Light, Dark, System. `flex: 1 1 auto`, min-width 0, **min-height 32 desktop / 44 phone**, inline-flex centred, gap 5, padding 5px 4px, border 0, radius 4, nowrap. 14px icon (sun, moon, monitor) + label 12.5px. The segments size to their labels so all three fit the 240 popup.                                                                                                                                                                                                                                                                            |
| Unchecked   | transparent, text muted, 500, icon muted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Checked     | ground **segment-on** #ffffff / #323845 (§5.2), label and icon text #12141a / #e8eaef, 600, raised shadow (Light / Dark)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Hint        | "System follows your device setting.", 12px / 16, muted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Highlighted | Base UI `data-highlighted`, reached by arrow keys **or** the pointer (one state, §3.1): ground popover-hover #eef1f6 / #323845; an **inset** 2px brand-ink ring (`box-shadow: inset 0 0 0 2px`, #4f46e5 / #a5b4fc) with no gap; label and icon **text** #12141a / #e8eaef, weight unchanged (500). The checked item keeps its raised plate and is never given the ring. The §4 outer ring is not used here: a segment sits 3px from its neighbour, and a ring reaching 4px outside it would cover that neighbour (`gap-shell-phone-menu-submenus` 2 and 4; TH1 pair "Check and focus ring on hovered row" 5.55 / 5.89) |
| Behaviour   | Choosing an item applies the theme at once, without closing the menu and without a reload; the check moves. Arrow keys move between the three (menu radio behaviour); Enter / Space choose.                                                                                                                                                                                                                                                                                                                                                                                                                            |

Drawn checked states: System (D1, `gap-shell-sh1-in-th1` L3/D3,
`gap-shell-account-states` frame 2 Light), Dark (S1, S9,
`gap-shell-account-states` frame 2 Dark, `gap-shell-phone-menu-submenus` 4),
Light (`gap-shell-phone-menu-submenus` 2).

### 9.4 Sign out

SH1's item (its existing icon; whether icons change is §15). Colours: text,
icon muted, highlighted popover-hover with no ring.

### 9.5 Collapsed rail (#6348)

Rail structure is SH1's (76 wide, the 52 × 52 account button, the Expand
button in the top bar). This doc adds:

- Each rail row shows the shared Tooltip (#6370) with the row's name on
  hover (after Base UI's delay) and at once on keyboard focus; Escape hides
  it.
- Each collapsed rail row drops its native `title` in this change, so hovering
  it shows exactly one tooltip; the expanded rows and the phone Menu rows keep
  theirs (shell spec D26). The account button keeps its native `title` (§7.4). It sits to the **right** of the row, 6px away, centred on it (Base UI
  `side="right"`, `sideOffset={6}`), as `gap-dash-studio-rail-badge` draws it:
  below a rail row it would cover the next icon. It is visual only
  (`aria-hidden`); the row keeps its accessible name.
- The tooltip's text never wraps: a long name (a German label, the
  long-locale frame of `gap-dash-studio-rail-badge`) grows the tooltip to the
  right over the page. Where the viewport ends, Base UI's collision handling
  flips or shifts it so it stays on screen.
- Only `gap-dash-studio-rail-badge` draws rail-row tooltips (the Studio row,
  Light); TH1 S10 draws none. Every rail row takes that look; the Dark
  tooltip is `gap-shell-sh1-in-th1` D2's.
- An inert row's tooltip is its name only (no board draws a reason in it).
- The account menu opened from the rail carries the same Theme section.

## 10. Top bar and breadcrumb colours (for the shell tickets)

| Element                       | Colour                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top bar                       | bg at 90% (`rgba(246,247,249,.9)` / `rgba(15,17,21,.9)`), 1px line rule (#e5e7eb / #2b303a)                                                                                                                                                                                                                                                                     |
| Collapse toggle, Menu button  | ground surface, 1px control-line border, icon muted; hover and open: brand-ink #4f46e5 / #a5b4fc border, icon text (`gap-shell-sh1-in-th1` `.tgl`; not `gap-shell-phone-menu-submenus`' brand, §3.1); focus gap bg                                                                                                                                              |
| Breadcrumb links              | muted #5b6472 / #a3abb8; focus gap bg                                                                                                                                                                                                                                                                                                                           |
| Separator "›"                 | faint #7a8394 / #8590a0, `aria-hidden` decoration (TH1 D1, S1, S11 / S12; §3.1). The glyph is SH1's                                                                                                                                                                                                                                                             |
| Leaf                          | text, 600                                                                                                                                                                                                                                                                                                                                                       |
| "…" button (phone, 4+ crumbs) | as the Menu button: ground surface #ffffff / #171a20, 1px control-line #878f9d / #737d8d border, glyph **text** #12141a / #e8eaef 14px / 600 (a text glyph, not a muted icon); hover and open border brand-ink #4f46e5 / #a5b4fc, ground and glyph unchanged; focus-visible the §4 ring with a bg gap, border at rest (`gap-shell-breadcrumb-phone-states` 4–8) |
| Full path menu                | popover tokens: popover #ffffff / #262b35, 1px popover-line #e5e7eb / #4a5260, menu shadow; highlighted row popover-hover #eef1f6 / #323845 with no ring; rows text; the "Platform" group label muted #5b6472 / #a3abb8 (`gap-shell-breadcrumb-phone-states` 7)                                                                                                 |

## 11. Phone Menu colours (for #6376; theme section #6347)

Structure is SH1 F2: 288 wide, Workspace dropdown pinned on top, nav
scrolling, account pinned at the foot, **no scrim**.

| Element                  | Colour                                                                                                                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup                    | popover, 1px popover-line, menu shadow                                                                                                                                                                                                                                                       |
| Group labels             | muted (popover context, not side-muted)                                                                                                                                                                                                                                                      |
| Rows                     | text #12141a / #e8eaef, 14px; icons muted; hover popover-hover                                                                                                                                                                                                                               |
| Active row               | popover-hover #eef1f6 / #323845, text **and icon** text #12141a / #e8eaef (not brand-ink, §3.1), no shadow; 3px brand-ink bar inset 10px top and bottom                                                                                                                                      |
| Inert rows (Coming soon) | full opacity (§3.1): text, icon muted, the "Coming soon" pill as below; no hover ground                                                                                                                                                                                                      |
| Pills                    | "{count} new" as §7; neutral pills muted on pill-neutral-popover #eef0f3 / #323845                                                                                                                                                                                                           |
| Pinned Workspace region  | a 1px popover-line #e5e7eb / #4a5260 rule below it, between it and the nav list (`.pinned-top`; `gap-shell-phone-menu-submenus` 1–4, `gap-shell-sh1-in-th1` P1 / P2)                                                                                                                         |
| Pinned account foot      | a 1px popover-line #e5e7eb / #4a5260 rule above it, between the nav list and it (`.pinned-foot`; same frames)                                                                                                                                                                                |
| Pinned Workspace field   | as §7.3 on the popover: side-field #ffffff / #171a20, 1px side-field-line #7c8493 / #737d8d border, raised shadow; open border side-accent #4f46e5 / #a5b4fc                                                                                                                                 |
| Pinned account trigger   | side-field #ffffff / #171a20 ground, 1px side-field-line #7c8493 / #737d8d border (3.76 / 3.41 on the popover, §5.3.1); open border side-accent #4f46e5 / #a5b4fc; name text, email and chevron muted (popover context). Its hover inside the phone Menu is not drawn: #6376's frame to draw |
| Account menu             | opens from the pinned foot (`gap-shell-phone-menu-submenus` 2 and 4); its Theme items are **44** tall                                                                                                                                                                                        |

How the two pinned triggers open inside the phone Menu is the shell's open
SH1 D2 (= old TH1 §20.14); `gap-shell-phone-menu-submenus` draws the
proposal. Their colours above hold whichever way that is answered.

## 12. Controls (#6337, #6339, #6340)

Colours, borders and the ring only (narrowed). Field, button and card
**metrics**, and where the error and hint sit, come from the page boards
(X18). Where no board draws a disabled control, its disabled opacity stays as
today; the disabled secondary button is drawn (below) and takes colours, not
opacity.

| Element             | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input rest          | 1px control-line border (#878f9d / #737d8d), ground surface, text; on a card header or toolbar control-line-tint (#7c8493 / #737d8d). On `main` `utils/field-surface-classes` is read by the text input, the textarea, the portable-text editor and its link control (#6337); the select trigger writes its own border and ring in `shared/select/select-variants.ts` (#6339)                                                                                                                                                                                                                                                                                                                                           |
| Input focus         | border unchanged; ring `0 0 0 2px <ground>, 0 0 0 4px brand-ink`. Today an outline in brand-weak and a brand border: change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Input invalid       | border **bad-line** (#dd6152 / #e5675a; today `border-admin-bad`); error text bad #b42318 / #fca5a0, text only, no icon                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Secondary button    | 1px control-line border, ground surface, text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Secondary disabled  | 1px control-line-locked #c5cad3 / #424956 border, ground surface, label muted #5b6472 / #a3abb8, no opacity (`gap-voice-820` saving strip `.btns:disabled`, #c4c9d2 mapped, §3.1; exempt from 1.4.11 as disabled)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Toast dismiss focus | the §4 geometry: a 2px toast-ground gap (tooltip #12141a / #262b35), then a 2px white (fixed) ring (§4 exception)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Primary button      | border and ground brand (#4f46e5 / #5850ec), white text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Button / link focus | the §4 ring with the ground it sits on                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Links               | brand-ink                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Switch              | track on brand, off control-line; thumb **switch-thumb** (#ffffff / #e8eaef) with `0 1px 2px rgba(16,24,40,.25)`; state word text #12141a / #e8eaef                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Switch focus        | ring `0 0 0 2px surface, 0 0 0 4px brand-ink` (today the offset is always white and the ring brand)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Focus ring helper   | One shared class helper in `apps/platform/src/utils/` builds the §4 ring for a named ground (side, bg, surface, surface-head, popover, theme-track). Every admin control uses it; no component keeps `ring-admin-brand` or `ring-offset-*`. #6337 introduces it with its first user, the field surface (a class-string helper has no behaviour to test without a class assertion, and an export with no user fails `knip`, so it cannot land alone; the bundle is put to the user in the split, §20 item 7); #6338 adopts it in switches, buttons and links; #6339 in the remaining shared controls (the portable-text toolbar's toggle buttons included); #6340 in the feature surfaces; #6335 on the Workspace field. |

**Feature surfaces** (#6340; the ground each element sits on, which the
helper takes):

| Element                                                       | Ground                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Choose a workspace: each picker row (rest and hover)          | surface #ffffff / #171a20 (the picker card)                                                                                                                                                                                                                                                                                                                           |
| Leads: the list column (focused by the page after a deletion) | bg #f6f7f9 / #0f1115                                                                                                                                                                                                                                                                                                                                                  |
| Leads: a lead row (read, unread, selected)                    | `gap-theme-lead-row-focus`. Rows touch and the list card clips its edge, so an outside ring cannot show; the proposal it confirms or replaces is the §4 geometry drawn inside the row's edge, the gap in the row's own ground (surface, or brand-weak #eef2ff / #23244a when selected); a selected row keeps its 1px brand edge outermost, the gap and ring inside it |
| Leads reading pane: the lead's name (in the card header)      | surface-head #eef1f6 / #1d2027 (#6355 tints card headers; #6340 follows it)                                                                                                                                                                                                                                                                                           |
| Leads reading pane: the email link (card body)                | surface #ffffff / #171a20                                                                                                                                                                                                                                                                                                                                             |
| Overview: each "Make it yours" tile (rest and hover)          | surface #ffffff / #171a20; the ring replaces the tile's raised shadow                                                                                                                                                                                                                                                                                                 |
| Tenant details panel: the fields group (focused by the page)  | surface #ffffff / #171a20                                                                                                                                                                                                                                                                                                                                             |

Buttons and links on these pages (Reply, Mark unread, Delete, Back, the lead's
page link) are #6338's; the panel's inputs and segmented controls are
#6337's and #6339's.

## 13. Popover tokens on form popups (#6343)

Every select list, option list, font picker and item select: ground popover,
1px popover-line, highlighted row popover-hover with muted text staying muted,
menu shadow, radius 6; the selected item's check (`indicator`) brand-ink
#4f46e5 / #a5b4fc, including on the popover-hover row (D2 "Check and focus ring on hovered row", 5.55 / 5.89).

Not in this list: `shared/language-picker` renders a `SegmentedControl` and has
no popup, and the portable-text editor toolbar holds Base UI Tooltips only, no
popup. Resolutions §2's row "Popover tokens on form popups (select,
option-select, toolbar)" is corrected with #6314 to "(select, option-select,
font picker, item select)"; the toolbar's toggle-button focus ring is
#6339's. The editor toolbar's tooltip is the shared Tooltip's (#6370, X1),
adopted there by #6412.

## 14. Mono on the remaining strings (#6351)

#6335 applies the Mono font and its token, and the Workspace field is its
first user; the dropdown takes it in the dropdown in #6379. Every other domain
string — the Domain page and live domain card, the tenant detail header and
overview, onboarding's site address — and every hex value on the Look page is
set in JetBrains Mono 500 at its current size and colour. The Domain card's
public domain (owner and operator Overview), the Domain page's connected-domain
row and the onboarding review step's address are `DetailList` rows with
`isMono`, so #6351 sets the family and weight in
`shared/detail-list/detail-list-variants.ts`; every other `isMono` row (Releases
tag and commit, the Content workspace card's project ID and dataset) takes it
with them. `domain-card/` itself does not change. It ships after the
dashboard, Look and onboarding tickets that edit those files: #6356
(`detail-list/`), #6400 (`features/look/**`), #6332 (the preview's
address readout) and #6333 (`detail-list/` and the address step). No Voice
file shows a domain or a hex value, so no Voice ticket orders it.

## 15. Icons

New glyphs are #6404, registered on the platform by #6405 (resolutions §2): the theme items need `SUN`, `MOON`
(exist in `ICONS`, unregistered on the platform) and `MONITOR` (new)
registered, with these paths (stroke 2, round caps and joins,
`fill="none"`, `viewBox="0 0 24 24"`, as `gap-shell-sh1-in-th1` draws them at
14px):

| Glyph   | Path (`d`)                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| sun     | `M12 8a4 4 0 100 8 4 4 0 000-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4` |
| moon    | `M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z`                                                                                                 |
| monitor | `M3 4h18v12H3z M8 20h8 M12 16v4`                                                                                                           |

Icon sizes (14 for the theme items) and the `strokeWidth` override are
#6361's. SH1 draws today's nav icons at stroke 1.6, so the TH1 nav remap
and its new nav glyphs are dropped.

**Decided 31 Oct (§20 item 2, X22b):** every stroked platform SVG moves to
stroke 2 with its geometry kept (#6352); no LX redraw. Exempt:
`github.svg` and `google.svg`, the filled brand logos on the sign-in page.

## 16. Accessibility

| Item             | Rule                                                                                                                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme            | `role="group"` named "Theme" and described by its hint, holding three `menuitemradio` with `aria-checked`; arrow keys move, Enter / Space choose, the menu stays open                                                                                                  |
| Focus visibility | every interactive element shows the §4 ring with the gap in its ground colour, in both themes                                                                                                                                                                          |
| Rail rows        | each icon row keeps its accessible name; the tooltip with its name shows on hover and at once on keyboard focus; the tooltip is `aria-hidden`; a collapsed rail row has no native `title`, so one tooltip shows (expanded and phone Menu rows keep `title`, shell D26) |
| Targets          | theme items 44 tall on a phone                                                                                                                                                                                                                                         |
| Contrast         | §5.3 and §5.4, both palettes, guarded in CI                                                                                                                                                                                                                            |
| Everything else  | landmarks, current page, menu names and focus order are the shell spec's                                                                                                                                                                                               |

## 17. Copy

All admin UI copy: fixed, never Voice. Every new key lands in all five
platform locales (`apps/platform/src/i18n/messages/{en,de,es,fr,nl}.json`).

| String                              | Key                                                | Status      |
| ----------------------------------- | -------------------------------------------------- | ----------- |
| Theme                               | `account.themeLabel`                               | new (#6346) |
| Light / Dark / System               | `account.themeLight` / `themeDark` / `themeSystem` | new (#6346) |
| System follows your device setting. | `account.themeSystemHint`                          | new (#6346) |
| Rail row tooltips                   | the existing `navSections.*` labels                | existing    |

Dropped from the earlier draft: `sidebar.ariaLabel`, `sidebar.sectionsAriaLabel`
(X11), `tenantSwitcher.label` / `.menuLabel` (X8), `account.menuLabel` and the
collapsed account label (#6375 owns "Account" and "Account: {name},
{email}"), the visible "Menu" label (X5), `tenantsSearch.placeholder`,
`featuresSettings.capabilitiesDescription*` and the "Superadmin" relabel (§22).

## 18. Code mapping

All paths under `apps/platform/src/` unless stated; `layout/*` is
`components/features/layout/*` and `shared/*` is `components/shared/*`.

| Area                     | File(s)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Change                                                                                  | Ticket       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------ |
| Tokens (light)           | `styles/admin-theme.css`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | §5.1 light values, eight new tokens, §5.2 extras (light), shadow vars                   | #6288        |
| Tokens (dark)            | `styles/admin-theme.css`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | dark block, System media block, `color-scheme`, §5.2 dark, §5.4 dark values and shadows | #6291        |
| Mono font                | existing `config/font-loaders/jetbrains-mono-font.ts`, `app/[locale]/layout.tsx`, `--font-admin-mono` in `@theme inline`                                                                                                                                                                                                                                                                                                                                                                                                                  | apply the existing loader's variable to the admin shell (weight 500)                    | #6335        |
| Theme preference (#6344) | new `constants/theme.ts`, a cookie util beside `utils/sidebar-collapsed-cookie/`, a resolver beside `server/layout/resolve-is-sidebar-collapsed.ts`, `app/[locale]/layout.tsx` `<html data-theme>` — drafted for the per-device answer to §20 item 1. Reuse: `@blog/config` already exports `COLOR_SCHEME` { LIGHT, DARK } (`packages/config/src/constants/contrast.ts`, read by the public-site contrast check); whether the preference extends it with SYSTEM or a `THEME_PREFERENCE` const sits beside it is §20 item 4                | §6                                                                                      | #6344        |
| Hard-coded white         | `layout/sidebar/sidebar-variants.ts`, `layout/tenant-switcher/tenant-switcher-variants.ts`, `layout/signed-in-account/signed-in-account-variants.ts` (account trigger; not its `rail` / `railFooter` surfaces, which #6322 moves to the rail tokens), `layout/sidebar/components/sidebar-collapse-toggle/sidebar-collapse-toggle-variants.ts` — whichever exist on `main` when #6288 starts                                                                                                                                               | text-strong / side-text / side-muted tokens                                             | #6288        |
| Faint as text, sidebar   | `nav-item-content-variants.ts` (`rowReason`), `sidebar-variants.ts` (`brandTagline`, `note`) — on the side ground #6288 turns grey, so they ride with the tokens                                                                                                                                                                                                                                                                                                                                                                          | side-muted                                                                              | #6288        |
| Faint as text, elsewhere | `shared/text-input` and `shared/textarea` (disabled), `shared/portable-text-editor/portable-text-editor-variants.ts` (placeholder, disabled), `shared/asset-upload-field/asset-upload-field-variants.ts` (`thumb`, the empty logo thumbnail's 10px placeholder text), `layout/dashboard-tenant-picker/components/tenant-picker-row/tenant-picker-row-variants.ts` (`separator`, and the archived tile's initials in `isArchived`; its dashed border stays faint); `tenant-switcher-variants.ts` `itemDomain` is #6379's (§8)              | muted; faint stays for icons, chevrons and the `aria-hidden` breadcrumb separator       | #6336        |
| Workspace field          | `layout/tenant-switcher/*` (the field, not `itemDomain`; `tenant-switcher.tsx` for the `title`), `shared/avatar/avatar-variants.ts`                                                                                                                                                                                                                                                                                                                                                                                                       | §7.3 colours, the side-ground ring, the full-name `title`                               | #6335        |
| Pill tone                | `shared/status-badge/status-badge-variants.ts` (`brand` tone text, neutral ground token)                                                                                                                                                                                                                                                                                                                                                                                                                                                  | brand-ink; pill-neutral (the token itself is #6288's)                                   | #6356        |
| Sidebar rows             | `layout/sidebar/sidebar-variants.ts`, `layout/nav-item-content/nav-item-content-variants.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                              | §7 rest, hover, active plate and bar                                                    | #6341        |
| Undrawn sidebar rows     | `layout/sidebar/*`, `layout/nav-item-content/*`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §7 undrawn states, tenant detail groups                                                 | #6342        |
| Focus ring, fields       | new helper in `utils/`, `utils/field-surface-classes`, `utils/invalid-state-classes`                                                                                                                                                                                                                                                                                                                                                                                                                                                      | §12                                                                                     | #6337        |
| Switch, button, link     | `shared/switch/switch-variants.ts`, `shared/button/button-variants.ts`, `shared/text-link`                                                                                                                                                                                                                                                                                                                                                                                                                                                | §12                                                                                     | #6338        |
| Focus ring, shared       | `shared/checkbox`, `shared/segmented-control` (ring only), `shared/select/select-variants.ts` (trigger), `shared/view-tabs`, `shared/accordion`, `shared/hue-slider` (the thumb's `data-[dragging]` ring becomes the same ring), `shared/preset-picker`, `shared/data-table-shell` (sort buttons, drawn inside the head cell; the scroll region's inset ring), `shared/toast` (dismiss, white ring), `shared/portable-text-editor/components/toolbar/components/toggle-button/portable-text-editor-toggle-button-variants.ts` (ring only) | §12                                                                                     | #6339        |
| Focus ring, features     | `layout/dashboard-tenant-picker/components/tenant-picker-row`, `features/leads/leads-inbox/**`, `features/tenants/owner-home-view/components/make-it-yours-card/components/tile`, `features/tenants/tenant-details-panel`                                                                                                                                                                                                                                                                                                                 | §12 "Feature surfaces"                                                                  | #6340        |
| Popovers                 | `shared/select/select-variants.ts` (`popup` and `item` slots; the `trigger` slot is #6339's), rendered by `select-popup.tsx`, `option-select.tsx`, `font-picker.tsx` and `features/email/email-settings/components/item-select/item-select.tsx`                                                                                                                                                                                                                                                                                           | §13                                                                                     | #6343        |
| Theme radio group        | new shared block on Base UI `Menu.RadioGroup` / `Menu.RadioItem` with an icon slot; `shared/segmented-control` (ToggleGroup) is not a menu radio group                                                                                                                                                                                                                                                                                                                                                                                    | §9.3                                                                                    | #6345        |
| Account menu Theme       | the account menu #6375 creates; `i18n/messages/*.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | §9.3                                                                                    | #6346        |
| Phone account Theme      | the phone Menu's account menu (#6376)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | §9.3 touch size                                                                         | #6347        |
| Rail tooltips            | `layout/sidebar/*` collapsed rows, `shared/tooltip` (#6370)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | §9.5; the collapsed rows drop their native `title`                                      | #6348        |
| Tooltip dark             | `shared/tooltip` variants (#6370)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | §5.2 tooltip tokens                                                                     | #6291        |
| Mono strings             | `features/tenants/domain-page-content/**`, `features/tenants/live-domain-card/*`, `features/tenants/tenant-page-header/*`, `features/tenants/tenant-overview-view/*`, `shared/detail-list/detail-list-variants.ts` (`isMono`), `features/onboarding/**` site address, `features/look/**` hex values                                                                                                                                                                                                                                       | §14                                                                                     | #6351        |
| Studio                   | `packages/studio/src/studio-mount.tsx`; `app/[locale]/dashboard/(tenant)/studio/[[...tool]]/page.tsx` and `app/[locale]/tenants/[tenantId]/(detail)/studio/[[...tool]]/page.tsx`                                                                                                                                                                                                                                                                                                                                                          | "Studio sync" below                                                                     | #6349, #6350 |
| Contrast guard           | a platform test using `renderedContrastRatio` from `@blog/utils` (the alias already exists in `apps/platform`); it reads token values from `styles/admin-theme.css` by name and holds only pairs of token names (the "Tokens" columns of §5.3, §5.3.1 and §5.4; one pair per palette where the ground differs) and thresholds, never a retyped hex                                                                                                                                                                                        | §5.3, §5.3.1, §5.4                                                                      | #6288, #6291 |
| Stroke 2                 | `assets/icons/*.svg`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | §15 (open)                                                                              | #6352        |

### Studio sync (S13)

Checked against `sanity@6.19.0`: `StudioProvider` accepts `scheme` and
`onSchemeChange` (both `@beta`). `scheme` alone hides the Studio's Appearance
menu; passing `onSchemeChange` too keeps the menu and syncs both ways.

| Choice | Admin                               | StudioMount                                  |
| ------ | ----------------------------------- | -------------------------------------------- |
| Light  | admin light tokens                  | `scheme="light"`                             |
| Dark   | admin dark tokens                   | `scheme="dark"`                              |
| System | follows `prefers-color-scheme` live | the resolved `light` or `dark`, updated live |

- Admin → Studio: account menu Theme → preference stored → shell re-renders
  with the new tokens → StudioMount re-renders with the new scheme.
- Studio → admin: Studio Appearance menu → `onSchemeChange` → writes the same
  preference → the admin shell around the Studio switches, and the account menu
  shows the new choice.
- `@blog/studio` PR first: `StudioMount` gains `scheme` and `onSchemeChange`,
  both plain values / callbacks (no built config leaves the package).
- The Studio's Appearance menu offers its own "System" option. The studio PR
  states what `onSchemeChange` receives for it; if it reports the resolved
  scheme, the admin stores that scheme (LIGHT or DARK). This is a technical
  finding the studio agent reports, not a product choice.

## 19. Acceptance checklist

Tick each row against the build, in the named theme, at the named width,
beside the named frame. Rows carry the ticket that builds them. Rows whose
structure belongs to the shell are checked for **colour** here and for
structure in the shell spec's §19.

### D2 / token board · Palettes and contrast

- [ ] All 34 light token values in the CSS match §5.1 and the §5.2 light extras match (#6288)
- [ ] All 34 dark token values match §5.1 and the §5.2 dark extras match, tooltip tokens included (#6291)
- [ ] The §5.4 dark values and the eight dark shadows match `gap-theme-token-dark-values` (#6291)
- [ ] All 29 light D2 pairs and the 8 light §5.3.1 shell pairs pass and the guard fails CI when one drops (#6288)
- [ ] All 29 dark D2 pairs, the 8 dark §5.3.1 shell pairs, the §5.3.2 pair in both palettes and the 17 + 17 §5.4 pairs (15 + 15 if §20 item 3 is no) pass and are guarded (#6291)

### D1 + `gap-shell-sh1-in-th1` L1 / L3 · 1440 · Light · owner

- [ ] Sidebar ground side #eef0f3, right border side-line #d9dde4, brand-row rule side-line (#6288)
- [ ] "Valstack" text-strong #12141a; "admin" side-muted #5b6472; section labels side-muted (#6288)
- [ ] Workspace field: side-field #ffffff, side-field-line #7c8493 border, raised shadow, initials #3730a3 on #eef2ff, name #12141a, domain JetBrains Mono 11px muted #5b6472, chevron muted (#6335)
- [ ] Rows side-text #2a303b with side-muted #5b6472 icons; Look hovered on side-line #d9dde4 (#6341)
- [ ] Active row: side-raised #ffffff plate, raised shadow, text and icon text-strong #12141a 600, 3px side-accent #4f46e5 bar inset top and bottom (#6341)
- [ ] "{count} new" brand-ink #4f46e5 on brand-weak #eef2ff; "Coming soon" muted #5b6472 on pill-neutral #eef0f3 (#6356 on #6288's tokens)
- [ ] Top bar bg at 90% over a line #e5e7eb rule; toggle surface with a control-line #878f9d border (#6288 tokens; shell structure)
- [ ] Breadcrumb separator faint #7a8394 (shell on #6288 tokens)
- [ ] Account trigger at rest: side-line border, transparent; name text-strong #12141a, email and chevron side-muted #5b6472; open: control-line-tint #7c8493 border on #ffffff, not L3's side-accent (§3.1) (#6375 on #6288 tokens)
- [ ] Account menu: popover #ffffff, popover-line #e5e7eb border and rules, menu shadow (#6375 on #6288 tokens)
- [ ] Theme section between the header and Sign out: "THEME" muted 11/700 uppercase; group bordered control-line #878f9d on theme-track #eef0f3; Light (sun), Dark (moon), System (monitor) 32 tall, sized to their labels and all inside the 240 popup; System checked: segment-on #ffffff, 600, raised shadow; hint "System follows your device setting." (#6345, #6346)
- [ ] An unchecked theme item under the pointer or reached by arrow keys: popover-hover #eef1f6 plate, inset 2px brand-ink #4f46e5 ring, label and icon text #12141a (#6345)

### Onboarding rail after the light palette · 1440 and 390 · Light

- [ ] After #6288, the wizard rail, the phone step header with its segmented stepper, and Choose a workspace stay #0f1115 with a #1c1f26 border, #c9cfda / #7d8696 text, #a5b4fc done steps and a #20242e current plate, as on `wizard-W2-side-rail-step3` and `wizard-W2-side-rail-phone` (onboarding set; not on the canvas yet either) (#6288 on #6321's rail tokens)

### S1 + `gap-shell-sh1-in-th1` D1 / D3 · 1440 · Dark · operator and owner

- [ ] Page #0f1115; sidebar side #0a0c0f with side-line #1c1f26 rules; "Valstack" #ffffff; "admin" #8d96a6 (#6291)
- [ ] Rows #c9cfda with #8d96a6 icons; hover #1c1f26; active #20242e, no shadow (not D1's, §3.1), #ffffff 600, #a5b4fc bar (#6341, #6291)
- [ ] Workspace field #171a20 with a #737d8d border; initials #c7cdfd on #23244a; name #e8eaef; domain and chevron #a3abb8 (#6335 on #6291's tokens)
- [ ] Top bar `rgba(15,17,21,.9)` over a #2b303a rule; breadcrumb links #a3abb8, leaf #e8eaef (#6291)
- [ ] Account trigger open: border #737d8d on #20242e; avatar #5850ec; name text-strong #ffffff; email (role line on S1) and chevron side-muted #8d96a6 (#6291)
- [ ] Breadcrumb separator faint #8590a0 (#6291)
- [ ] Account menu #262b35, border and rules #4a5260, dark menu shadow; Theme group border #737d8d on #0f1115; Dark checked: segment-on #323845, #e8eaef 600, dark raised shadow; "Sign out" #e8eaef (#6291, #6346)

### S2 / S3 + `gap-shell-sh1-in-th1` L4 / D4 · Workspace dropdown open

- [ ] Field border side-accent #4f46e5 / #a5b4fc while open (#6288 / #6291)
- [ ] Dropdown popover #ffffff / #262b35, border #e5e7eb / #4a5260, menu shadow; highlighted row #eef1f6 / #323845; Old Portfolio's "Archived" muted on pill-neutral-popover (#5b6472 on #eef0f3 / #a3abb8 on #323845) (#6379, #6356 on these tokens)
- [ ] Current workspace: a 3px brand-ink #4f46e5 / #a5b4fc bar and a 600 name, no plate; current and highlighted: the bar on the #eef1f6 / #323845 plate (#6379 on these tokens)

### S4 · Focus · Light

- [ ] Focused Workspace field: 2px #eef0f3 gap + 2px #4f46e5 ring, no raised shadow under it (#6337 helper; #6335)
- [ ] Long workspace name: name on one line ending in an ellipsis; the field's `title` is the full name (#6335)
- [ ] Focused nav row: transparent with the same ring (#6341)

### S5 / S6 · Controls · Light and Dark

- [ ] Input border control-line #878f9d / #737d8d on surface #ffffff / #171a20 (#6337); disabled and placeholder text muted, never faint (#6336)
- [ ] Focused input: border kept, 2px surface gap (#ffffff / #171a20) + 2px brand-ink ring (#4f46e5 / #a5b4fc), no outline (#6337)
- [ ] Invalid input: bad-line #dd6152 / #e5675a border; error text #b42318 / #fca5a0 with no icon (#6337)
- [ ] Secondary button bordered control-line on surface; disabled, control-line-locked #c5cad3 / #424956 with a muted label and no opacity; primary brand #4f46e5 / #5850ec with white text (#6338)
- [ ] Switch tracks brand / control-line; thumbs #ffffff / #e8eaef; focused switch shows the surface-gap ring (#6338)
- [ ] Every other shared control and feature surface, focused by keyboard, shows the same ring and no other, with the grounds of §12 "Feature surfaces" (#6339, #6340); the lead row as `gap-theme-lead-row-focus` (#6340)

### S7–S9 + `gap-shell-sh1-in-th1` P1 / P2 + `gap-shell-phone-menu-submenus` 2 / 4 · 390

- [ ] Menu button surface with a control-line border (#878f9d / #737d8d) (#6288 / #6291 tokens)
- [ ] Menu popover #ffffff / #262b35, border #e5e7eb / #4a5260; group labels muted; rows text with muted 17px icons (shell on these tokens)
- [ ] Active row popover-hover #eef1f6 / #323845 with a brand-ink #4f46e5 / #a5b4fc bar inset 10px (shell on these tokens)
- [ ] Account menu from the pinned foot: Theme items 44 tall; Light checked with Dark highlighted (popover-hover plate, inset brand-ink ring, text label and icon), and Dark checked with System highlighted (#6347)
- [ ] Active row icon text #12141a / #e8eaef; Coming soon rows at full opacity (shell on these tokens)
- [ ] Pinned Workspace field and account trigger: side-field #ffffff / #171a20 with a side-field-line #7c8493 / #737d8d border; open border side-accent (shell on these tokens)
- [ ] A 1px popover-line #e5e7eb / #4a5260 rule below the pinned Workspace field and above the pinned account foot (shell on these tokens)
- [ ] Menu button open: brand-ink #4f46e5 / #a5b4fc border, not brand; "Coming soon" and "Archived" muted on pill-neutral-popover #eef0f3 / #323845 (shell on these tokens)
- [ ] "…" breadcrumb button: surface ground, control-line border, text glyph; hover and open border brand-ink #4f46e5 / #a5b4fc; Full path menu on the popover tokens with a #eef1f6 / #323845 highlighted row and a muted group label (shell on these tokens)

### S10 + `gap-shell-sh1-in-th1` L2 / D2 · Collapsed rail

- [ ] Rail side #eef0f3 / #0a0c0f, side-line rule; icons side-muted, also on a keyboard-focused row; active plate and bar as expanded (#6341)
- [ ] Each rail row shows a tooltip with its name to its right, 6px away, on hover and at once on keyboard focus; Escape hides it; a long name stays on one line and grows to the right, and Base UI flips or shifts it at the viewport edge (#6348, against `gap-dash-studio-rail-badge`; S10 draws no tooltip)
- [ ] Hovering a rail row shows exactly one tooltip: the row has no native `title`; expanded rows keep theirs (#6348, shell D26)
- [ ] The tooltip is #12141a with white text in Light, and popover #262b35 with a #4a5260 edge and #e8eaef text in Dark (#6291)
- [ ] The account menu opened from the rail shows the Theme section (#6346)

### `gap-shell-account-states` · Account trigger

- [ ] Rest, hover and open: name text-strong #12141a / #ffffff; email and chevron side-muted #5b6472 / #8d96a6 (#6375 on these tokens)
- [ ] Hover: side-raised #ffffff / #20242e ground with border, text and chevron unchanged; collapsed 52 × 52 hover the same (#6375 on these tokens)
- [ ] Email-only account: the trigger shows the email once, on the name line, 13px / 600 text-strong #12141a / #ffffff, at rest and on hover (#6375 on these tokens)
- [ ] Email-only account: the menu's Theme section and Sign out are unchanged, in Light (System checked) and Dark (Dark checked) (#6346)

### S11 / S12 · Breadcrumb and tenant detail sidebar (1040)

- [ ] Light: links #5b6472, leaf #12141a; Dark: ground #0f1115, rule #2b303a, links #a3abb8, leaf #e8eaef (#6288 / #6291)
- [ ] Sidebar (as `gap-theme-sidebar-row-states`): "Tenant · The Long-Running …" label side-muted, one line with its full text on hover; Provisioning and Danger zone with "platform" pills #5b6472 on #eef0f3 / #a3abb8 on #262a33 (#6342)
- [ ] An inert row (if any) reads side-text with a side-muted reason line under it and no hover ground (#6342)

### `gap-onboarding-dark` · Onboarding in Dark

- [ ] Step 3 at 1440 and 390 in Dark: main column surface #171a20, preview column bg #0f1115 with a #2b303a rule; text #e8eaef, muted #a3abb8, Continue #5850ec with white text; the rail and phone step header #0f1115 exactly as in Light (#6291)
- [ ] The rest of §6.1: selected Editorial card 1.5px brand-ink #a5b4fc with a 3px #23244a halo, its dot #a5b4fc with a #0f1115 tick; Back and radio rings #737d8d; card and swatch borders #2b303a; footer rule #232730; readouts per §5.4 (#6291)
- [ ] Stage and device frame per §5.4: frame border #737d8d, bar #171a20 with a #2b303a rule, dots #3a404b, stage preview-stage with no border (#6291; the Dark stage value once drawn)
- [ ] The preview toolbar in Dark uses §5.4's values, not the board's placeholders: track #0f1115 with a #737d8d border; rest icon #a3abb8; hover #22262f with a #e8eaef icon; pressed #323845 with an inset 1.5px #a5b4fc ring and a #c7cdfd icon; focus a 2px #a5b4fc outline at offset 2; solo pressed #23244a with a #a5b4fc border and inset ring and a #c7cdfd icon (#6291)

### `gap-theme-token-dark-values` · Voice chip tones · Light and Dark

- [ ] Rest, hover, active, active hover and active with an error as the §5.4 "Voice chip" rows, in both columns (NEW-voice-* on these tokens; Dark #6291)

### Popups and Mono

- [ ] Every select list, option list, font picker and item select: popover, popover-line border, popover-hover highlight, menu shadow, radius 6, in both themes; the selected item's check brand-ink, including on the highlighted row (#6343)
- [ ] Every domain on the Domain page, tenant detail header, the Domain card on Overview and onboarding's site address, every other `isMono` detail-list value, and every hex on Look, in JetBrains Mono 500 (#6351)

### Studio row status · Dark (dashboard set)

- [ ] The Studio status line and rail badge in Dark: tones warn #f5c451, brand-ink #a5b4fc, bad #fca5a0; badge ground #0a0c0f / #1c1f26 / #20242e (#6362, #6363 on these tokens; checked in #6369 after #6291)

### S13 · Theme switch and Studio

- [ ] Light / Dark / System each set the admin tokens and the Studio's scheme (#6350)
- [ ] System follows the OS live in both (#6291, #6350)
- [ ] Changing the Studio's Appearance updates the admin and the account menu's checked item (#6350)
- [ ] No flash of the wrong theme on load or reload (#6344)

## 20. Open decisions

Answered by the precedence rule, a board or the user (kept for the record):

| #                             | Item                                   | Answer                                                                                             |
| ----------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 2                             | Collapse toggle placement              | User: first in the top bar (X2); NEW-TH1-26 dropped, the toggle's tooltip ships in #6374           |
| 3                             | Neutral dark pill ground               | Board: #a3abb8 on #262a33 (`--admin-pill-neutral`); popover-hover inside dark menus                |
| 4                             | Breadcrumb ancestor cap                | Rule (SH1, X9): no caps; only the tenant-name crumb shrinks                                        |
| 6                             | Onboarding rail                        | Board: dark in both themes; the rest of onboarding in Dark is `gap-onboarding-dark`                |
| 7                             | Switcher menu name                     | Rule (SH1 F7): named by its trigger; no "Workspaces" label                                         |
| 8                             | Plain check glyph                      | Rule: not needed (X8 drops the check)                                                              |
| 9                             | Tooltip                                | #6370 owns it (X1); rail rows adopt it in #6348                                                    |
| 10                            | Account trigger text                   | Rule (SH1, LB agrees): name + email                                                                |
| 11                            | #6291 priority                         | Rule: `prio:next` (X30)                                                                            |
| 14                            | Workspace trigger in the phone Menu    | = SH1 D2, the shell's; decided 31 Oct: `gap-shell-phone-menu-submenus` draws the answer            |
| 15                            | Keyboard highlight in menus            | Board: menu rows popover-hover with no ring; theme items popover-hover plus the ring (§9.3)        |
| 16                            | Rail account menu position             | Board (SH1 F9): right of the rail                                                                  |
| 18                            | Platform Storybook                     | Rule: none; the manual-test issues cover styling                                                   |
| 21                            | Save bar                               | Rule (X16): #6413's shared bar; TH1's card-footer look dropped                                     |
| —                             | Account menu width (300 vs 240)        | Rule (popup geometry = SH1): the trigger's width; segments size to labels (`gap-shell-sh1-in-th1`) |
| —                             | Account trigger hover (D15)            | Board: side-raised (`gap-shell-account-states`)                                                    |
| —                             | Sidebar row hover                      | Board: side-line (`gap-shell-sh1-in-th1`, §3.1)                                                    |
| 5, 12, 13, 19, 20, 22, 23, 24 | Features, Tenants, dates, "Superadmin" | Out of scope (§22)                                                                                 |

Decided 31 Oct:

1. **Per device or per user.** A per-device cookie, as #6344 is drafted.
   There is no `@blog/db` ticket and no migration.
2. **Stroke weight of existing admin icons (X22b).** The registered outlines
   stay and every stroked platform SVG moves to stroke 2 with its geometry
   kept (#6352). No LX redraw. Shared with Look D-23 and dashboard O6.
3. **Active Voice chip hover in Dark.** A `brand-hover` token (#3730a3 /
   #6159ee, 5.03:1): #6403 sets the light value, #6291 the dark one
   (`gap-theme-token-dark-values`). #6291's guard holds 17 pairs per palette.
4. **`THEME_PREFERENCE` beside `COLOR_SCHEME`.** A `THEME_PREFERENCE` { LIGHT,
   DARK, SYSTEM } const in `apps/platform/src/constants/theme.ts` for the
   stored choice; `COLOR_SCHEME` is reused for the resolved scheme passed to
   the Studio (#6350).
5. **#6288's bundle.** Kept: the conversions ride with the tokens, and the
   JetBrains Mono admin token sits in #6335, its first user (#6403
   and #6351 follow #6335).
6. **#6291's bundle.** Kept: the dark Tooltip variants, the toast ground and
   the hard-coded colours ride with the palette.
7. **#6337's bundle.** Kept: the ring helper ships with
   `field-surface-classes`, its first user.

Merged choices: the System item uses `ICONS.MONITOR` and a chosen item's check
`ICONS.TICK` (Q2); the phone Menu's inner popups open as in the shell spec D2
(Q4).

## 21. Ticket split

An epic (#6315) parents every ticket in this set, #6288 and #6291 included.
#6287 belongs to the shell set. Every ticket depends on #6314 (the six
reconciled specs and the resolutions file on `main`).

| Ticket | What                                                                                                                                                                    | Depends on (shared file or symbol)                                                                                                                                                                                                                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #6288  | Light palette, extras, light guard; the shell's `text-white` and the sidebar's faint text (bundle: §20 item 5)                                                          | #6321 (`admin-theme.css`), #6322 and #6323 (the `rail` readers, so the dark rails stay dark), #6305 (rail surface)                                                                                                                                                                                                                       |
| #6335  | The Mono token (first user), Workspace field colours (§7.3), its side-ground ring and its full-name `title`                                                             | #6288 (side-field tokens), #6337 (helper)                                                                                                                                                                                                                                                                                                |
| #6336  | The remaining text drawn in faint moves to muted                                                                                                                        | #6288 (`faint` / `muted` values)                                                                                                                                                                                                                                                                                                         |
| #6337  | Focus ring helper with its first user, the field surface; field and invalid colours (bundle: §20 item 7)                                                                | #6288                                                                                                                                                                                                                                                                                                                                    |
| #6338  | Switch, button and link colours and the ring                                                                                                                            | #6337 (helper), #6381 (`control-line-locked`, the disabled secondary button's border)                                                                                                                                                                                                                                                    |
| #6339  | Ring and borders on the remaining shared controls                                                                                                                       | #6337 (helper)                                                                                                                                                                                                                                                                                                                           |
| #6340  | Ring on the feature surfaces                                                                                                                                            | #6337 (helper), #6355 (surface-head on the card header the reading pane's name sits in)                                                                                                                                                                                                                                                  |
| #6341  | Sidebar row colours: rest, hover, active plate and bar                                                                                                                  | #6288 (side tokens)                                                                                                                                                                                                                                                                                                                      |
| #6342  | Reason line, section notes and the tenant detail groups                                                                                                                 | #6288, #6341 (`sidebar-variants.ts`, `nav-item-content-variants.ts`; the row hover ground inert rows opt out of), #6356 (StatusBadge's neutral tone → pill-neutral, for the "platform" pill)                                                                                                                                             |
| #6343  | Popover tokens on form popups                                                                                                                                           | #6288                                                                                                                                                                                                                                                                                                                                    |
| #6291  | Dark palette (§5.1, §5.2, §5.4) with the System media block, the Tooltip, toast and hard-coded colours that would be illegible in Dark, dark guard (bundle: §20 item 6) | #6357 (`admin-theme.css` chain #6321 → #6288 → #6381 → #6403 → #6357), #6370 (`shared/tooltip`), #6339 (`hue-slider/`, `preset-picker/`, `toast/`), #6340 and #6336 (`dashboard-tenant-picker/`), #6335 (`avatar/`), and #6337, #6338, #6341, #6342, #6343, #6348 (the controls, rows, popups and rail tooltips its Dark criteria check) |
| #6344  | Stored Light / Dark / System preference, applied on the server with no flash                                                                                            | #6291 (the `[data-theme]` blocks)                                                                                                                                                                                                                                                                                                        |
| #6345  | Theme menu radio group (shared block)                                                                                                                                   | #6288 (theme-track, segment-on, popover-hover, control-line)                                                                                                                                                                                                                                                                             |
| #6346  | Theme section in the account menu                                                                                                                                       | #6345, #6375 (account menu), #6405 (SUN, MOON, MONITOR: the platform registrations it passes to the block), #6344 (writes the preference)                                                                                                                                                                                                |
| #6347  | Theme section in the phone account menu, 44px                                                                                                                           | #6376 (phone Menu), #6346                                                                                                                                                                                                                                                                                                                |
| #6348  | Rail rows adopt the shared Tooltip and drop their native `title`                                                                                                        | #6370 (Tooltip), #6341 (`nav-item-content/`)                                                                                                                                                                                                                                                                                             |
| #6349  | `@blog/studio` StudioMount scheme props                                                                                                                                 | #6314 only                                                                                                                                                                                                                                                                                                                               |
| #6350  | Studio pages keep the theme in step                                                                                                                                     | #6349 (`StudioMount` props), #6344 (the preference)                                                                                                                                                                                                                                                                                      |
| #6351  | Mono on the remaining domain and hex strings                                                                                                                            | #6335 (Mono), and after the last ticket editing those files: #6356 (`detail-list/`), #6400, #6332, #6333 (`detail-list/`, address step)                                                                                                                                                                                                  |
| #6352  | Existing admin icons at stroke 2 (filed only if §20 item 2 / X22b says so)                                                                                              | #6405, #6361 (`shared/icon/*`)                                                                                                                                                                                                                                                                                                           |
| #6353  | Manual test (filed with the tickets, closed last)                                                                                                                       | every ticket above                                                                                                                                                                                                                                                                                                                       |

Edges that differ from resolutions §4, corrected here and in resolutions §4
with #6314: #6345 ← #6288 replaces #6345 ← #6291 (the block reads
no preference; its tokens are #6288's). #6291 ← #6370 is added (#6291
edits the Tooltip's variants in `shared/tooltip`, which #6370 creates; it
is also added to resolutions §2's "Must depend on the owner" column for
Tooltip). #6342 ← #6356 is added (the "platform" pill reads the
neutral tone #6356 moves to pill-neutral). #6346 ← #6344 and
#6350 ← #6344 replace their edges on #6291 (they write and read the
preference, now #6344's). The split tickets #6335, #6336, #6344, #6338 are
added with their edges in the table above. Already in resolutions §4 and kept:
#6346 ← #6405 and #6352 ← #6405, #6361 (the
platform registrations of the glyphs, and the `shared/icon/*` stroke
override); #6291 ← #6357 (the `admin-theme.css` chain). #6350 ←
#6346 is dropped (not an edge in §4): the account menu's check after a
Studio change is checked by the manual test, which follows both.

Further corrections to resolutions with #6314, from the split of #6337:

- §2, row "Gapped focus ring + control borders + link colour + invalid
  border": the owner becomes #6337 for the ring helper, the field
  surface and the invalid border; the link colour, buttons and switches are
  #6338's. "Must depend on the owner": #6339, #6340,
  #6335 and #6338 on #6337; #6358 on #6338.
- §4: #6358 ← #6337 (`button/`) becomes #6358 ← #6338
  (`button/`), since #6337 no longer touches `shared/button/`; the
  dashboard set's #6358 ticket changes its edge with it. The
  `shared/button/` line lists #6338, not #6337.
- §4 adds: #6335 ← #6288, #6337; #6336 ← #6288; #6338 ←
  #6337, #6381; #6340 ← #6355; #6342 ← #6341;
  #6291 ← #6337, #6338, #6339, #6340, #6335, #6336, #6341, #6342, #6343, #6348.
- §4: #6351's edges become #6288, #6356, #6400, #6332,
  #6333; the line "Domain card: #6359, #6351" is removed
  (#6351 edits `detail-list/`, not `domain-card/`), and the
  `detail-list/` line adds #6351. #6351 has no Voice edge.
- §6 adds `gap-theme-lead-row-focus` (theme) under "draw before filing".

Issue edits that ride with the rewrite: #6288's GitHub issue loses its
`no-tests-needed` label (it adds the contrast guard test), #6291's
`prio:later` becomes `prio:next` (X30, §20 item 11), and #6335 is
filed without `no-tests-needed` (its `title` has a test).

Dark values ship in #6291, after the #6381 → #6403 → #6357 chain
and after #6337, #6338, #6339, #6340, #6335, #6336, #6341, #6342, #6343 and #6348, which it
depends on (shared files, and the elements its Dark criteria check). Those
tickets, and #6345, state Light criteria only; their Dark checks are
#6353's steps, which follow #6291.

Why the two foundation tickets are drafted as bundles (the user approves or
splits them, §20 items 5 and 6): #6288 changes `side`
from #0f1115 to #eef0f3, so the shell's `text-white` and the sidebar's faint
text would be white or below 4.5:1 on grey on `main` between PRs; they ride
with the tokens, and everything that stays legible without them (the Workspace
field's colours, #6335; faint text off the sidebar, #6336) ships on
its own. #6291's dark values apply at once to every viewer whose device is
dark (System is the default, through the media block), so the Tooltip, the
toast ground and the hard-coded colours of `step-indicator`, `avatar`,
`hue-slider`, `preset-picker` and `dashboard-tenant-picker` would be illegible
in Dark on `main` if they landed later; they ride with the palette, and the
stored preference ships on its own (#6344).

Never in parallel (same files): `layout/sidebar/`, `nav-item-content/` —
#6341, #6342, #6348, #6346 with the shell and dashboard
sidebar tickets; `form-field/`, `text-input/`, `select/`, `option-select/`,
`font-picker/`, `segmented-control/`, `switch/`, `textarea/` — #6337,
#6338, #6339, #6336, #6343 with #6384, #6385 and
#6325; `shared/button/` — #6338 with #6410 and #6327 (#6358
follows #6338); `shared/portable-text-editor/` — #6339, #6336 with
#6412; `layout/tenant-switcher/` — #6288, #6335 with #6379; `shared/accordion/` —
#6339 with #6411 and #6386; `shared/preset-picker/` —
#6339 and #6291 with #6425, #6395 and #6329 (#6291 after
#6339); `shared/step-indicator/` — #6291 with #6327 and #6328;
`layout/dashboard-tenant-picker/` — #6340 with #6336 (#6291 after
both); owner-home tiles — #6340 with #6360. `shared/hue-slider/`,
`shared/toast/` and `shared/avatar/` are ordered by #6291's edges.
#6349 (studio) has no file in common with any platform ticket. The epic
body states the order; the user decides any stacking.

Dropped from this set (owned elsewhere, never created): NEW-TH1-1 (glyphs →
#6404, sizes → #6361), NEW-TH1-2 (cards → #6355, pills →
#6356, page head → #6357), NEW-TH1-5 (SH1 draws today's nav icons),
NEW-TH1-6 (→ #6379 and #6288), NEW-TH1-7 (→ SH1), NEW-TH1-22 (→
#6413), NEW-TH1-26 (→ #6370, #6374), and this set's copy of
#6287 (the shell set's ticket, X3).

## 22. Out of scope (optional follow-up)

Work TH1 drew only as a backdrop for its theme. Not filed; listed so it can be
picked up later as its own feature.

- **NEW-TH1-18** — Tenants table: no avatar, visible Actions header, Mono
  domains, plain Manage text links, the sort-header look with a 12px arrow on
  the sorted column only (TH1 S1, old §20.19).
- **NEW-TH1-19** — Search tenants as a 340-wide field with a search icon, the
  placeholder "Name or domain" and an announced hint (TH1 S1).
- **NEW-TH1-20** — Tenants page head description and its TH1 Add tenant
  button (TH1 S1). The page head itself changes globally through #6357.
- **NEW-TH1-13** — Features Capabilities card: subtitle, board row order,
  row spacing, Coming soon and locked rows with a disabled Off switch
  (TH1 D1, S7; old §20.5, 20.12, 20.13, 20.20 — Newsletter and Ratings rows,
  the Comments row, the subtitle in S5/S6, the dirty state).
- TH1 old §20.22: the Tenants Active / All toggle beside search in a TH1 group
  look (the segmented look is #6385's either way).
- TH1 old §20.23: English `formatDate` → "12 Mar 2026" (drawn only on S1; LB
  draws "Sep 12, 2026").
- TH1 old §20.24: `roleLabel.SUPERADMIN` → "Superadmin" (drawn only on S1;
  app-wide copy change).
- TH1 S5 / S6: the Email "Sender & footer" field order (error above hint),
  field and button metrics, the .45 disabled opacity, and the card-footer save
  bar.
