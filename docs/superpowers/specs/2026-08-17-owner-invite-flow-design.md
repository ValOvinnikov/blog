# Tenant-Owner Invite Flow — Design

**Status:** Design pass. Revises one decision from
[`2026-08-15-tenant-creation-flow-design.md`](./2026-08-15-tenant-creation-flow-design.md)
("no invite-email flow" — see that doc's Architecture step 1), which shipped
via #1563. Also lands the reusable invite mechanism the parent product design
anticipated for a later Team tab
([`2026-08-13-admin-panel-product-design.md`](./2026-08-13-admin-panel-product-design.md),
§Team) but never designed the mechanics for.

**Date:** 2026-08-17

**Scope:** Let a platform operator provision a tenant for an owner who has no
registered account yet — the owner gets an invite email instead of the wizard
blocking on "no registered user matches this email." The underlying mechanism
(a pending-invite table + sign-in-time consumption) is built role-generic and
tenant-generic so the future Team tab's "invite by email" can reuse it
unchanged. Building the Team tab itself is out of scope (see Non-goals).

## Why this changes an already-shipped decision

#1563 deliberately scoped out an invite flow as "admin-first, operator picks
an existing user." In practice this blocks the common case of provisioning a
tenant for a brand-new customer who has never signed in to the platform
before — the operator has no way to grant them ownership without a
work-around. This design keeps the existing-user path exactly as shipped and
adds the not-found path as a genuine addition, not a rewrite.

## Architecture

**Provisioning flow (`apps/admin/src/server/tenants/create-tenant-action.ts`).**
The owner-email lookup (`queries.users.getUserByEmail`) stays first and
unchanged for the found case — real user, immediate `memberships` row with
`role: OWNER`, exactly as today. Only the not-found branch changes:

1. Provisioning proceeds immediately — tenant, `tenant_domains`, Sanity
   dataset all created the same as the found case. Nothing here waits on the
   invited owner's response.
2. Instead of a `memberships` row, insert a `membershipInvites` row
   (`role: OWNER`, `consumedAt: null`) — see Data model.
3. Trigger the sign-in email for that address immediately (Auth.js's email
   provider, invoked server-side from the action — exact API to confirm via
   `use-context7` against the installed Auth.js version at implementation
   time). The operator doesn't wait for the invitee to visit the sign-in page
   and type their own email first.

The wizard's Details-step UI changes from a hard validation error to a soft
confirmation on the not-found case: the email still gets Zod's `.email()`
shape validation, but "no registered user matches this email" becomes
something like _"No account found for `{email}` — they'll be sent an invite
to sign in and manage this tenant as owner,"_ and the operator can proceed.

**Sign-in-time consumption (`packages/auth`) — the reusable part.** A new
`events.signIn` hook in the shared Auth.js config fires after _every_
successful sign-in (magic-link, GitHub, or Google; new or already-existing
user). It looks up `membershipInvites` where `email` matches the signed-in
user's verified email and `consumedAt IS NULL`. For each match: insert the
real `memberships` row (`userId` = the now-resolved user, same
`tenantId`/`role`) and stamp `consumedAt`.

This is what makes the mechanism reusable without further work: an
_already-registered_ platform user invited to a second tenant (the Team
tab's future case) gets the membership attached the next time they sign in
anywhere — no separate acceptance flow, no second token system.

**Invite-flavored email copy.** A generic "Sign in to Blog Admin" email is
meaningless to someone who has never used the product. At send-time, the
magic-link provider's `sendVerificationRequest` (`packages/auth`) checks
`membershipInvites` for a pending row matching the identifier being emailed.
If found, it swaps in invite copy (e.g. "You've been invited to manage
**{tenantName}** — sign in to get started") instead of the generic
sign-in subject/body. No new email-sending path — same Resend `sendEmail`
callback, same `verificationTokens` table, different copy only.

**Tenant status page.** `/tenants/[tenantId]`'s `ProvisioningStatusView`
gains a small status line/badge for "Owner: invited, pending" when the
tenant's OWNER row is still a `membershipInvites` entry rather than a real
`memberships` row — so an operator isn't left guessing whether the invite
went out. No new UI machinery; extends the page that already reports tenant
state.

## Data model

`packages/db` gains a new table, `membershipInvites`:

```
id          uuid PK
tenantId    uuid  NOT NULL → tenants.id
email       text  NOT NULL (normalized lowercase)
role        membershipRoleEnum NOT NULL   (reuses the existing OWNER/EDITOR/READER enum)
createdAt   timestamp NOT NULL default now()
consumedAt  timestamp NULL   (null = pending; set once a real membership is created)
unique(tenantId, email)
```

Deliberately its own table rather than making `memberships.userId` nullable:
`memberships` stays a clean "who has real access" table with a real,
non-null `userId` on every row, which is what every existing authorization
read already assumes. A pending invite is a distinct concept (no user
resolved yet), not a degraded membership.

New `db` queries: `createMembershipInvite`, `findPendingInviteByEmail`,
`consumeMembershipInvite` (inserts the real `memberships` row + stamps
`consumedAt`, in one transaction).

## Layer-contract impact

- **`@blog/db`** — new `membershipInvites` table + migration; new queries
  above.
- **`@blog/auth`** — new `events.signIn` hook (consumption logic); the
  magic-link provider's `sendVerificationRequest` gains the pending-invite
  lookup for invite-flavored copy. Both are legal — `auth → db` is an
  existing contract edge.
- **`apps/admin`** — `create-tenant-action.ts`'s not-found branch; the
  Details-step wizard UI (soft confirmation instead of hard error); a status
  badge on `ProvisioningStatusView`.
- **`@blog/config`, `@blog/service`, `@blog/ui`, `apps/web`, `apps/cms`** —
  untouched. `membershipRoleEnum` already exists; no new const pairs needed.
- Graph stays acyclic.

## Error handling & testing

- Duplicate invite to the same tenant+email hits the `unique(tenantId,
email)` constraint — the action treats that as idempotent ("invite already
  pending," not a hard error) rather than surfacing a raw constraint
  violation.
- An invited email that later signs in via a _different_ provider than the
  invite email implied (e.g. invited by email, but they authenticate via
  GitHub whose account email matches) still consumes correctly — consumption
  keys on verified email, not provider.
- A user with an existing platform account is invited to a _new_ tenant:
  `getUserByEmail` finds them, so this stays on the existing immediate-
  membership path (found branch), not the invite path — the invite path only
  fires for genuinely unregistered emails. Routing an _existing_ user through
  `membershipInvites` instead (the Team-tab reuse case) is that feature's own
  future carve-out, not built here.

Testing: `db` unit tests for the new queries, the unique-constraint
idempotency case, and `consumeMembershipInvite`'s transactional insert;
`auth` unit tests for the `events.signIn` hook (mocked db) and the
invite-vs-generic email copy branch; `admin-app` Server Action tests for both
the found and not-found branches, plus the wizard's soft-confirmation copy.

## Non-goals

- Building the Team tab itself — this design lands only the reusable
  mechanism underneath it.
- A separate invite-token/expiry system — reusing Auth.js's own
  `verificationTokens` expiry means there's no second token lifecycle to
  design.
- An explicit "Accept invitation" page/step — sign-in itself is acceptance.
- Routing an already-registered user through `membershipInvites` (vs. the
  existing immediate-membership path) — deferred to whichever future work
  actually builds the Team tab.
- Invite revocation/resend UI — not designed here; an operator can re-run
  the wizard's owner step against the same email if the first invite email
  is lost, which hits the idempotent-duplicate case above rather than
  failing.

## Spec sync when built

- `SPEC.md` — note the `membershipInvites` table and the sign-in-time
  consumption hook alongside the existing provisioning-flow description in
  §13.
- [`2026-08-15-tenant-creation-flow-design.md`](./2026-08-15-tenant-creation-flow-design.md)'s
  Architecture step 1 ("no invite-email flow") is superseded by this doc —
  note that supersession there once this ships, or delete/merge per the
  design-doc retention rule if both are fully reflected in `SPEC.md` by then.
