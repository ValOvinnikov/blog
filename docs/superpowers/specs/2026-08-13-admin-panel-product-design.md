# Admin Panel (`apps/platform`) — Product & Page Design

> **Companion to**
> `docs/superpowers/specs/2026-08-13-tenant-config-postgres-admin-design.md`
> (infrastructure: Next.js, deployment, data model, session sharing). This doc
> is the product surface — what pages exist, who sees them, and the
> interaction patterns that make this a purpose-built tool rather than a
> generic settings form. Intended as the design-implementation brief for
> whoever (agent or human) builds `apps/platform`'s UI.

## Read these three together — this doc alone is not sufficient

This doc deliberately says **what** each page is for and **why** it behaves the
way it does. It does not restate concrete token values, and an implementer who
works from it alone will invent them (the mock did exactly that). Pair it with:

1. **`docs/design-reference/admin-panel-mock.html`** — a complete interactive
   mock. Its information architecture, layout, and interaction model are
   approved; treat it as the visual starting point.
2. **`docs/design-reference/admin-panel-mock-corrections.md`** — 12 verified
   mismatches between that mock and this repo's real design tokens and content
   model, each with the exact correct values and the source file they came
   from. **Every concrete value — the OKLCH accent ramp, the radius and density
   options, the five selectable fonts, the 20 voice fields — lives there, not
   here.** Where the two disagree, the corrections brief wins on values and
   this doc wins on intent.

Do not copy a design-token value out of the mock without checking it against
the corrections brief first.

## Two personas, two sections — not one flat app

`apps/platform` serves two different people with two different role systems
already designed elsewhere in this repo — the nav is built around that split
from day one, not discovered later:

- **Platform** section — gated by the `admins` table (#1203:
  `superadmin`/`admin`/`moderator`, global, not tenant-scoped). This is us,
  the platform operators.
- **Tenant** section — gated by `memberships` (multi-tenant doc:
  `OWNER`/`EDITOR`/`READER`, scoped per tenant). This is the customer,
  configuring their own site. A user who belongs to multiple tenants picks
  which one they're configuring via a tenant switcher.

**Both sections, and the switcher, are built from the start — with one
tenant.** There is no single-tenant shell that gets restructured later. The
tenant list renders one row, the switcher shows one option, and every
tenant-scoped route carries a real tenant id in its path/params. This is the
whole reason the `tenants` registry is built before the config-to-Postgres
work rather than after it: a tenant list that reads a real table with one row
is honest and finished, whereas a hardcoded placeholder tenant is a fiction
that has to be torn out. See the companion doc's sequencing section.

## Platform section

**Tenant list (ships from the start)** — every tenant, searchable, with status
(active/suspended) and plan (Free/Growth) visible at a glance. Read-heavy, no
live-preview concerns. Reads the real `tenants` table; with one row it is
still a finished page, not a placeholder. Search/filter chrome can be omitted
while the list is short — the page, its route, and its data source cannot.

**Add tenant — a wizard, not a form (deferred).** Unlike the list, this
genuinely cannot ship early: it drives the provisioning flow, which depends on
the tenant _resolution_ layer (host→tenant middleware, per-tenant Sanity
client) that is deliberately sequenced later. Until then the entry point
renders **visibly disabled with a stated reason** — not hidden, and never a
wizard that half-works.

Its designed shape, for when it is built: a UI over the provisioning flow the
multi-tenant doc already specifies — create the Sanity project → seed initial
content → deploy the Studio → insert the `tenants`/`memberships` registry rows
→ map the domain. Several of these steps are slow and
asynchronous (Sanity project creation, Studio deployment) — the wizard needs
per-step progress state, not a single submit-and-wait. Design it as discrete
steps with clear pass/fail per step, resumable if one step fails partway
(don't force starting over from a failed DNS-mapping step after the Sanity
project already succeeded).

## Tenant section

Eight tabs/pages. **Only Look and Voice are built this milestone.** The other
six are designed here so routing/nav doesn't need reshaping when they arrive —
each is labelled below with whether it ships now. "Design the shape now" means
_document the intended UI_, not build a stub page; an unbuilt tab should not
appear in the nav as a dead link.

### Look (this milestone)

**Basic** (prominent, what most tenants touch):

- Preset picker (`CONSOLE`/`EDITORIAL`) — the one control nearly every tenant
  uses.
- Accent hue — not a bare number input. A color picker with a **live swatch**
  that updates instantly as the hue changes.
- Logo upload, and favicon upload beside it. The favicon must be uploaded
  **pre-cropped square**: these go to Vercel Blob, which — unlike the Sanity
  CDN this project is used to — has no on-the-fly image transforms, so what is
  uploaded is what ships.

**Advanced** (collapsed/secondary by default — real controls, just not
equal-weight with Basic):

- Heading font / body font — each option in the picker renders its own name
  _in that font_ (e.g. "Fraunces" displayed in Fraunces), not a plain text
  list. The selectable set is **closed** for a build-time reason, not an
  aesthetic one: `next/font` loaders must be static and module-scoped, so a
  font outside the list can't be chosen without a code change and a deploy.
- Radius scale, density.
- Logo hue — optional and separate from accent hue; drives the brand mark only
  and **defaults to following accent when unset**. That optionality is the
  interesting part of its UX: it needs a visible "follows accent" state, not
  just a slider pre-set to the accent value.
- Terminal chrome on/off. Its default comes from the preset, but it's a real
  independent field — and the single most visually consequential toggle here,
  since it's what makes a site read as a terminal at all.

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
determines the default voice, most tenants never open this tab. Advanced: 20
curated fields in four groups — 404 page (5), terminal prompts (7), bookmarks
(2), empty states (6). Plain text inputs; no live-preview mechanism here (text
doesn't benefit from the instant-swatch treatment color and fonts do).

**The exact 20 field names and their groupings are in the corrections brief**
(§8) — do not infer them, and do not carry over the mock's invented "Publish
confirmation" or "No search results" fields.

Every field is an **override, not a value**: empty means "inherit from the
preset's voice pack". So each input needs a placeholder showing the inherited
text, and clearing an input must read as "revert to preset" rather than "set
to blank". This is the one genuinely non-obvious interaction on the tab.

### Domain (not this milestone — design the shape now)

Primary domain, custom domain DNS verification status. Not the wizard's job
(that's initial mapping) — this is viewing/managing it post-setup.

### Email (not this milestone — design the shape now)

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
doc) to target `apps/platform` instead, once that app exists.

### Team (not this milestone — design the shape now)

Manage this tenant's `memberships` — invite by email, change role
(`OWNER`/`EDITOR`/`READER`), revoke access. Standard list + invite-form
pattern, no novel interaction design needed.

### Danger zone (not this milestone — design the shape now)

Deactivate/delete tenant, data export. Standard destructive-action pattern —
confirmation step, probably a type-to-confirm like the account page's
existing delete-account flow (`apps/web`'s `accountPage.privacy` section) for
consistency with an established pattern in this codebase.

## Component library — Base UI for behavior, `@blog/ui` for appearance

**Decision (2026-08-13): adopt Base UI (`@base-ui/react`, v1.6.0+) in
`apps/platform`.** It is the successor to Radix rather than a competitor — built
by the teams behind Radix, Floating UI, and Material UI — and covers every gap
the admin panel has: `tabs`, `slider`, `switch`, `select`, `radio-group`,
`dialog`, `alert-dialog`, `toggle-group`, `number-field`. It also ships
`Field`/`Fieldset`/`Form` primitives, which matter here because this app is
almost entirely forms; Radix has no equivalent.

**Where it lives: entirely in `apps/platform`.** Install Base UI there and style
its parts with Tailwind directly. There is no shell layer, no wrapper
components, and nothing added to `@blog/ui` for this.

```tsx
<Switch.Root className="h-6 w-11 rounded-full bg-secondary data-[checked]:bg-brand-primary-solid …">
  <Switch.Thumb className="…" />
</Switch.Root>
```

**An earlier revision of this doc prescribed pure visual shells in `@blog/ui`,
wired via Base UI's `render` prop. That was wrong and is withdrawn** (the
shells were built, reviewed, and closed unmerged — PR #1443, issues
#1435–#1438).

The reasoning that killed it: `apps/platform` is the only consumer, and **a
component with one consumer isn't shared — it's misfiled.** Putting it in the
design system buys nothing and costs an indirection layer whose only content is
a class string. This repo had already settled the same question in **#1157** —
a section organism built in `packages/ui` for `apps/web` page sections,
rejected and closed unshipped, with the app composing primitives directly
instead.

If a control genuinely repeats across admin pages later, extract it to
`@blog/ui` **then**. Moving a component out of an app is mechanical; predicting
which ones deserve it is not.

**What `@blog/ui` keeps giving you here** is the token vocabulary — the same
Tailwind theme tokens (`brand-primary-solid`, `border`, `duration-base`, …)
that its components use are what the admin panel styles Base UI with. One
design language, without a component layer in between. The Look tab's live
preview still renders real `@blog/ui` primitives fed unsaved form state; that
was always independent of where the _controls_ live.

**Explicitly rejected: shadcn/ui.** It is copy-pasted components carrying their
own styling opinions, and this repo has a mature `tailwind-variants` system
with its own tokens and `*-variants.ts` convention. Adopting it would mean
maintaining two design languages. (Noted because it is the reflexive
recommendation, and a `vercel:shadcn` skill is available in this environment.)

**Already covered by `@blog/ui` — do not rebuild:** `SegmentedControl` (preset
/ radius / density pickers), `TextInput`/`Textarea` (the 20 voice fields),
`Button`/`IconButton`, `PopoverMenu`, `SettingRow`, `StatusBadge` (tenant
status/plan), `ActionList`, `Alert`, `Spinner`, `Toast`. Consult
`packages/ui/COMPONENTS.md` before adding anything.

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
- The add-tenant wizard's step implementations — the wizard's _shape_ is
  designed above, but each provisioning step's mechanics belong with the
  tenant-resolution work that unblocks it, not here.
- Platform-section billing/usage-quota dashboards — named as a plausible
  future Platform-section page in conversation, not committed to here.

## Spec sync when built

Same retention rule as the companion doc — this doc is deleted once
`apps/platform`'s pages ship and `SPEC.md`/`docs/context/content-model.md`
reflect the final shape.
