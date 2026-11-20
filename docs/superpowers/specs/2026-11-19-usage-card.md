# The Usage card

Design for the Usage card on the Overview (#7693, epic #7692): one card that
shows each metered allowance a site has and how much of it is used, on the
owner's `/dashboard` and the operator's `/tenants/{id}`. This doc holds every
value the build (#7694 db, #7695 platform-app) needs. The mock
(`docs/design-reference/usage-card-mock.html`, published at
https://claude.ai/artifact/Vd38kkcfgL6zydfV5soGQb) is a visual cross-check,
never the only source of a value.

| Board               | What it decides                                         |
| ------------------- | ------------------------------------------------------- |
| 1 Owner Overview    | Placement on `/dashboard`, a Growth site, normal state  |
| 2 Operator Overview | Placement on `/tenants/{id}`                            |
| 3 States            | Near, used up, nothing used, failed read, Free, granted |
| 4 Phone             | 375 wide, normal and mixed near/used-up                 |
| 5 Rows              | Every row's copy, link and when it shows                |

Colours are the `platform-*` tokens, type is Inter. Where a shared primitive
and the mock differ, the primitive wins.

## Placement

- **Owner Overview** (`OwnerHomeView`): after Your site, before the Domain and
  Owner pair. Order: header, archived notice, trial notice, Site setup, Get
  started, Your site, **Usage**, Domain + Owner, Make it yours.
- **Operator Overview** (`TenantOverviewView`): after Grants, before Findings.
  Order: header, provisioning section, Grants, **Usage**, Findings, the
  two-column grid.
- Every role that can open the Overview sees it: the owner, every member who
  reaches `/dashboard`, and every operator role. The copy is the same for
  owner and operator.
- The card is not shown for an archived tenant.

## Card

- Shared `Card`. `Card.Header` title "Usage" (h2, `cardTitle`), supporting text
  "What your plan includes and how much is used." No header action.
- `Card.Body` with no padding. Rows form a band: one column below `md`, two
  columns from `md`, rows filling left to right; an odd last row spans both
  columns. Rows are separated by a 1px `line-2` border (top between rows,
  left between the two columns), as Your site's band cells are.
- `Card.Footer`, owner on Free and Starter only: the info icon (`ICONS.INFO`,
  `md`, `muted`) and "Your plan sets these limits." followed by the text link
  "See what each plan includes" to `pricingPageUrl(marketingSiteUrl)`. No
  upgrade button on the card; Billing is the one place to change plan. The
  operator view has no footer.
- Built from a list of meters: each entry gives its label key, used count,
  allowance, whether it is monthly, its link (or none) and whether a grant
  raised it. A new metered feature adds one entry and no new card.

## Rows

Rows appear in this order. Each allowance is plan plus open grants
(`resolveTenantEntitlements`), never the plan record alone. A row shows only
when the plan or a grant includes it (decided, owner, 2026-11-19); a row
with nothing used still shows, as "0 of {n}".

| Row label               | Value                         | Link        | Shows when                              |
| ----------------------- | ----------------------------- | ----------- | --------------------------------------- |
| AI takeaways this month | `{used} of {allowance}`       | none        | Always (Free 5, Starter 20, Growth 100) |
| Emails sent this month  | `{sent} of {allowance}`       | Subscribers | `NEWSLETTER` in the entitlements        |
| Team seats              | `{used} of {seats}`           | Team        | `seats` above 1                         |
| Additional languages    | `{live} of {localeLimit − 1}` | Languages   | `localeLimit` above 1                   |

- **Takeaways**: used is this UTC month's `takeaway_generation_counts` count;
  allowance `takeawaysPerMonth`.
- **Emails**: sent is this UTC month's newsletter post sends only
  (`countEmailSendsThisMonth(tenantId, EMAIL_TYPE.NEWSLETTER_ISSUE)`), the
  same number the Subscribers page shows; magic links and other mail are not
  counted. Allowance is the one the worker's send gate enforces, from the
  site's stored band ceiling (the first band when none is set) at Growth's
  rate for a granted Newsletter, read through `@shinefold/db`'s newsletter
  limits read (#7736), so the card never disagrees with what is sent. The
  label matches the Subscribers page's meter name.
- **Seats**: `countSeatsInUse` (#7736), built from the same SQL as
  `create-membership-invite/seat-limit.ts`, and shown as the Team page shows:
  every membership (the owner's own included, locked ones included) plus
  every pending invite, a pending OWNER invite included. Nobody is counted
  twice.
- **Links arrive with their pages** (decided, owner, 2026-11-20): the card
  (#7695) ships the emails and seats rows without links. #7164 adds the
  Subscribers link and #7169 the Team link, each with its page.
- **Languages**: live additional locales, so the default is not counted.
- Numbers use the viewer's locale grouping ("4,180 of 15,000").

### Notes

The line under each meter. `{d MMMM}` is the first day of the next UTC month
in the viewer's platform language, with no year ("1 December").

| Row       | Under 80%                                      | 80–99%                                         | 100%                                                 |
| --------- | ---------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Takeaways | Resets on {d MMMM}                             | {pct}% used — {left} left · Resets on {d MMMM} | All used. New posts get no takeaways until {d MMMM}. |
| Emails    | Resets on {d MMMM}                             | {pct}% used — {left} left · Resets on {d MMMM} | All used. New posts aren't emailed until {d MMMM}.   |
| Seats     | Counts the owner, members and pending invites. | {left} seat left. / {left} seats left.         | All seats in use. Remove someone to invite another.  |
| Languages | Your default language isn't counted.           | {left} language left. / {left} languages left. | All in use. Remove one to add another.               |

`{pct}` rounds down, so 99.6% reads 99% and only a full allowance reads as
used up. Used above the allowance (a downgrade, a lowered grant) counts as
100%, and the value is capped as the Team page caps it: "{allowance} of
{allowance}", never "4 of 3".

**Emails paused for the month.** When the site's sending is paused for the
month (the Subscribers page's "Paused: month used" state: a post was skipped
because it no longer fit whole), the emails row shows its used-up state
whatever the percentage: count and fill `bad`, note "Sending paused until
{d MMMM}." It reads the same paused state the Subscribers page reads, so the
two pages never disagree. A band pause shows on the Subscribers page only.
That state is built for the Subscribers page, so #7164 adds it to the card
(decided, owner, 2026-11-20); until then the emails row follows the
percentage alone.

## Row anatomy

- Padding 16 top, 18 sides, 18 bottom from `md`; 14/16/16 below `md`. Gap 8.
- Top line: label 12.5/18 `muted` 400; then, when a grant raised the allowance,
  `GrantedBadge` ("Granted", or "Granted until {date}"); then the link, right
  aligned, the shared `TextLink` at 12.5/18. The label is plain text, not the
  link.
- Value: the used count 24 (`text-platform-24`) 700 tabular, as the
  Subscribers page's limit cards, then "of {allowance}" 14/20
  `muted`. The count is `warn` at 80–99% and `bad` when a monthly row is used
  up; `warn` when seats or languages are full.
- Meter: `role="meter"`, `aria-valuemin` 0, `aria-valuemax` the allowance,
  `aria-valuenow` the used count capped at the allowance, named by the row
  label. 8 tall, radius full, track `line`. Fill `brand` under 80%, `warn`
  80–99%, `bad` at 100% on monthly rows, `warn` at 100% on seats and
  languages. The fill end is rounded below 100% and square at 100%.
- Note: 13/18. Under 80% `muted` 400; near `warn` 500; used up `bad` 600 on
  monthly rows, `warn` 500 on seats and languages. In a near note the reset
  part stays `muted` 400 after a `faint` "·" separator. The near note is one
  ICU message with rich-text tags for the muted part and the separator, never
  two strings joined in code.

## States

- **Normal, near, used up**: per row, at the thresholds above. One row's
  state never changes another's.
- **Nothing used**: "0 of {n}" with an empty track and the under-80% note.
  There is no empty card, because the takeaways row always shows.
- **Failed read**: that row keeps its label and link and drops the value,
  meter and note for the warning icon (`ICONS.WARNING`, `md`, `warn`) and "Couldn't load this
  count. Reload the page to try again." in 13/18 `muted`. The failure is
  logged once with the meter's name; the rest of the card and the Overview
  render. When the entitlements themselves cannot be read, the card is left
  out and the failure logged.
- **Loading**: the card streams behind `Suspense` with `DetailCardSkeleton`
  (4 rows) so the Overview's other cards are not held back.

## Phone

Below `md` the card is full width in the Overview's single column, rows
stacked in one column in the same order, 16 side padding. Copy is unchanged
and the reset date keeps its full month name.

## Copy

All strings in the `usageCard` namespace of the platform catalogues, in all
five locales. English:

- `title` "Usage"; `description` "What your plan includes and how much is
  used."
- Labels: "AI takeaways this month", "Emails sent this month", "Team
  seats", "Additional languages".
- Emails paused note: "Sending paused until {d MMMM}."
- Value: "{used} of {allowance}".
- Links: "Subscribers", "Team", "Languages".
- Notes as the table above.
- Failed: "Couldn't load this count. Reload the page to try again."
- Footer: "Your plan sets these limits." and "See what each plan includes".

## Decisions

Decided by the owner on 2026-11-19:

1. **Operator placement**: after Grants, before Findings.
2. **Full seats and languages**: `warn`, not `bad`; nothing stops working
   when they are full.
3. **Free and Starter footer**: the plan-comparison link, owner only, with no
   upgrade button on the card.
4. **Rows the plan does not include**: hidden. A row with nothing used still
   shows, as "0 of {n}".
5. **Takeaways row link**: none until the Studio regenerate control (#7614)
   gives it somewhere to point.

Calls this spec made, listed so the owner can confirm or change them
(2026-11-19):

6. **Owner placement**: after Your site, before the Domain and Owner pair.
7. **Archived tenant**: no Usage card.
8. **Emails row and the switches**: it shows whenever `NEWSLETTER` is in the
   entitlements, even with Newsletter off in Features or sending switched off.
9. **Percentages**: round down; used above the allowance reads as 100% with a
   capped value.
10. **Failures**: a failed count shows that row's warning; when the
    entitlements cannot be read, the whole card is left out.
11. **Phone dates**: the reset date keeps its full month name ("1 December"),
    where the Subscribers phone layout shortens it.
