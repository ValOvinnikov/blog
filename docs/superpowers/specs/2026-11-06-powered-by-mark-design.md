# The "powered by" mark on Free sites' footers

Design of record for #6766, under epic #5047. The boards are
`docs/design-reference/powered-by-mark-boards.html`. Open it in a browser:
every frame uses the real footer's tokens and container queries. Build tickets
are cut from this doc once the owner approves the boards. When the last build
PR merges, the final shape moves into `docs/features/footer-and-legal-pages.md`
and `docs/features/plans-and-entitlements.md`, and this doc and the boards are
deleted.

## Decided before design (owner, 2026-11-05)

- Free sites carry the mark. Growth sites do not.
- The mark is text, not a logo. It links to the marketing site.
- The product name and the link address both come from per-environment env
  vars.

## The placement rule

**The mark is always the last item of the footer's bottom row.** It comes after
`Footer.Copyright`, `Footer.FinePrint` and `Footer.Nav`. It is set like a
fine-print link and sits on the row's trailing edge (centred in Centred). On a
narrow footer, where the row stacks, it is the last line.

- Every footer layout draws the bottom row: Columns, Centred, Compact (Social
  plus the row) and Big wordmark (wordmark above the row). The copyright is
  always shown, so the row always exists. Anchoring the mark to the row means a
  later change to Free's footer layout, background or surface carries the mark
  with it.
- It is a sibling after the fine-print `nav`, never inside it, so assistive
  technology does not announce it as one of the site's own legal links.
- It is never joined to the copyright with a separator glyph.
- It is never above the divider. The brand column, link groups and wordmark
  belong to the tenant.
- It wraps whole (`white-space: nowrap`). Once the bottom row is a row (from a
  40rem footer container), a trailing-edge margin (`margin-inline-start: auto`)
  keeps the mark on the end edge when it wraps alone. When everything fits on
  one line, that margin takes the free space, so the site's own items pack to
  the start with their usual gaps. A footer without the mark keeps today's
  spread. Centred keeps its centred row and does not get the margin.

## Look

| Part           | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Type           | `font-mono text-meta` (JetBrains Mono 12px), the same as `TextLink appearance="nav"` fine-print links |
| Rest           | `text-muted`. The product name is weight 500.                                                         |
| Hover          | `text-text` over `TRANSITION_COLORS`, plus a 1px underline (offset 3px) on the product name only      |
| Focus          | The shared `FOCUS_RING` (2px `--ring`, 2px offset in `--ambient`), with no underline                  |
| Icon           | None                                                                                                  |
| Target         | The same tab, like the footer's other links                                                           |
| Forced colours | Nothing custom: system `LinkText` and focus outline                                                   |

### Contrast across accent hues

Free's footer is `BRAND_PRIMARY` (`--brand-primary-muted`), whose hue follows
the accent. Measured with `renderedContrastRatio` at all 360 hues:

| Pair on `--brand-primary-muted` | Light worst   | Dark worst     | Needs |
| ------------------------------- | ------------- | -------------- | ----- |
| `--text-muted` (rest)           | 6.04:1 @ 17°  | 5.31:1 @ 192°  | 4.5:1 |
| `--text` (hover)                | 15.36:1 @ 17° | 11.37:1 @ 192° | 4.5:1 |
| `--ring` (focus)                | 5.28:1 @ 190° | 4.85:1 @ 351°  | 3:1   |

All three pairs are already in `CONTRAST_PAIRS` (`TEXT_MUTED`, `TEXT`, `RING`)
with `followsAccentHue: true` and no known failures, so `findContrastFailures`
already guards them. No new pair or hue guard is needed.

## Copy

- `Powered by {productName}`. This is fixed, not Voice: it is the platform's
  attribution and states what the plan enforces. The owner confirms this when
  approving the boards.
- One ICU message in the site-messages catalog, added to `VOICE_FIXED_KEYS`,
  translated for every site language. The board's stress frames use Dutch,
  "Mogelijk gemaakt door", as the longest. Wording for de, es, fr and nl is
  settled in the web build ticket.
- The accessible name is the visible text. There is no `aria-label`.
- Look page, Footer card on `FREE` (platform UI copy, never Voice): "Free sites
  show “Powered by {productName}” at the end of the footer. It goes with the
  Growth plan."

## Configuration

- `PRODUCT_NAME` already exists, but only `apps/worker` reads it. `apps/web`
  needs it, and so does `apps/platform` for the Look preview and the Footer
  card line.
- A new URL variable holds the marketing-site address, read by `apps/web` (and
  by `apps/platform` only if the preview link stops being inert). The name is
  settled in the build ticket. Both are server-only, set per environment, and
  added to `turbo.json` and `docs/context/environment-variables.md`.
- If either variable is unset, the site draws no mark rather than a broken
  link, and that is logged once per request on `apps/web`, because an operator
  needs to act on it.

## Plan gating

Whether a site shows the mark comes from the tenant's plan, read the way the
Look already reads it (`getTenantPlan`), through the per-plan record of epic
#5047 (`PLAN_ENTITLEMENTS`), not a check against `FREE` at the call site. A
super-admin grant (`2026-11-05-entitlement-grants-design.md`) can then remove
the mark for one tenant without new wiring. When the plan cannot be read,
Free's rules apply, as they already do for the Look.

## Look preview

The platform's `SampleSiteFooter` draws the mark on a Free site, in the same
place and with the same component, inert like the sample's other links. It
draws no mark on Growth. The Follow outline and the "Footer" tag cover it with
no change.

## Build split (proposed — confirmed when tickets are cut)

1. `ui` — a `Footer.PoweredBy` bottom slot, rendered last in `BOTTOM_SLOTS`,
   carrying the trailing-edge rule, with a story per layout. It takes the
   label, product name and `href` as props. It never reads env vars.
2. `web` — the env vars, the plan check, the ICU message and its translations,
   and composing the slot in `SiteFooter`. Files its manual-test issue.
3. `platform-app` — `PRODUCT_NAME` on platform, the mark in `SampleSiteFooter`
   on Free, and the Footer card line.

Each ships alone and merges before the next starts. No migration, cron or paid
API call: the cost is none.

## Out of scope

- A logo or badge version of the mark.
- Letting Free hide the mark, or Growth show it.
- Click tracking or UTM parameters on the link.
