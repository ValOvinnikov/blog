# Subscribers page and the post's send controls — build spec

Boards: [Subscribers and send controls](https://claude.ai/artifact/P28XiyiBbJVTHRwMrRVoJr), approved by the owner 2026-11-18 (#7157). Behaviour of record: epic #4083, including its "Decided 2026-11-18 (owner): the Subscribers page and send controls (#7157)" list. This page is the element inventory the build tickets point at. Where it and a board disagree, the board wins and this page is corrected.

Colours are platform tokens (`--platform-*` in `apps/platform/src/styles/platform-theme.css`), light and dark; names below drop the prefix (`warn-weak` = `--platform-warn-weak`). Type is the platform font on the platform type scale (`text-platform-*`). Every interactive target is at least 44 px tall. Sizes are px; "14/600" is size/weight.

## 0. Rules that hold across the page

- **Who does what.** The site's owner and operators see the page, remove subscribers, export, and use the sending switch (owner, 2026-11-18). Only the owner moves up a band: an operator sees the notices without the button (the note stays). Free and Starter sites have no Subscribers page and no Subscribers nav entry.
- **Notice precedence.** At most one notice shows. An operator pause beats everything, a paused notice beats a near notice, and over the subscriber band beats out of emails. "After moving up" shows only when nothing outranks it. The other limit card always keeps its normal, unpaused look.
- **The skipped post a paused notice names** is the newest post skipped for that pause's reason since the site's last sent post. With none, the post sentence is dropped.
- **Largest band.** On the 25,000 band no move-up is offered anywhere: notices drop the button and the note reads "You're on the largest band."; owner emails drop the move-up sentence. Above 25,000 subscribers the band-paused notice still shows, with that note.
- **Prices** follow the site's billing period and currency: "{price} a month more" on a monthly plan, "{price} a year more" on a yearly plan — in notices, the move-up dialog and owner emails. Prices come from the Stripe catalogue, which holds each price per currency, never hardcoded. The site's billing period and currency are stored on the tenant (`billing_interval`, `billing_currency`, written by the platform's Stripe webhook and cleared when the site drops to free), so the worker can read them without Stripe.
- **Page size** 25 rows. The boards draw 10 sample rows; 25 stands (owner).
- **CSV export** — columns `email,confirmed_at`; `confirmed_at` is a UTC ISO 8601 timestamp; one row per confirmed subscriber, newest first; UTF-8 with a header row; file name `subscribers-{site slug}-{UTC date YYYY-MM-DD}.csv`.
- **No subscriber language** is stored or shown anywhere (owner, keeping the 2026-11-11 decision).

## 1. Subscribers page — desktop (`/dashboard/subscribers`)

Shell: the tenant sidebar, "Subscribers" selected, no "Coming soon" badge. Main padding 32 top / 40 sides, sections stacked 24 apart.

1. **Header row** — the shared `PageHeader`, end-aligned, gap 16. `h1` "Subscribers" (28/700, letter-spacing −0.01em); lead 15 `muted`, 6 below the title: "{count} confirmed subscribers get each new post by email." Action: secondary button "Export CSV" with a download icon (16, gap 8), height 44, padding 0 18, radius 10, 1 px `control-line` border, `surface` fill, 14/600.
2. **Notice slot** — at most one notice, between the header and the limits (§2).
3. **Limits** — `section` with a visually hidden `h2` "Limits"; two-column grid, gap 16. Each card: `surface`, 1 px `line`, radius 12, padding 20, gap 12.
   - Label row: name 14/600 left, detail 13 `muted` right.
   - Value: number 24/700 + " of {limit}" 15/500 `muted`.
   - Meter: `role="meter"` with min, max, now and an accessible name; 8 tall, radius full, track `line`. The fill end is rounded below 100% and square at 100%. Fill `brand` under 80%, `warn` from 80%, `bad` when paused.
   - Note 13: under 80% `muted` 400; 80–99% `warn` 500; paused `bad` 600.
   - **Subscriber band** card: detail "Up to {ceiling}"; meter name "Subscribers in band"; notes "{left} more before you need the {next} band." / "{pct}% used — {left} left" / "Sending paused — {over} over". On the 25,000 band the under-80% note is "{left} more before you reach the largest band's limit."
   - **Emails this month** card: detail "Resets on {d Month}" (as the Main and Empty boards); meter name "Emails sent this month"; notes "Enough for {n} more posts to your current list." (n = floor(left ÷ count); "1 more post") / "{pct}% used — {left} left" / "Sending paused — next post needs {count}".
4. **Sending setting** — the shared `SettingRow` in a card, padding 18/20, row gap 24: label `h2` "Email new posts to subscribers" (15/600); description "Turn this off if you send your newsletter from another tool. Readers can still subscribe." (13 `muted`, 4 below); the shared `Switch` with its visible "On"/"Off" state word, label gap 10, min-height 44. Off: the card becomes a column, gap 14; the state word reads "Off", and below a 1 px `line` divider (padding-top 14) a 13 `muted` note: "Posts aren't emailed while this is off. Once it's back on, you can send a post published meanwhile with Send emails in the Studio. Export the list to use it in your own tool."
5. **List** — card with overflow hidden. Header row padding 16/20, bottom border: `h2` "Confirmed subscribers" (15/600), "Newest first" (13 `muted`) right. The shared `DataTableShell`, 14: header row on `surface-head`, cells padding 10/20, 12/600 uppercase `muted`, letter-spacing .04em — Email, Confirmed, and a 64-wide actions column whose header is a visually hidden "Actions". Rows: top border `line`, cells padding 6/20; email 500; date "{d Mon YYYY}" `muted`; a 44 icon-only remove button (18 trash icon, `muted`, radius 8) named "Remove {email}". Footer padding 12/20, top border, 13 `muted`: "Showing {from}–{to} of {count}" left; Previous and Next right, gap 8 (secondary, 44 tall, padding 0 16, radius 10, 600), Previous disabled on the first page and Next on the last. With one page there is no Previous or Next.

**Accepted differences from the boards:**

- The shared `Switch` (36×20) replaces the board's 44×24 switch (owner).
- The limit value is 24, not 26, and the empty-state heading 20, not 18, to stay on the type scale.
- Language is gone from the table (owner).
- The emails card detail reads "Resets on 1 December" on desktop everywhere; the States board's "Resets 1 Dec" is not followed.

**(unboarded) States the boards don't draw:**

- Removing: the dialog's Remove button shows the platform's pending state. On failure the dialog stays open with an error `Alert`: "The subscriber couldn't be removed. Try again."
- Export failure: an error `Alert` above the list: "The export couldn't be made. Try again."
- The sending switch saves on change and is disabled while saving. On failure it reverts and an error `Alert` shows: "The setting couldn't be saved. Try again."
- Breakpoints: the desktop layout from `md`; below `md`, the phone layout (§5).

## 2. Notices

Built on the shared `Alert` (non-note), extended with a large size: radius 12, padding 20, gap 16, a 22 icon (top-aligned, 2 down), title `h2` 16/600, body 14/1.5 (title and body 4 apart), then an action row 12 below — primary button (44, padding 0 18, radius 10, `brand` fill, `on-brand-ink`, 14/600) and a 13 `muted` note, wrapping (gap 12/16). Warn notices use `Alert`'s warning tone and a warning-triangle icon in `warn`; paused notices use its error tone (`ALERT_TYPE.ERROR`) and a pause-circle icon in `bad`.

| State                          | Role   | Title                                       | Body                                                                                                                                                                                                                                                    | Note after the button                                          |
| ------------------------------ | ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Band ≥ 80%                     | status | You're close to your subscriber band        | {count} of {ceiling} subscribers. At {ceiling}, new posts stop being emailed until you move up or the list shrinks. Posts still publish and readers can still subscribe.                                                                                | Or do nothing — you're never charged without this click.       |
| Emails ≥ 80%                   | status | You've used most of this month's emails     | {sent} of {allowance} sent. A post goes out only if it fits whole — your next one needs {count} and {left} are left, so {one / two / no} more fit{s}. The allowance resets on {date}.                                                                   | {next allowance} emails a month. Or do nothing.                |
| Paused: over band              | alert  | New posts aren't being emailed              | You have {count} subscribers and your band is {ceiling}. "{post title}" ({d Mon}) was published but not emailed. Once you're within your band, send it with Send emails on the post in the Studio. Posts still publish and readers can still subscribe. | Or remove subscribers until you're at {ceiling}.               |
| Paused: month used             | alert  | New posts aren't being emailed until {date} | "{post title}" needed {count} emails and {left} were left this month, so it wasn't emailed — posts are sent whole or not at all. Sending starts again on {date}; once the allowance covers it, send it with Send emails on the post in the Studio.      | {next allowance} emails a month, from now. Or wait for {date}. |
| After moving up                | status | —                                           | **You're on the {ceiling} band.** Up to {ceiling} subscribers and {allowance} emails a month, starting now. Your next post will be emailed.                                                                                                             | —                                                              |
| **(unboarded)** Operator pause | alert  | Post emails are paused for this site        | Shinefold paused emailing posts on {date}. Contact support to resume.                                                                                                                                                                                   | —                                                              |

- Button label in every row that has one: "Move to {next} subscribers — {price} a month more". §0 covers yearly plans and the 25,000 band. The button opens the move-up dialog (§3).
- Number words in the emails row: "one", "two", … up to nine, then digits.
- Paused notices sit in a three-column grid beside the matching limit card: the notice spans two columns, gap 14.
- "After moving up": `Alert`'s success tone, padding 16/20, gap 14, centred, check-circle icon 22 in `ok`, no heading. Text 14/1.5 with the first sentence at 600. Shown once after the band change is stored.
- The operator pause covers `SITE_PAUSED` and a reputation stop. It has no button and no note.

**Accepted difference from the boards:** notice borders use `Alert`'s tone borders rather than the boards' hex borders, so no new `-line` tokens are added (owner, 2026-11-18).

## 3. Dialogs

Both use the platform's one dialog shell, `AlertDialogShell` (`role="alertdialog"`), with its shadow and scrim, not the boards' shadow. The move-up dialog confirms a charge, so an alert dialog fits it.

- **Move up** — `role="alertdialog"`, 480 wide, `surface`, 1 px `line`, radius 16. Spacing as the Dialogs board.
  - Title (20/700) "Move to {next} subscribers?"; lead 14 `muted` "Your new limits apply as soon as the payment goes through."
  - A definition list in a 1 px bordered box (radius 12, 14, rows padding 12/16, `muted` terms, 600 values right-aligned):
    - New limits "{next} subscribers · {allowance} emails a month" (row on `surface-head`);
    - Charged today "{prorated amount}", followed by the 13 `muted` line "The difference for the rest of this billing period, to {renewal date}.";
    - From {renewal date} "{new total} a month" (or "a year");
    - Card "{brand} ending {last4}".
  - Then 13 `muted` "Moving down a band happens at renewal, with no refund."
  - Buttons right, gap 10: Cancel (secondary) and "Pay {amount} and move up" (primary).
  - Focus starts on Cancel. Escape and the scrim close it unless a payment is in flight.
  - While paying, the primary button shows the pending state and both buttons are disabled.
  - The bank step, declined and unknown results show inside the dialog, reusing the plan-change flow's notices.
  - Owner only (§0).
- **Remove** — the shared `ConfirmDialog`, `role="alertdialog"`, 400 wide, radius 16, padding 24, gap 10: title "Remove this subscriber?" (20/700); the email (14/600, wraps anywhere); "They stop getting your posts at once. They can subscribe again from your site." (14 `muted`); buttons 12 below: Cancel and "Remove" (`bad` fill, `surface` text in light / `bg` text in dark).

## 4. Empty state

- Lead "No confirmed subscribers yet."
- Export CSV disabled with no icon (`line` border, transparent, `muted`).
- Both limit cards at 0 with their detail lines, empty tracks and no notes.
- No sending card and no list. In their place, one card, padding 56/32, centred, gap 12:
  - a 56 tile (radius 16, `brand-weak`) with a 26 mail icon in `brand`;
  - `h2` "Your first subscribers will show up here" (20/600);
  - text 14/1.5 `muted`, max 460: "Readers join from the sign-up form on your site and appear once they confirm by email. Each new post is then emailed to them.";
  - primary link button "Add a sign-up form to a page" (8 above) → the Studio's page list (`/dashboard/studio`, Pages).

## 5. Phone (390 wide)

Two boards: within limits and paused (over band), each light and dark.

- Top bar 60, `surface`, bottom border, padding 0 8 0 16: site mark (28, radius 8) + name 15/600; menu button 44 "Open menu" with a 22 icon.
- Content padding 20/16, gap 16. `h1` 24/700; lead 14 — within limits as desktop, paused "{count} confirmed subscribers."
- Export CSV full width.
- Paused notice: padding 16, gap 12, icon 20 with gap 10; title 15/600; body "You have {count} subscribers and your band is {ceiling}. Posts still publish and readers can still subscribe." (no post sentence); full-width button (min 44, padding 10/14) "Move to {next} — {price} a month more"; no note.
- Limit cards stacked, gap 12, padding 16, gap 10; value 22/700 with "of" 14. Notes 13/500, `muted` or `bad`. Band card note as desktop but "{left} more before the {next} band."; the emails card has detail "Resets {d Mon}" and no note.
- Sending card: padding 16, gap 16; `h2` 15/600, text 13/1.45 "Turn off if you send from another tool."; the shared `Switch` only, named by the heading.
- List: `h2` "Confirmed subscribers" (padding 14/16, no "Newest first"); a `<ul>`, not a table; rows padding 8/4/8/16, gap 8: email 14/500 on one line with ellipsis, then "Confirmed {d Mon}" 13 `muted` (2 below), and a 44 remove button. Footer padding 12/16, gap 8: "{from}–{to} of {count}" with Previous (from page 2) and Next.

**Accepted differences from the boards:**

- Phone meters keep `role="meter"`; the board omits it.
- The phone meter fill is square at 100%, as on desktop.
- Previous is added from page 2.

## 6. Studio — post document

Uses the Studio's own switch, tones, menu and toast (owner), not the boards' colours.

### When a site isn't sending (owner, 2026-11-19)

**Sending is on** when all of these hold: the site's plan includes Newsletter (with any grant), Newsletter is on in Features, the "Email new posts to subscribers" setting is on, the site is active (`WRITABLE_TENANT_STATUSES`) and not paused, and it is within its band. The band and the operator pause are the gate's (§9). The other four are the **off causes**, checked in this order, and the first that applies is the one the Studio shows:

| Off cause                                  | Stored skip reason (§9) | The switch, before publishing                                                           | Status once published                                                                                                                                    | Send emails                                                                      |
| ------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No Newsletter in the plan (Free, Starter)  | `NOT_IN_PLAN`           | hidden                                                                                  | hidden: the claim is recorded but never shown                                                                                                            | hidden, and never offered for this post, even after an upgrade                   |
| **(unboarded)** Site not active            | `SITE_INACTIVE`         | disabled; description "Sending is paused for this site."                                | "Sending is paused for this site.", as the operator pause                                                                                                | never offered                                                                    |
| **(unboarded)** Newsletter off in Features | `NEWSLETTER_OFF`        | disabled; description "The newsletter is off for this site. Turn it on in Features."    | "**Not emailed** — the newsletter is off in Features." and, while it is still off, the link "Open Features" → `/dashboard/features`                      | offered; disabled "Turn on Newsletter in Features to send this." until on        |
| **(unboarded)** The sending setting off    | `SENDING_OFF`           | disabled; description "Emailing posts is off for this site. Turn it on in Subscribers." | "**Not emailed** — sending was off when this was published." and, while it is still off, the link "Turn it on in Subscribers" → `/dashboard/subscribers` | offered; disabled "Turn on emailing posts in Subscribers to send this." until on |

- **On a plan without Newsletter** the field — the switch, its status and Send emails — is hidden, while the cause holds and afterwards. The post still takes a claim on its first publish, recorded as `NOT_IN_PLAN` and never shown, so it is never emailed after an upgrade: a republish finds the claim taken, and Send emails is never offered for it. After an upgrade, posts published from then on show the field as on Growth.
- The status read the Studio uses returns which off cause applies, never one "sending off" flag, so the Studio can pick the right copy and the right place to fix it (Features or Subscribers).
- A link that fixes a cause shows only while that cause still applies; the "Not emailed" line itself stays.

### The switch and the status

- **Switch field** title "Send to subscribers"; description "Emails this post to your {count} confirmed subscribers when it's first published. Later edits never send it again." ("your confirmed subscribers" while the count is loading or 0).
- With no claim — never published, or a claim the worker released (the post's switch was off, a scheduled post's site stopped sending, or the site has no mail key) — the switch shows as before publishing, or disabled as the table above says; once the post is published, Send emails sits under it.
- Once a claim exists, the switch is replaced by a read-only status (field title kept, plus a caption naming the state). Sizes as the Studio board.
  - Sent: check icon, whole line in the positive tone: "**Emailed** to {n} subscribers on {d Mon yyyy}."
  - Sending: "Sending… {done} of {n} so far." in the muted tone, no icon; before the run has counted its recipients, "Sending…" alone. It refreshes every 10 s while the document is open and stops once settled.
  - **(unboarded)** Scheduled: clock icon, muted tone: "**Scheduled** — emailed on {d Mon yyyy}." (the post's publish date).
  - **(unboarded)** Not emailed because sending was off: muted tone, per the off-cause table above (`NEWSLETTER_OFF`, `SENDING_OFF`; `NOT_IN_PLAN` shows nothing).
  - Skipped: critical-tone card: "**Not emailed.**" + reason + one sentence + link "Open Subscribers" (600) → `/dashboard/subscribers` in the same tab, then Send emails below it (band and month only). Reasons:
    - band — "Sending was paused — your site passed its {ceiling}-subscriber band." + " Once you're within your band, you can send it with Send emails. ";
    - month — "Sending was paused — this month's emails were used." + " Once the allowance covers it, you can send it with Send emails. ";
    - **(unboarded)** operator pause, reputation stop or site not active — "Sending is paused for this site.", with no further sentence, no link and no Send emails.

### **(unboarded)** Send emails (owner, 2026-11-19, #4083)

A published post is never emailed in three cases: it was skipped for a limit (band or month), it was published while sending was off (Newsletter off in Features, or the sending setting off), or it was published with its own switch off. In each, the post shows a secondary button "Send emails" under its status — under the skipped card, under the "Not emailed" line, and, for a published post with no claim, under the switch, which stays exactly as it is. It never shows on a plan without Newsletter, for a post skipped for an operator pause, a reputation stop or a site not active, or for a post that is scheduled, sending or sent. It is also hidden on every post while the site is under an operator pause or a reputation stop now; the send-now route refuses it then with `NOT_ELIGIBLE`.

- **Enabled** only once the cause is gone: sending is on (the five conditions above) and this month's emails left cover every confirmed subscriber. Otherwise it is disabled, with the reason as its description (13, muted), first that applies, naming the right place:
  - Newsletter off in Features — "Turn on Newsletter in Features to send this.";
  - the sending setting off — "Turn on emailing posts in Subscribers to send this.";
  - over the band — "Your site is over its {ceiling}-subscriber band.";
  - month — "This needs {count} emails and {left} are left until {date}."
- **Confirm first** — the Studio's own dialog. Title "Email this post to {count} subscribers?"; body "This uses {count} of the {left} emails left this month. It sends once and can't be sent again."; buttons "Cancel" and "Send emails" (primary). Focus starts on Cancel; Escape closes.
- **Then it sends like a normal first publish:** the same post email and the same gate, and it counts against the month's allowance. The status becomes Sending, then Sent. Toast "Sending to {count} subscribers."
- **Once per post.** Pressing it records the hand start on the post's claim; a post that has started sending never shows the button again. If the gate refuses the send before it starts (the allowance or band changed meanwhile), the post is skipped again with that reason, and the button comes back disabled until the cause is gone. If the run is cancelled before it sends anything (§9), the post goes back to having no claim and the button is offered again.
- **Who:** anyone who can publish the post. Owners and editors hold Sanity's administrator role once their Studio access is granted ([tenant access](../../features/tenant-access.md)), so everyone who can work in the Studio can publish, and the platform's routes are the whole check (below); the Studio adds no permission check of its own.
- Refusal toast: "This post can't be sent right now." The status then refreshes and shows why.

### **(unboarded)** The platform routes the Studio calls

The status, test-send and send-now routes admit the people who can open the site's Studio: the tenant's OWNER and EDITOR members and operators (an admin's virtual membership). A READER membership has no Studio access and is refused, and so is a membership with `lockedAt` set. The Studio's Sanity project id only selects the tenant (`getTenantIdBySanityProjectId`; the column is unique) — not the active-tenant cookie, which can name another site than a Studio open in another tab — and the caller's membership of that tenant is the check. A refusal comes back as the route's own `FORBIDDEN` code rather than a `notFound()` or redirect. The send-now route re-checks eligibility on the server with the same off-cause read as the status route.

### "Send me a test"

- First item of the document actions menu (before Duplicate and Delete), send icon, hint "Emails this post to you only".
- It sends the document as last saved (the draft if one exists, else the published version) to the signed-in user only. The Studio sends the saved fields (title, excerpt, takeaways, cover URL, slug, locale) to the platform, which validates them and never reads Sanity.
- It goes through the platform Resend account, like the existing settings test email, so it never counts against the site.
- Anyone who can open the Studio may use it, within the test-email limit: a stored count of 5 an hour and 20 a day per person, shared with the email settings test (owner, 2026-11-18).
- Success toast: "Test sent to {your email} — only you got it."
- **(unboarded)** Failure toast: "The test couldn't be sent. Try again in a minute."
- **(unboarded)** Limit toast: "You've sent the most tests for now. Try again at {time}." — the time comes from the refusal.

## 7. The post email

- Page: desktop 600 wide, padding 32/40; phone 375, padding 16/12; blocks 16 apart.
- Optional test banner (radius 8, padding 10/14, 13/600; light: a pale yellow fill and `SHINEFOLD_LOGO_COLOR.INK` text; dark: `#33290d` fill, `#ffe08a` text — fixed values in the email builder, not tenant or platform tokens): "Test email — only you got this. Your subscribers get it when the post is first published." Fixed copy, in the post's locale.
- Site name: tenant heading font, 20/600, centred, padding 8/0.
- Card: tenant surface, 1 px tenant border, radius 12. Cover full width, 280 tall desktop / 200 phone, cropped to fill. With no cover image the card starts at the inner padding, with no placeholder. Inner padding 32/36/36 desktop, 22/18/24 phone, gap 18.
- Title: tenant heading font, 34 desktop / 28 phone, 600, line-height 1.15.
- Fonts: body text in the tenant body font. The builder takes the tenant's heading and body fonts as `FONT_CHOICE` values; `@shinefold/config` maps each to an email font stack ending in a web-safe fallback (serif → Georgia, serif; sans → Arial, Helvetica, sans-serif; mono → "Courier New", monospace).
- Palette: the light palette from `resolveTenantEmailBrand`; the dark palette from a dark counterpart in `@shinefold/config` running the dark ramps with the same accent-hue guard.
- Takeaways box (only when the post has takeaways): 1 px border, radius 10, padding 16/18, gap 10; heading "Takeaways" 12/600 uppercase, letter-spacing .08em, tenant accent; list 15/1.5, indent 18, item gap 8.
- Excerpt 16/1.6 in the text colour. Button "Read the post": accent fill, on-accent text, radius 8, padding 12/22, 15/600.
- Footer centred 13/1.6 muted, padding 8/12: "You're getting this because you subscribed to {site}." then "Unsubscribe" as an underlined muted link.
- Dark: a `prefers-color-scheme: dark` block switches page, card, border, text, muted, accent and cover placeholder to the tenant's dark palette.

## 8. Owner emails

- **Shell:** platform shell, page 600, padding 32/36, gap 16.
  - Above the content in the inbox mock: subject and "From Shinefold" (13 `muted`, divider).
  - Wordmark "Shinefold" 18/700, letter-spacing −0.01em.
  - Card radius 12, padding 28, gap 16: `h1` 22/700/1.3; body 15/1.6.
- **Usage box:** `surface-head`, radius 10, padding 16, gap 10.
  - Rows: label 600 + "{n} of {limit}" right (14).
  - The triggering limit's value is in `warn` (near) or `bad` (over) at 600, with an 8 bar under it whose fill end is square.
  - The near emails also show the other limit's row, value `muted` 400, with no bar.
  - The paused emails show only the triggering row (owner).
- **After the usage box:** a closing line, then the button "Open Subscribers" (`SHINEFOLD_LOGO_COLOR.YELLOW` fill, `SHINEFOLD_LOGO_COLOR.INK` text, radius 10, padding 13/22, 15/600) → `/dashboard/subscribers`.
- **Footer:** 12 `muted` centred: "You get this because you own {site} on Shinefold."
- Both are dark-mode like §7, in a dark counterpart of `PLATFORM_EMAIL_BRAND` added in `@shinefold/email` — never the tenant's palette.
- Each kind is sent at most once a month per site (the existing limit-notice record). The two paused emails share one kind (`SENDING_PAUSED`), so at most one paused email goes out a month, whichever cause comes first.

The four emails:

- **Band near** — subject "{site} is close to its subscriber limit"; heading "You're close to your subscriber limit"; body "{site} has {count} confirmed subscribers, and its band is {ceiling}. When it reaches {ceiling}, new posts stop being emailed until you move up or the list shrinks."; usage: "Subscribers" with bar, "Emails this month" muted; closing "The {next} band costs {price} a month more and starts the moment you choose it. Nothing changes unless you do."
- **Band paused** — subject "Post emails are paused on {site}"; heading "New posts are no longer being emailed"; body "{site} passed its {ceiling}-subscriber band, so "{post}" was published but not emailed. Once you're within your band, you can send it with Send emails on the post in the Studio. Posts still publish and readers can still subscribe."; usage "Subscribers" over, with bar; closing "Move to the {next} band ({price} a month more) and your next post is emailed, or bring the list back under {ceiling}."
- **(unboarded) Emails near** — subject "{site} is close to its monthly email limit"; heading "You've used most of this month's emails"; body "{site} has sent {sent} of its {allowance} emails this month. A post goes out only if it fits whole, and the allowance resets on {date}."; usage "Emails this month" with bar, "Subscribers" muted; closing as band near.
- **(unboarded) Emails paused** — subject as band paused; heading as band paused; body "{site} has used this month's {allowance} emails, so "{post}" was published but not emailed. Sending starts again on {date}; once the allowance covers it, you can send the post with Send emails in the Studio."; usage "Emails this month" over, with bar; closing "Move to the {next} band ({price} a month more) and your next post is emailed, or wait for {date}."
- On the 25,000 band the closing line drops the move-up sentence. On a yearly plan "a month more" reads "a year more" (§0).

## 9. Send-claim states

A post's claim (`newsletter_post_sends`) is in exactly one state, and the Studio (§6) and the page (§2) read it:

| State                        | Stored as                                           | Written by                                                                                                                      |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Scheduled                    | no outcome, `scheduled_for` in the future           | worker, in its check step, which already reads the post's publish date; it updates the date when it changes (owner, 2026-11-18) |
| Sending                      | no outcome, started (recipient count set)           | worker                                                                                                                          |
| Sent                         | outcome `SENT`                                      | worker                                                                                                                          |
| Skipped for a limit or pause | outcome `SKIPPED`, the existing skip reasons        | worker                                                                                                                          |
| Not in the plan              | outcome `SKIPPED`, new skip reason `NOT_IN_PLAN`    | web, when it claims on a site whose plan, with its grants, has no Newsletter                                                    |
| Site not active              | outcome `SKIPPED`, new skip reason `SITE_INACTIVE`  | web, when it claims on a site outside `WRITABLE_TENANT_STATUSES`                                                                |
| Newsletter off               | outcome `SKIPPED`, new skip reason `NEWSLETTER_OFF` | web, when it claims while Newsletter is off in Features                                                                         |
| Sending off                  | outcome `SKIPPED`, new skip reason `SENDING_OFF`    | web, when it claims while the "Email new posts to subscribers" setting is off                                                   |
| Sent by hand, queued         | no outcome, `hand_started_at` set, not started      | platform, from Send emails (§6): it clears a `SKIPPED` outcome, or claims a post with no claim, then starts the worker run      |

**The off causes are told apart.** `NOT_IN_PLAN`, `SITE_INACTIVE`, `NEWSLETTER_OFF` and `SENDING_OFF` are the four off causes of §6, in that order. One `@shinefold/db` read returns the first that applies for a site, or none when the site sends posts; web (to pick the skip reason), the worker (to cancel or skip a run, below) and the platform (for the Studio's status and Send emails) all use it, in place of web's and the worker's own `isSiteSendingPosts`. It reads the plan's capabilities with their grants, as web does today, so plan and Features are never folded into one boolean. "Active" is `isTenantWritable` (a writable status and not deprovisioned), and a site with no Features row reads its preset's Newsletter default, as web and the Features page do. The operator pause and the band stay the gate's.

None of the four counts as a paused-notice post (§0), and none sends an owner email. `NOT_IN_PLAN` is never shown and never offered Send emails, so a post published before an upgrade is never emailed. A claim the worker releases is deleted, which is the no-claim state (§6).

**A plan or status change before a scheduled post goes out is recorded, not released.** When the worker's recheck finds `NOT_IN_PLAN` or `SITE_INACTIVE` (a scheduled post whose site moved to a plan without Newsletter, or stopped being active, before its date), it marks the claim skipped with that cause instead of releasing it, so a post that went live then is never emailed after a move back. `NEWSLETTER_OFF` and `SENDING_OFF` keep the release: the no-claim state offers Send emails either way.

A hand-started send (§6) shows as "Sending…" until the run counts its recipients. The worker runs it like a first publish, with one difference: it does not check the post's own switch, because pressing Send emails is the choice the switch records. Its gate is unchanged, so a refused hand send is skipped with the gate's reason. `hand_started_at` is never cleared while the claim exists, and the route refuses a post that has started sending or been sent.

**Only some skips can be sent by hand.** The db statement that starts a hand send accepts a `SKIPPED` claim only with `OVER_SUBSCRIBER_BAND`, `OVER_MONTHLY_ALLOWANCE`, `NEWSLETTER_OFF` or `SENDING_OFF`, or a post with no claim. It refuses `NOT_IN_PLAN`, `SITE_INACTIVE`, `SITE_PAUSED` and `REPUTATION_STOP` itself, as it refuses a claim that is queued, scheduled, sending or sent — not only through the route's pre-check.

**A cancelled hand run releases its claim.** When the run's check step cancels a hand send before anything is sent (the site stopped sending, the mail key is gone, or the post was unpublished), it releases the claim like any cancelled run. The post goes back to no claim: the earlier skip and `hand_started_at` go with it, and Send emails is offered again under the switch, disabled while the cause is there. Nothing was sent, so once per post still holds.

The Studio reads these states through a platform route, because it can import neither `@shinefold/db` nor the platform. The contract between them has one home in `@shinefold/config`, the one package both import: the state kinds, the skip reasons (moved there from `@shinefold/db`, since the Studio now reads them), the off causes, the test-send and send-now refusal codes, the response types and the route paths.
