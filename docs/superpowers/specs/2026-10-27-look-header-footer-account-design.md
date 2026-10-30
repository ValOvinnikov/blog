# Look: account, busy buttons, header and footer

Design of record for the 2026-10-26/27 design round. The agreed canvas is the
visual reference: https://claude.ai/artifact/4HXdgYg3ixg2fUTC6H3rPP (owner-only).
Every item below was decided by the owner, step by step; nothing here is a
proposal unless it says so.

## Why

The public site's header, footer, account control and busy buttons each look
one way on every tenant. Owners asked to choose how they look, on the Look page,
and editors need real footer content (named link groups, an about text, an
address, legal links). The consent machinery also needs more than one way back
to the cookie choice.

## Goals

- New Look settings for the account control, busy buttons, spinner, header and
  footer, each with a default that every new site starts with.
- Footer content an editor controls in Studio, in a fixed reading order.
- Three entry points to cookie settings, one of which can never be removed.

## Non-goals

- Header Masthead layout, a site-name option, the header announcement strip,
  the header over a hero image.
- Footer Newsletter on top, About and links as its own layout, the Inverted
  surface, the call-to-action band. The band and the strip are possible later
  features of their own.
- Folding footer groups on phones.

## Decisions

### Account (header)

| Setting (Look › Header)     | Options                  | Default         | Plan   |
| --------------------------- | ------------------------ | --------------- | ------ |
| Account button              | Pill with label · Circle | Pill with label | Growth |
| Account panel               | Card · Profile · Hub     | Card            | Growth |
| On phones, the account sits | In the bar · In the menu | In the bar      | Growth |

- The button and the panel are independent: any panel opens from either button.
- Wide screens only for the button; phones always show a circle (In the bar) or
  a menu row (In the menu).
- In the menu, the account is the menu's last row and opens in place like a
  sub-menu; one group is open at a time.
- Sign out is neutral in every panel.
- Hub's tile lines "Posts you saved to read later" and "Name, sign-in methods,
  your data" are fixed copy (`VOICE_FIXED_KEYS`).
- Builds on the shipped header-controls epic #5459 (its two manual tests,
  #5468 and #5469, are still open).

### Sign-in panel

- S2: GitHub, Google, "or", the email field and "Email me a sign-in link" are
  visible at once. Not a Look setting.
- S1's feedback carries over: the pressed row says where you are going and the
  rest wait without fading; Sending uses the busy button; Sent replaces the
  whole form ("Check your inbox"); Couldn't send shows the error under the
  field; coming back after a failed sign-in shows an alert.

### Busy buttons and spinner

| Setting (Look › Buttons) | Options                                                | Default           | Plan   |
| ------------------------ | ------------------------------------------------------ | ----------------- | ------ |
| While busy               | Busy label (L1) · Label kept (L2) · Progress edge (L3) | Busy label        | Growth |
| Spinner                  | Follow the preset · Braille · Ring · Dots · Pulse      | Follow the preset | Growth |

- Platform buttons always use L1 (ring in the button's text colour, busy label,
  full colour, width held, keeps focus). Not a setting.
- Every busy button keeps focus and holds its width; the spinner and the edge
  bar take the button's text colour.
- With reduced motion, Label kept switches to the busy label; spinners show a
  still glyph.
- Follow the preset: Console uses Braille, Editorial uses Ring. The setting
  changes every spinner on the public site. Progress edge draws no glyph.

### Header

| Setting (Look › Header) | Options                                                                                   | Default    | Plan   |
| ----------------------- | ----------------------------------------------------------------------------------------- | ---------- | ------ |
| Layout                  | Classic · Links beside the brand · Centred links · Two rows · Centred brand · Menu button | Classic    | Growth |
| Sub-menus               | Dropdown · Wide panel                                                                     | Dropdown   | Growth |
| Bar                     | Full width · Floating                                                                     | Full width | Growth |

- Layouts change wide screens only; on phones every layout is the bar with a
  menu button, and sub-items open in place in the menu.
- Sub-menus need Studio support first: `settings_navigation.items` is a flat
  `linkRef` array today. A link with sub-items is a new array member type
  beside `linkRef` (additive, no migration). The dropdown lists the link's own
  page first, then its sub-items.
- The tagline moves from Site Settings (`settings_site` › `brand.tagline`, the
  `brandTagline` object) into the header's Studio document
  (`settings_navigation`). It shows under the logo whenever it is filled in, in
  every layout. No Brand setting on Look, no site-name option. The RSS route
  (`apps/web/src/app/[tenant]/[locale]/rss.xml/route.ts`) reads the tagline as
  the feed description fallback and follows the move.

### Footer content (Studio › Settings › Footer)

- Link groups: each group has a heading the editor names; no fixed categories.
- Brand column, top to bottom, each only when set: logo, a short about text
  (new field), the address (new field), social links.
- Fine print row: copyright, the privacy-policy link (#5086's dedicated
  field), then the editor's fine-print items.
- On phones, groups sit two per row.

### Footer appearance

| Setting (Look › Footer) | Options                                    | Default    | Plan   |
| ----------------------- | ------------------------------------------ | ---------- | ------ |
| Footer layout           | Columns · Centred · Compact · Big wordmark | Columns    | Growth |
| Background              | Plain · Shaded · Brand tint                | Brand tint | Growth |
| Surface                 | Full width · Card                          | Full width | Growth |

- Compact shows no groups, about text or address.
- Big wordmark sets the site name large and `aria-hidden`; the copyright line
  already announces it.
- The three backgrounds are the existing skins (PRIMARY, SECONDARY,
  BRAND_PRIMARY) and follow the reader's theme. #5021 assumes the footer is
  always Brand tint and must render the chosen skin instead.
- A Card footer uses the card shadow, not the float shadow.

### Cookie settings

1. **Footer fine print.** A Cookie settings item in the fine-print row. It
   shows on every site, cookie banner on or off; the Studio item only sets
   where it sits, never whether it appears (matches SPEC's "That button
   reopens it on every tenant, banner or not"). A `link` document accepts only
   http(s), so the item is its own non-link array member, allowed once.
2. **Module.** A Cookie settings page-builder module (for example on the
   privacy page) renders the switches and Save inline. It shows the reader's
   saved choice and waits until it is known, so Save never withdraws consent by
   accident; a short status confirms a save.
3. **Floating button.** Look › Footer › Cookie settings button: Hidden
   (default) · Shown, on every plan. Bottom left, 44px, round, icon only, named
   "Cookie settings". It appears only after the reader has answered the banner
   (the banner owns the bottom-left corner), only when the cookie banner is on,
   and never covers an open header overlay. Back-to-top keeps bottom right.

- The dialog's focus must return to whichever control opened it; today one
  `settingsButtonRef` serves only the footer button.
- The banner copy "…via Cookie settings in the footer" stays true, because the
  footer link always shows.
- A cookie icon is new.

## Starting values

New sites start with: Pill with label, Card, In the bar, Busy label, Follow the
preset, Classic, Dropdown, Full width, Columns, Brand tint, Full width,
Cookie settings button Hidden — the same on both presets. Existing sites move to
these when each setting ships. Free sites keep them, since every new setting
except the cookie button is Growth-only (with #5052).

## Data and migrations

- **Neon `site_config`** gains one pgEnum column per Look setting above (12),
  each NOT NULL with its default; drizzle migrations with a human-gated shared
  apply. Precedent: `header_control_style`, `language_switcher_style`.
- **Sanity**, additive: navigation sub-item groups, footer groups, about text,
  address, fine-print items, the Cookie settings module.
- **Sanity, expand/contract**: the tagline move. Expand copies
  `brand.tagline` into `settings_navigation` and keeps the old field; the web
  and RSS read the new one; contract removes the old field in a later release
  (filed `prio:later`).

## Copy

| String                                                              | Where           | Classification                              |
| ------------------------------------------------------------------- | --------------- | ------------------------------------------- |
| "Posts you saved to read later", "Name, sign-in methods, your data" | Hub tiles       | Fixed (decided)                             |
| Busy labels such as "Sending…"                                      | Busy buttons    | Fixed; reuse existing keys where they exist |
| Cookie settings module heading                                      | Module          | Fixed; reuse `consent.preferences.heading`  |
| Saved status after Save                                             | Module          | Fixed (proposed)                            |
| Floating button name                                                | Floating button | Fixed; reuse `consent.footerSettingsLabel`  |
| Names for two footer navigation landmarks                           | Footer          | Fixed (proposed)                            |
| Look page labels                                                    | Platform        | Platform UI, never Voice                    |

## Cost

None new. The Look columns ride on the `site_config` row the site already reads
per request; the footer and navigation loaders project a few more fields; the
module and the floating button run in the browser with no new requests.

## Epics

- #6056 — account button, panel, phone placement and sign-in panel.
- #6065 — busy buttons and spinner.
- #6073 — header layout, sub-menus, bar and the tagline move.
- #6082 — footer content, layout, background, surface and the three cookie-settings entry points; reworks #5086, #5087, #3726 and #5101 (still under #5085), and #5021.

Each epic's Order is the PR sequence, one layer per PR, each merged before the next.

## Done when

Each epic's final PR updates `docs/features/look.md`,
`docs/features/navigation.md`, `docs/features/reader-auth.md`,
`docs/features/footer-and-legal-pages.md` and
`docs/features/consent-and-analytics.md` as its area ships, and the last one
deletes this doc.
