# The Team page

Design of record for the Team page (`/dashboard/team` for the owner,
`/tenants/{id}/team` for an operator), approved by the owner on 2026-11-18
(#7156). Behaviour is the epic's (#5151, "Who may act" and "Decided 2026-11-18
(owner): the Team page details") and `docs/features/tenant-access.md`'s. This
doc holds every value the build needs; the canvas
(https://claude.ai/artifact/WpcTALTNhFsqEVkufSHzUw) is owner-only and is a
visual cross-check, never the only source of a value.

| Board              | What it decides                                                      |
| ------------------ | -------------------------------------------------------------------- |
| `Main`             | The page, live: every action below can be pressed                    |
| `StateDefault`     | Members, 2 of 3 seats used, Invite editor in the header              |
| `StateInviteOpen`  | The invite dialog                                                    |
| `StateInviteError` | The invite dialog with a refused address                             |
| `StateInviteSent`  | The success toast, the new pending invite, the seats now full        |
| `StateEmpty`       | The owner alone                                                      |
| `StateSeatLimit`   | All seats used: Invite editor disabled, the warning under the header |
| `StateRemove`      | The remove-member confirmation                                       |
| `StateCancel`      | The cancel-invite confirmation                                       |
| `StateAccess`      | The Studio access states on a member row                             |

Every state board shows the page at 1440 Light, 1440 Dark, 390 Light and 390
Dark. Colours are the `platform-*` tokens, type is Inter.

## Where a primitive and the boards differ, the primitive wins

Decided by the owner on 2026-11-18, all recorded on #5151: first for
alerts, badges, button sizes, toasts and the disabled button, then for table
rows, the dialog shape and avatar initials. The build does not restyle a
primitive to match a board:

| Board draws                                                  | Built as                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| Table cells padded 10/18, a filled head row                  | `DataTableShell`'s own padding (14px), head and row hover  |
| Buttons md 36px, sm 32px                                     | `Button` md 32px, sm 28px; 44px below `md` (Phone)         |
| Disabled primary in a locked style                           | `Button`'s `isAriaDisabled` look (45% opacity)             |
| WARNING alert with no border and the title inline            | `Alert` `WARNING` as it is: bordered, title above the body |
| INFO alert in neutral grey                                   | `Alert` `INFO` as it is: brand-tinted                      |
| "Invite sent" badge in `brandInk`                            | `StatusBadge` tone `brand`                                 |
| Toasts 380px with no colour bar                              | The platform toast: 400px with its tone bar                |
| Dialog 460px with a header bar, 18px padding, divided footer | The shared dialog shell (see Dialogs)                      |
| One-letter avatar                                            | `Avatar`'s own initials from the address                   |

## Who may act

- Invite, remove and cancel: the tenant's OWNER or any operator
  (`requireTenantManager`, the gate every settings save uses).
- Check now and Resend invite: the tenant's OWNER or a SUPERADMIN
  (`requireTenantOwnerOrAdmin`). Other operators see no Check now or Resend
  invite button on any row, the owner's included; the badge and hint stay.
- An editor or reader never reaches the page: the sidebar hides it and the
  route 404s.

## Data

- **Seats**: `seats` is the plan's `PLAN_ENTITLEMENTS` seats. `used` is counted
  exactly as `create-membership-invite/seat-limit.ts` counts: every membership,
  locked ones included, plus every pending invite, a pending OWNER invite
  included. "Full" means `used >= seats`. After a downgrade `used` can exceed
  `seats`; the header then shows `seats` of `seats`, as the boards cap it,
  and the locked rows show the overflow.
- **The owner's row** reads its Studio state from the tenant's owner access
  flow (the one the Studio page shows today), not from the membership.
- **A member's row** reads its Studio state, `lockedAt` and role from the
  member list, which returns locked members too.
- **Dates** are `formatDate(date, locale)` inside `<time dateTime="{ISO}">`.
  "Today" is the server's calendar date: `formatDate` sets no `timeZone`, so
  the date and "today" both follow the server, not the viewer.
- **Addresses** are shown lower-cased, as stored.

## Page

`PageHeader`:

- `title` "Team".
- `description` "The people who write and publish this site's content with
  you in Studio."
- `actions`, in this order:
  - `Text variant="meta"`: "{used} of {seats} seats used" (ICU plural on
    `seats`: "1 seat", "{n} seats");
  - a primary `Button` (md) with the plus icon: "Invite editor". It opens the
    invite dialog. When full it is `isAriaDisabled`, `aria-describedby` the
    seat notice, and pressing it does nothing.

Below the header, only when full: an `Alert` `WARNING` with title "Every seat
is in use" and body "{plan name} includes {seats, plural, one {# seat} other
{# seats}}. Remove a member or cancel an invite to invite someone else."
The boards' "All 3 seats on Growth are in use." is reworded to keep the
notice title a short phrase (`platform-ui-practices`); this is a rule fix, not
an owner decision.

Then Members, then Pending invites (only when one is listed), in the shell's
`gap-6` stack.

## Tables

Both tables are `DataTableShell` in its card. The shell gains these as
opt-in modes; a caller that does not set them is unchanged:

- a title row: the title as a heading with `tabIndex={-1}` (the focus target
  when a row is gone), a `Text variant="meta"` count beside it, an optional
  supporting line under it;
- a note under the rows;
- column widths: Person `1.5fr`, Role `96px`, Studio access `1.7fr`, actions
  `128px`, gap 16px;
- a stacked mode below `md` (Phone), which the Team page's two tables turn
  on. Other tables keep scrolling sideways; `TenantsTable` sorts from its head
  row, which the stacked mode hides.

At 820px the four columns share about 556px of content width; an address
wraps (`break-words`) rather than truncates, there and everywhere.

## Members

Title "Members", count "{n, plural, one {# person} other {# people}}". Owners
first, then members by when they joined. Columns: Person, Role, Studio access,
and an unlabelled actions column.

Each row:

- **Person**: `Avatar` variant `MEMBER` (32px, round, neutral fill:
  `platform-pill-neutral` with `platform-muted` text), the address
  (13.5px, weight 500), and, on the signed-in user's own row only, "(you)" in
  `Text variant="meta"`. The second line, 12px `platform-muted`: "Joined
  {date}", or "Joined today". An operator sees no "(you)". A member with no
  address shows "No email on file" in muted text, and the avatar shows "?"
  (`Avatar` renders nothing for no name today; P adds the "?").
- **Role**: "Owner", "Editor" or "Reader".
- **Studio access**: as below.
- **Actions**: a ghost `Button` sm "Remove", accessible name "Remove {email}"
  ("Remove this member" with no address). Absent on the signed-in user's own
  row and on the tenant's last owner.

### Studio access on a row

The badge, its hint beside it (12px `platform-muted`), and its buttons
under it. The buttons show only to the OWNER and a SUPERADMIN.

| Row                                  | `StatusBadge` tone and label | Hint                                              | Buttons (sm), in order                         |
| ------------------------------------ | ---------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| `READY`                              | `ok` "Ready"                 | none                                              | none                                           |
| `INVITE_SENT`                        | `brand` "Invite sent"        | "Waiting for them to accept the Studio invite"    | Check now (primary), Resend invite (secondary) |
| `ACTIVATING`, or no Studio state yet | `neutral` "Setting up…"      | "Accepted — editing rights usually take a minute" | Check now (secondary)                          |
| `STALLED`                            | `warn` "Needs attention"     | "Not accepted in 3 days, so we stopped checking"  | Resend invite (primary), Check now (secondary) |
| Locked (`lockedAt` set), any state   | `warn` "Locked"              | "Over your plan's seats"                          | none                                           |
| Reader                               | none                         | "No Studio access"                                | none                                           |
| No address                           | as its state                 | as its state                                      | none                                           |

A member who has just joined has no Studio state until the worker's hourly
check sends the first Studio invite; the row reads "Setting up…" with Check
now, and no new trigger is built. A locked member still counts as a seat and
can be removed.

The buttons are `OwnerAccessActions`, generalised to take a member; the order
and emphasis are its own. Pending labels "Checking…" and "Sending…". On this
page every row's toasts name the address: success "Checking {email}'s Studio
access now. Refresh in a minute to see the result." and "A new Studio invite
is on its way to {email}."; failure "Couldn't reach the setup service — try
again."

### Empty note

Shown under the rows whenever there is no editor, whatever is pending. 13.5px
`platform-muted`, centred. `free` is `seats − used`, never below 0:

- `free` 0: "No editors yet. Every free seat is held by a pending invite."
- otherwise: "No editors yet. Invite up to {free, plural, one {# person} other
  {# people}} to write and publish in Studio with you."

### No members

An operator viewing a tenant whose owner hasn't joined sees the Members card
with no rows and the shell's empty message "No one has joined this site yet."
The empty note does not show then.

## Pending invites

Shown only when a listed invite exists. Title "Pending invites", supporting
line "Each takes a seat until they join or you cancel it.", count "{n, plural,
one {# invite} other {# invites}}". Oldest first. A pending OWNER invite is
never listed (it moves with the owner email) but still counts in `used`.

- **Person**: `Avatar` variant `PENDING` (32px, round, no fill, a 1.5px dashed
  `platform-control-line` ring, `platform-muted` text), the address, and
  the second line "Invited {date} · hasn't joined yet" or "Invited today ·
  hasn't joined yet", each one whole ICU message.
- **Role**: "Editor".
- **Studio access**: "Starts once they join" (12px muted), no badge.
- **Actions**: a ghost `Button` sm "Cancel invite", accessible name "Cancel the
  invite to {email}".

## Dialogs

Two shared shells, both changed for every caller:

- **`AlertDialogShell`** (confirmations) as it is: `max-w-md`, `p-6`, centred
  from `md` up.
- **A new modal `Dialog` block** in `components/shared/dialog`, on Base UI's
  Dialog, with the same width, padding and backdrop as `AlertDialogShell`, a
  title, optional description, body and footer.

Both, below `md`, sit at the bottom of the screen 16px from the side and
bottom edges, with the footer buttons full width and stacked, the primary or
danger one on top. Escape and a backdrop click close a dialog, except while it
is sending, when both buttons are disabled and Escape and the backdrop do
nothing. Focus is trapped, and returns where each section below says.

A failure inside any dialog shows as an `Alert` `ERROR` above the footer, and
the dialog stays open.

## Invite dialog

The new `Dialog`, title "Invite an editor", in this order:

1. `Alert` `INFO`: "An editor can edit, publish and delete all of the site's
   content in Studio. They can't change its look, settings or billing."
2. `FormField` label "Email address", hint "We'll email them a link to join.
   The invite takes a seat until they join.", a `TextInput` `type="email"`,
   placeholder "name@example.com". It opens empty and focused. Below `md` the
   input is 44px tall with 16px text.
3. Footer: secondary "Cancel", primary "Send invite" (pending "Sending…").

The address is trimmed and lower-cased before it is checked; errors name it in
that form. Typing clears a field error. Cancel closes the dialog and clears the
field. Focus returns to "Invite editor".

| Case                                                                 | Shown as        | Copy                                             |
| -------------------------------------------------------------------- | --------------- | ------------------------------------------------ |
| Not an email address                                                 | field error     | "Enter an email address, like name@example.com." |
| Already a member, or an invite already accepted (`ALREADY_CONSUMED`) | field error     | "{email} is already on the team."                |
| Already invited (`ALREADY_PENDING`)                                  | field error     | "{email} already has an invite waiting."         |
| Seats filled meanwhile (`SEAT_LIMIT`)                                | field error     | "Every seat on {plan name} is in use."           |
| Not saved, or saved and its email failed                             | `Alert` `ERROR` | "Couldn't send the invite — try again."          |

When the invite is saved but its email fails, the invite is cancelled before
the error shows, so trying again creates and sends a fresh one.

On `CREATED` with the email sent the dialog closes, the toast reads "Invite
sent to {email}.", and the page refreshes: the invite appears under Pending
invites and the seat count moves.

## Confirmations

`ConfirmDialog` with a danger confirm, which gains, for every caller: a keep
label in place of the fixed "Cancel", shown as a secondary button; a pending
label on the confirm; and the in-dialog failure above. A long address in a
title wraps.

- **Remove a member**: title "Remove {email}?", description "They lose access
  to this site's admin and to Studio straight away, and their seat is freed.
  The content they wrote stays on the site.", actions "Keep member" and "Remove
  member" (pending "Removing…"). Success: the dialog closes, toast "{email} was
  removed. Their Studio access is being revoked." Already gone: the dialog
  closes, toast "{email} is no longer on the team.", the page refreshes.
  Failure, in the dialog: "Couldn't remove {email} — try again."
- **Cancel an invite**: title "Cancel the invite to {email}?", description "The
  link in their email stops working and the seat is freed. You can invite them
  again later.", actions "Keep invite" and "Cancel invite" (pending
  "Cancelling…"). Success: toast "The invite to {email} was cancelled."
  Already gone: toast "That invite is no longer pending.", the page refreshes.
  Failure, in the dialog: "Couldn't cancel the invite — try again."
- **Refused** (only reachable through a stale page): removing yourself, "You
  can't remove yourself from the team."; removing the last owner, "A site
  always keeps one owner, so {email} can't be removed." Both show in the
  dialog.

Keep closes the dialog and changes nothing; focus returns to the row's button,
or to the table's title when the row is gone. Without an address, "{email}"
reads "this member".

## Phone (below `md`)

- The header's actions wrap under the title, left-aligned; "Invite editor" is
  44px tall.
- The table head row is hidden and each row stacks: Person, with the role
  moved onto the second line as one ICU message ("Joined {date} · Owner",
  "Invited {date} · hasn't joined yet · Editor"); then the badge and hint;
  then the Studio buttons at 44px; then Remove or Cancel invite, left-aligned.
  An empty actions cell is not rendered.
- Dialogs as in Dialogs.
- Toasts span the width, 16px from the edges.

## Sidebar

- Owner (`dashboardNavSections`): Team leaves Configuration for the Account
  group, before Billing, on plans whose `seats` is more than 1; current on this
  page. The nav takes the viewer's role, so an editor never sees it.
- Operator (`tenantNavSections`): a new "Account" section after
  Configuration, holding Team alone, on every plan. The operator menu has no
  Billing entry; this is where one would sit (owner, 2026-11-18).

## Copy

Platform UI copy, never Voice. Every string is a whole ICU message in the
platform catalogues — no sentence is joined in code. The build writes
en/de/es/fr/nl together; nothing waits on a translator. Owner-facing copy says
"Studio invite", never "Sanity invite", and never names Sanity's roles or
plans.
