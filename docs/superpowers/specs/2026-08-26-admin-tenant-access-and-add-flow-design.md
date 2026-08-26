# Admin Tenant Access & Add-Tenant Flow — Design

**Status:** Design pass, approved in brainstorming 2026-08-26. Revises the
routing and role model established by
[`2026-08-13-admin-panel-product-design.md`](./2026-08-13-admin-panel-product-design.md)
and the wizard shape from
[`2026-08-15-tenant-creation-flow-design.md`](./2026-08-15-tenant-creation-flow-design.md).
Visual reference: [`../../design-reference/admin-tenant-access-mock.html`](../../design-reference/admin-tenant-access-mock.html).

**Date:** 2026-08-26

**Scope:** Reshape how a platform super admin and a tenant owner reach and read
a tenant's pages — one page set, two route trees, role-filtered — and fix the
add-tenant wizard's lost chrome and copy. Building the six `later` tenant tabs
(Email, Subscribers, Comments, Team, and the standalone Domain and Danger
pages' full feature set) stays out of scope; this design only fixes where they
live and who sees them.

## Why this exists

Eleven defects were reported against the live add-tenant flow. Triaged, they
are not eleven problems:

- **Two are console configuration**, already ticketed, and one of them blocks
  observing any of the others (see §0).
- **Five are the add-tenant wizard** having shipped without the chrome its own
  mock specifies, plus three copy strings (§4).
- **One is missing infrastructure** that already exists elsewhere in the repo
  (§5).
- **One is a genuine unexplained bug** needing investigation, not design (§6).
- **Two are the actual design problem**: `Manage →` lands on a provisioning
  screen for a tenant that finished provisioning weeks ago, and `/t/{slug}` is
  an admitted stub. Those two are symptoms of a route tree that grew a second
  copy of itself (§1–§3).

## §0 — Blocked on console configuration (not code)

Neither item below is fixed by this design, and **the first blocks verifying
any of it.**

- **#2089** — the `development` GitHub Environment's `PRODUCTION_DB_HOST`
  **Variable** holds a full `postgresql://…` connection string instead of a
  bare hostname. Since PR #2101 (`909f334d`, 2026-08-25 18:24) added the
  shape guard, `deploy-development.yml`'s `Migrate dev database` job
  hard-fails, which **skips `Deploy dev admin`**. Nothing has reached
  admin-dev since 2026-08-25 19:01.

  This is why "super admin still has no access to the tenant detail page"
  presents as a code defect and is not one: the SUPERADMIN bypass
  (`isSuperAdmin` + `requireTenantMembership`'s virtual OWNER membership)
  merged as `545a7c71` / #2109 and is correct. It has never been deployed.

- **#2090** — `TENANT_REGISTRY_DATABASE_URL_DEV`/`_PROD` exist as
  **Variables** where the workflows read **Secrets**, so every provisioning
  dispatch fails. Note the deliberate asymmetry these names invite confusion
  about: _both_ live on the **`production`** Environment, because there is one
  credentials store and the workflow's `environment` input selects between
  them. `_DEV` in the name refers to which Neon branch it points at, not which
  Environment it lives in.

A consequence worth recording: **#2052's evidence is stale.** It reasons from
`Deploy dev admin` reporting `success` while the Vercel-side build failed. That
step no longer runs, so #2052 cannot be re-observed until #2089 is fixed.

## §1 — The route model

Today there are **two parallel tenant trees** rendering the same nine
destinations: `/t/{slug}/*` (slug-keyed, `memberships`-gated) and
`/dashboard/*` (slug-free, cookie-resolved), with duplicated route files for
every page. `dashboardNavSections` and `tenantNavSections` differ only in the
hrefs they build.

This design keeps two trees but changes what separates them: **not URL
aesthetics, but role.**

| Route                                     | Gate                     | Audience                   |
| ----------------------------------------- | ------------------------ | -------------------------- |
| `/tenants`                                | `requireAdmin`           | platform                   |
| `/tenants/new`                            | `requireAdmin`           | platform                   |
| `/tenants/{id}`                           | `requireAdmin`           | platform — tenant overview |
| `/tenants/{id}/provisioning`              | `requireAdmin`           | platform                   |
| `/tenants/{id}/danger`                    | `requireSuperAdmin`      | platform                   |
| `/tenants/{id}/look` `/voice` `/features` | `requireAdmin`           | platform                   |
| `/dashboard`                              | `resolveDashboardTenant` | owner — site overview      |
| `/dashboard/domain`                       | `resolveDashboardTenant` | owner                      |
| `/dashboard/look` `/voice` `/features`    | `resolveDashboardTenant` | owner                      |
| `/dashboard/select-tenant`                | unchanged                | owner                      |
| ~~`/t/{slug}/*`~~                         | —                        | **deleted**                |

Deleting `/t/{slug}` is what disposes of the "`Look and Voice ship soon`" stub:
the page stops existing rather than needing content written for it.

**This is cheaper than the table suggests.** `renderTenantScopedPage(resolver,
Content)` already exists, and the two trees' route files differ _only_ in which
resolver they pass. Moving super admins onto `/tenants/{id}` needs one new
resolver — `requireTenantById`, `admins`-gated, keyed by id rather than slug —
swapped into thin route shells. Page bodies (`LookPageContent`,
`VoicePageContent`, `FeaturesPageContent`) stay shared; no page is implemented
twice.

**Non-goal:** collapsing the two trees into one. It was considered and
rejected — the slug-free owner URL is a deliberate product property, and the
shared-resolver pattern already keeps the duplication to route shells.

## §2 — The super-admin tree

**`/tenants/{id}` — tenant overview (new).** Carries the **editable tenant
details panel**, moved here from the provisioning page — see §2a, which is the
part of this move most at risk of being lost. Alongside it: Domain (value +
verification badge + route to DNS records), Owner (email, role, joined — or an
invited-pending badge), Content workspace (Sanity project, dataset, Studio
host, token/webhook health), and Recent activity from `audit_events`.

Above those, a **provisioning banner** rendered on `provisioningStatus`:

- `READY` — a one-line "Provisioned" confirmation plus "View steps →".
- `PROVISIONING` — current step and count, self-updating.
- `FAILED` — the failed step and its classified error kind.

This is what `Manage →` lands on. The button routes on status: `READY` → the
overview, anything else → straight to `/tenants/{id}/provisioning`, so a
half-provisioned tenant still opens where the operator needs to act.

**`/tenants/{id}/provisioning`.** Today's `ProvisioningStatusView`, reduced to
provisioning only — the editable details panel moves to the overview's Identity
card, the deprovisioning control moves to Danger zone, and the duplicated
"Domain verification" card is removed (it repeated the domain shown directly
above it in the details panel).

### §2a — The details panel keeps its progressive lock model

`TenantDetailsPanel` moves to the overview **unchanged in behaviour**. Its
per-field locking comes from `computeTenantFieldLocks`, which mirrors
`packages/db`'s `updateTenantDetails` rules, and relocating the panel must not
flatten it into "editable" vs. "read-only":

| Provisioning state   | Editable fields                                                               | Lock reason shown                                                           |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `IDLE` — not started | all six (name, slug, domain, plan, locale, owner email)                       | —                                                                           |
| `RUNNING`            | none                                                                          | _"Locked while provisioning is running."_                                   |
| `FAILED`             | all **except** those a completed step already baked into an external resource | _"Locked — the \"{step}\" step has already completed and used this value."_ |
| `SUCCEEDED`          | none                                                                          | _"Locked — provisioning has already finished."_                             |

The `FAILED` row is the subtle one and the reason the panel exists in this
shape: `slug` locks only once `DEPLOY_STUDIO` is DONE, and `primaryDomain` only
once `MAP_DOMAIN` is DONE. So when `MAP_DOMAIN` is the step that _failed_, the
domain stays **editable** — the operator corrects the value that caused the
failure and retries, rather than being locked out of the one field that needs
changing. A blanket lock would make a failed run unrecoverable from the UI.

Every field renders as a control at all times; locked ones are disabled with
their reason beside them, never hidden.

**`/tenants/{id}/danger`.** `DeprovisionTenantControl`, on its own route, gated
by **`requireSuperAdmin`** rather than `requireAdmin`. This is a deliberate
tightening, not just a move: the control is destructive and currently sits on a
page any `admins` row can reach. It also restores the placement the product
mock always had (`admin-panel-mock.html:337`).

## §3 — The owner tree

Owners get the **same pages, fewer of them** — one page set, filtered, not a
parallel implementation and not a read-only mirror of the platform view.

**Owners see:** a `/dashboard` overview (site name, public domain and its
verification state, plan, and routes onward), domain verification with the DNS
records to add, tenant details **read-only** (name and public domain), and
Look / Voice / Features.

**Owners do not see:** provisioning steps, the danger zone, the slug, the
tenant id, Sanity project/dataset identifiers, token and webhook health, or the
audit log. Those are platform internals, and a non-operator acting on them has
no good outcome.

Domain is the one piece of provisioning an owner genuinely acts on — it is
their DNS, not the platform's — so it surfaces as its own owner-facing page
rather than being suppressed with the rest of the provisioning detail.

`dashboardNavSections` drops the six `later` items it cannot honour today.

## §4 — The add-tenant wizard

The mock (`admin-panel-mock.html:404–422`) specifies an `Add tenant` H1 **and**
a six-step left rail with "Details" as step 1. The build shipped only the
step-1 card body, which is why the page announces neither what it creates nor
that it starts provisioning — the URL is the only signal.

- Restore the `Add tenant` H1 and the step rail, "Details" active, steps 2–6
  dimmed ahead. Provisioning becomes visible as the thing being started.
- Demote `Tenant details` from H1 to the step-1 card heading, its place in the
  mock.
- Move the route from `/add-tenant` to `/tenants/new`, consistent with §1.
- **Owner email hint** — the current string explains the flow rather than the
  field. Replace with a short statement of what to type and what follows.
  For the record, since the current wording raised the question: **the invite
  is sent by `apps/admin` itself**, via Auth.js `signIn('email')` → Resend
  (`create-tenant-action.ts`). Not by Sanity.
- **Pending-state copy** — `Begin provisioning →` must not resolve to
  `Creating…`. Pair each action with its own progress string
  (`Beginning provisioning…`, `Inviting owner…`).
- On success, redirect to `/tenants/{id}/provisioning` — at that moment the
  operator wants the steps. The run's terminal `Go to tenant →` points at
  `/tenants/{id}`.

## §5 — Transient status messages become toasts

The provisioning poll's `pollErrorWarning` renders as an inline `Alert`, so
each failed tick pushes the page down and each recovery pulls it back.

**Do not build a toast system.** `@blog/ui` already ships `Toast` and
`ToastViewport`, and `apps/web` has a working provider at
`src/context/toast-provider`. Port that provider into `apps/admin` and mount
the viewport in `AdminShell`.

The split is by message kind, not by convenience:

- **Toast** — transient and self-correcting, requiring no decision:
  `pollErrorWarning` above all, plus save confirmations.
- **Inline `Alert`** — persistent and actionable, or tied to a specific field:
  `dispatchError`, field validation, the owner-invite confirmation.

## §6 — Domain verification stuck on "Not added yet" (unresolved)

`getDomainVerificationStatus` returns `NOT_ADDED` only on a literal 404 from
Vercel's Domains API, so for a tenant whose `MAP_DOMAIN` step reports `DONE`
the domain is genuinely absent from the project being queried. Two candidates:
`VERCEL_WEB_PROJECT_ID` in admin's runtime env does not match the project the
provisioning workflow mapped onto, or `MAP_DOMAIN` writes to a different
project than the one it reports.

**No fix is specified here** — the cause is unknown, and §0 must land before
the behaviour can be reproduced. This ships as an investigation ticket.

## §7 — Shell chrome: breadcrumbs and the role chip

Two defects in the persistent frame, both live today and both made worse by a
deeper route tree.

**There are no breadcrumbs.** `Topbar` takes `crumb: string` — a single label
("Platform", "Tenant · acme"). With `/tenants/{id}/provisioning` nesting three
levels under the Platform section, a flat label stops being navigation. Build a
real trail with clickable ancestors: `Platform › Tenants › {name} ›
{section}` for the platform tree, `Your site › {section}` for the owner tree.

**The role chip misreports a super admin as the tenant's OWNER.** `/t/{slug}`'s
layout passes `roleLabel: t('roleLabel', { role: membership.role })`, and for a
SUPERADMIN that `membership` is `buildSuperAdminMembership`'s virtual record,
whose `role` is `MEMBERSHIP_ROLE.OWNER`. The chip therefore tells a platform
operator they are the owner of whatever tenant they are inspecting.

The fix follows from §1's split: `/tenants/{id}` is `admins`-gated, so it
reports the **platform** role (`SUPERADMIN`/`ADMIN`) with a `Platform` scope;
`/dashboard` reports the real `memberships` role. The virtual OWNER membership
stays as-is — it is the correct authorization answer, just not a correct
identity label.

Worth noting for the fix's test: `apps/admin/src/app/[locale]/t/[tenantSlug]/layout.test.tsx`
only ever exercises a real `OWNER` membership, never the virtual SUPERADMIN
one, which is why this was never caught. The regression test must cover a
SUPERADMIN with no `memberships` row.

**The tenant switcher is dropped from the platform tree.** `/t/{slug}`'s layout
passes `tenants={[tenant]}` — a hardcoded single-element list — so the sidebar
dropdown there has exactly one option and cannot switch anything. `/tenants`
is the better switcher for that tree in every respect: it carries status, plan,
created date, and an archived filter, and it scales to a list spanning the whole
platform, which is precisely the case a dropdown handles worst. The breadcrumb's
`Tenants` ancestor is the route back.

It survives unchanged in the owner tree, where `/dashboard`'s layout already
renders it only when `tenants.length > 1` and the multi-membership case already
has a full page picker at `/dashboard/select-tenant`. An owner's list is bounded
by their own memberships, so it never grows long enough to be the wrong control.

**Sidebar order.** Provisioning and Danger zone are both platform-only and sit
together at the bottom of the tenant nav, below the tenant-facing sections and
separated by a rule — rather than Provisioning sitting second, above pages an
owner uses daily.

## §8 — `apps/admin` separates from `@blog/ui` entirely

`CLAUDE.md` already says admin's **interactive** primitives come from Base UI,
styled in-app, and that nothing is added to `@blog/ui` for it. In practice admin
imports 16 `@blog/ui` components across 68 sites, and they carry the public
site's design language rather than an operator tool's.

`StatusBadge` is the worked example:

```
'rounded-sm border px-2 py-0.5',
'font-mono text-label font-medium uppercase tracking-label',
```

Square, monospace, uppercase — the Console preset's terminal aesthetic. Correct
on a reader-facing site whose whole visual idea is a terminal; wrong on an admin
panel, where a status pill should be a quiet, rounded, sentence-case chip with a
tone dot.

**Decision: `apps/admin` drops its `@blog/ui` dependency completely** and owns
every primitive it renders, built in-app on Base UI plus its own theme. The
layer contract becomes:

```
admin → db, auth, config, utils        (was: admin → ui, db, auth, config, utils)
```

### What separation actually costs

- **13 icons.** `Icon` resolves 35 SVGs from `@blog/ui/assets/icons` via SVGR.
  The _names_ (`ICONS`) already live in `@blog/config`, which admin keeps. Admin
  copies only the 13 glyphs it uses — `CHEVRON_RIGHT`, `COMMENT`, `GLOBE`,
  `GRID`, `MAIL`, `MENU`, `MENU_ROWS`, `PALETTE`, `PLUS`, `QUOTE`, `SETTINGS`,
  `USERS`, `WARNING` — into `apps/admin/src/assets/icons` with its own registry.
  No new workspace package. Admin's `vitest.config.ts` and `next.config.ts`
  already carry the SVGR plumbing (they had to, to consume `@blog/ui` source),
  so that wiring is repointed rather than written.
- **Its own theme.** `apps/admin/index.css` is four lines: import
  `@blog/tailwind-config/theme.css` and `@source`-scan `packages/ui`. That
  shared theme declares itself "the only source of Tailwind theme tokens and
  global base styling," with a narrow carve-out for workspace-specific tokens.
  Admin needs a **broader** exception: its own token layer, so the mock's
  surface/line/tone palette is what admin renders rather than the site's Console
  preset. This is a deliberate widening of that rule and must be recorded in
  `configs/tailwind/theme.css`'s own header and in `SPEC.md`.
- **One component dies.** `Textarea` has exactly one consumer in the entire
  repo — admin's `voice-field`. It becomes dead code the moment admin stops
  importing it, and is **deleted from `@blog/ui`** (with `pnpm gen:ui-index`
  re-run to drop its `COMPONENTS.md` entry).

### What does _not_ get deleted

Every other component admin imports has genuine `apps/web` or internal
`packages/ui` consumers, verified by reference count — `StatusBadge`,
`SegmentedControl` and `SettingRow` back the account page; `Alert` backs
newsletter signup; `Eyebrow` backs aside/hero/article; `BrandMark` backs
`BrandLockup`. None of those were built for admin, and none may be removed on
the strength of admin no longer importing them.

### Sequencing consequence

This lands **before** the route and page work, not after. Building the new
overview, provisioning, danger and owner pages against `@blog/ui` and then
migrating them would build every surface twice.

## Delivery

An epic with per-layer sub-issues. All `layer:admin-app` except the first,
which also touches `layer:config` for the `adminRoutes` builder.

1. `refactor(admin)` — `/t/{slug}` → `/tenants/{id}`: add `requireTenantById`,
   repoint route shells, delete the slug tree, update `adminRoutes`.
2. `feat(admin)` — tenant overview at `/tenants/{id}` + status-conditional
   provisioning banner; retarget `Manage →`.
3. `feat(admin)` — split provisioning and danger zone onto their own routes;
   tighten danger to `requireSuperAdmin`.
4. `feat(admin)` — owner overview at `/dashboard`, owner domain page, reduced
   owner nav.
5. `feat(admin)` — real breadcrumb trail in `Topbar`; correct the role chip to
   report the platform role in the platform tree (§7), with a regression test
   covering a SUPERADMIN who holds no `memberships` row.
6. `fix(admin)` — add-tenant wizard chrome, route move, and copy (§4).
7. `feat(admin)` — port the toast provider; move `pollErrorWarning` onto it.
8. `fix(admin)` — investigate domain verification stuck on `NOT_ADDED` (§6).

Sub-issues 2–5 depend on 1. Items 6–8 are independent of the route work and of
each other. The role-chip half of 5 is a live defect independent of this
redesign — it can ship ahead of the route work if wanted.

## Decisions recorded

- **Owner and super admin share one page set, role-filtered** — not a read-only
  mirror, and not a separate owner implementation.
- **`/dashboard` stays** as the owner tree; **`/tenants/{id}` replaces
  `/t/{slug}`** as the platform tree. Rejected: collapsing to one tree, and
  keeping `/t/{slug}` for super admins.
- **Provisioning gets its own page plus a banner on the overview.** Rejected:
  a bare conditional redirect with no overview, and keeping the steps inline
  on the overview.
- **Owners see tenant home, domain verification, and read-only tenant details**
  — explicitly **not** provisioning progress.
- **Danger zone moves to `requireSuperAdmin`**, a behaviour change beyond
  relocation.
- **The details panel's four-state lock model survives the move to the
  overview** — specifically the `FAILED` case, where the field that caused the
  failure stays editable (§2a).
- **Breadcrumbs are in scope**, replacing `Topbar`'s single `crumb` string.
- **The role chip reports the gate's own role**, not the virtual membership's —
  a super admin is never labelled OWNER.
- **The sidebar tenant switcher is dropped from the platform tree** (it was
  non-functional there) and kept, unchanged, in the owner tree.
- **`apps/admin` drops `@blog/ui` entirely** (§8) and owns every primitive it
  renders. It copies the 13 icons it uses rather than adding a shared package,
  gains its own Tailwind token layer, and `Textarea` — dead once admin stops
  importing it — is deleted from `@blog/ui`. This lands before the route work,
  or every surface gets built twice.

## Open questions

- **A super admin visiting `/dashboard`.** `listSessionTenants` currently
  resolves them against every tenant. Proposed: redirect to `/tenants`, unless
  they hold a real `memberships` row, in which case it is genuinely their own
  tenant. Not yet confirmed.
