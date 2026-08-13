# Admin Panel (`apps/admin`) — Product & Page Design

> **Companion to**
> `docs/superpowers/specs/2026-08-13-tenant-config-postgres-admin-design.md`
> (infrastructure: Next.js, deployment, data model, session sharing). This doc
> is the product surface — what pages exist, who sees them, and the
> interaction patterns that make this a purpose-built tool rather than a
> generic settings form. Intended as the design-implementation brief for
> whoever (agent or human) builds `apps/admin`'s UI.

## Two personas, two sections — not one flat app

`apps/admin` serves two different people with two different role systems
already designed elsewhere in this repo — the nav is built around that split
from day one, not discovered later:

- **Platform** section — gated by the `admins` table (#1203:
  `superadmin`/`admin`/`moderator`, global, not tenant-scoped). This is us,
  the platform operators.
- **Tenant** section — gated by `memberships` (multi-tenant doc:
  `OWNER`/`EDITOR`/`READER`, scoped per tenant). This is the customer,
  configuring their own site. A user who belongs to multiple tenants (once
  that's possible) needs a tenant switcher to pick which one's Tenant section
  they're viewing — out of scope to build today (one tenant exists), but the
  nav/routing shape should not assume "there is exactly one tenant forever."

## Platform section

**Tenant list** — every tenant, searchable, with status (active/suspended)
and plan (Free/Growth) visible at a glance. Read-heavy, no live-preview
concerns.

**Add tenant — a wizard, not a form.** This is a UI over the provisioning
flow the multi-tenant doc already designed: create the Sanity project → seed
initial content → deploy the Studio → insert the `tenants`/`memberships`
registry rows → map the domain. Several of these steps are slow and
asynchronous (Sanity project creation, Studio deployment) — the wizard needs
per-step progress state, not a single submit-and-wait. Design it as discrete
steps with clear pass/fail per step, resumable if one step fails partway
(don't force starting over from a failed DNS-mapping step after the Sanity
project already succeeded).

## Tenant section

Seven tabs/pages. Two ship this milestone (Look, Voice); the rest are
designed now so routing/nav doesn't need reshaping when they're built later —
named explicitly per-item below.

### Look (this milestone)

**Basic** (prominent, what most tenants touch):

- Preset picker (`CONSOLE`/`EDITORIAL`) — the one control nearly every tenant
  uses.
- Accent hue — not a bare number input. A color picker with a **live swatch**
  that updates instantly as the hue changes.
- Logo upload.

**Advanced** (collapsed/secondary by default — real controls, just not
equal-weight with Basic):

- Heading font / body font — each option in the picker renders its own name
  _in that font_ (e.g. "Fraunces" displayed in Fraunces), not a plain text
  list.
- Radius scale, density.

**Live preview, two tiers, both real:**

1. **Inline/instant** — small live samples next to the controls themselves
   (the swatch, a couple of actual `@blog/ui` primitives like `BrandMark` or
   a button) driven directly by in-progress form state via CSS custom
   properties. This works _because_ `@blog/ui` is pure and prop/token-driven
   with zero Sanity dependency — the same components the real site renders
   can render live on this page, fed unsaved values. No save, no reload.
2. **Full-page** — a reserved panel/route showing an iframe of the actual
   live site. Needs an actual save (or a preview-mode URL) to reflect —
   different tier, different purpose (see real layout/content context, not
   just the isolated control). Reserve the UI space and routing for this now;
   the live-update mechanism itself is a build-time decision, not a layout
   one — don't block shipping Look/Voice on it being fully solved.

### Voice (this milestone)

Same Basic/Advanced split. Basic: nothing required — preset choice already
determines the default voice, most tenants never open this tab. Advanced: the
curated fields, grouped exactly the way the (retired) Sanity schema grouped
them — 404 page, terminal prompts, bookmarks, empty states — plain text
inputs, no live-preview mechanism needed here (text doesn't benefit from the
same instant-swatch treatment color/font do).

### Domain (design now, build with this milestone or shortly after)

Primary domain, custom domain DNS verification status. Not the wizard's job
(that's initial mapping) — this is viewing/managing it post-setup.

### Email (design now, build with this milestone or shortly after)

Resend sending-domain verification status (per the companion doc's Email
section) — shows whether the tenant's custom sending domain has completed
DNS verification, not a subscriber-facing feature.

### Subscribers (not this milestone — design the shape now)

Newsletter subscriber list: search, status (active/pending/unsubscribed),
manual unsubscribe, export. Straightforward table/list UI, no live-preview
concerns. Data source: `@blog/db`'s existing `subscribers` table.

### Comments (not this milestone — design the shape now)

Moderation queue. **#1097 already specifies this precisely** — pending
comments, approve/mark-spam/delete via server actions, reusing the pure
`CommentItem` component's `actions` slot so the queue and the public thread
render identically. #1097 currently assumes `/admin/comments` lives inside
`apps/web`; it needs the same rescoping #1204 already got (see the companion
doc) to target `apps/admin` instead, once that app exists.

### Team

Manage this tenant's `memberships` — invite by email, change role
(`OWNER`/`EDITOR`/`READER`), revoke access. Standard list + invite-form
pattern, no novel interaction design needed.

### Danger zone

Deactivate/delete tenant, data export. Standard destructive-action pattern —
confirmation step, probably a type-to-confirm like the account page's
existing delete-account flow (`apps/web`'s `accountPage.privacy` section) for
consistency with an established pattern in this codebase.

## Auth & access, restated for this doc's scope

Both sections sit behind the shared `next-auth` session (companion doc:
`Domain: .valstack.dev` cookie). Platform pages additionally require an
`admins` row; Tenant pages additionally require a `memberships` row with
`OWNER` (or `EDITOR` for a subset — exact per-role page access not yet
decided; default assumption is `OWNER` for Look/Voice/Domain/Email/Team/
Danger zone, `OWNER`+`EDITOR` for Subscribers/Comments moderation, open to
revisiting once built).

## Explicitly deferred, not designed here

- `settings_features`/Phase 4's toggle UI — no tab exists for it yet; add one
  when that phase's data shape is real.
- Multi-tenant switcher UX (a user who owns more than one tenant) — the nav
  shape tolerates it existing later; the actual switcher UI isn't designed
  until it's needed.
- Platform-section billing/usage-quota dashboards — named as a plausible
  future Platform-section page in conversation, not committed to here.

## Spec sync when built

Same retention rule as the companion doc — this doc is deleted once
`apps/admin`'s pages ship and `SPEC.md`/`docs/context/content-model.md`
reflect the final shape.
