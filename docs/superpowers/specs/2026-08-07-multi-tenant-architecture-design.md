# Multi-Tenant Architecture — Design

**Status:** Design / brainstorm pass (no code in this issue). Resolves the open
items handed off from Feature 6 of
[`2026-08-07-flexible-theming-and-page-builder-design.md`](./2026-08-07-flexible-theming-and-page-builder-design.md).
Output feeds per-epic `superpowers:writing-plans` passes and `board-keeper`
ticketing once reviewed. Nothing filed yet. **Several decisions here are
_proposed_ (marked ⚠), pending explicit confirmation — this doc records the
recommended shape, not a rubber-stamp.**
**Date:** 2026-08-07
**Scope:** How the blog becomes a multi-tenant platform serving many client
sites — each edited by that client's own staff, isolated, at the scale of
_tens_ of tenants on a lean budget. Covers tenant resolution, per-tenant
content reads, engagement data tenancy, auth/RBAC, Studio, provisioning,
migrations, the free-tier ceiling, and the layer-contract impact.
**Related / dependencies:**

- **Feature 6 (the parent doc)** — settled the direction: content via **Sanity
  project-per-tenant, one org**; **no own CMS** (Payload is the "adopt, don't
  build" fallback); **RBAC split** (D8–D10). This doc assumes those and designs
  the rest.
- **`SPEC.md` §4** (layer contracts), **§9** (rendering/caching/ISR), **§13**
  (deployment topology) — all three are touched; each gets a same-PR update
  when the corresponding epic lands.
- **`@blog/db` (#984)** — the shared Neon store that gains the tenant tables.
- **Feature 2 (theme-as-content)** — the mechanism by which each tenant looks
  different with **zero `@blog/ui` change**; a hard prerequisite for
  per-tenant branding.
- **M5 engagement tables** (comments, ratings, bookmarks, subscribers) + the
  Feature 4 `leads` table — the tables that gain `tenantId`.

## Purpose & what is already decided

Feature 6 decided the CMS model and the RBAC split but explicitly deferred
three things to this doc: **(1)** the frontend serving topology, **(2)** the
Neon tenant-scoping shape, and **(3)** provisioning/migration automation — plus
recording the Sanity free-tier ceiling. This document proposes a coherent whole
across all three and names what still needs sign-off.

Recap of the inherited, settled decisions (do not relitigate here):

- **Content is Sanity project-per-tenant, one organization.** Isolation via
  project membership; free per project, Growth billed through when a tenant
  outgrows it.
- **No own CMS.** Payload is the escape hatch if the model hits its ceiling.
- **RBAC is split:** Sanity project membership governs _content editing_; a Neon
  `memberships` layer governs _frontend/engagement_ roles.

## Constraints that shape the design

- **`@blog/ui` needs zero change.** It is tenant-agnostic and already token-pure;
  per-tenant branding flows entirely through Feature 2's theme-as-content. This
  is the single most important simplification — the whole design system is
  multi-tenant "for free."
- **`@blog/service` today binds one Sanity client to env vars.** Multi-tenant
  breaks that assumption: the client must become **per-tenant** (projectId +
  dataset + read token resolved per request). This is the largest single change
  and the main risk to `service`'s "validated entry points only" convention.
- **`@blog/db` is a shared Neon store.** Tenancy is **row-scoped** — every query
  is bound to a `tenantId`; no per-tenant database in the recommended shape.
- **Layer graph stays acyclic; `web` remains the only meeting point.** Tenant
  resolution lives in `web` (middleware/request scope) and is passed _down_ into
  `service`/`db` calls — neither layer reaches "up" for it.
- **Live data is sacred.** Adding `tenantId` to _empty_ M5 tables is additive
  and trivial; doing it after they hold rows is a data migration. Timing matters
  (see §Sequencing).

## Target architecture (proposed ⚠)

```
                    ┌─────────────────────────────────────────┐
  tenant domains →  │  Next.js middleware: host → tenant       │
  (custom + *.plat) │  lookup in `tenants` registry (Neon)     │
                    │  → { tenantId, sanityProjectId, dataset } │
                    └───────────────┬──────────────────────────┘
                                    │ request-scoped tenant context
             ┌──────────────────────┼──────────────────────────┐
             ▼                      ▼                            ▼
   service (per-tenant       db (shared Neon,           ui (unchanged;
   Sanity client by          every query scoped         themed per tenant
   projectId) + tenant-      by tenantId) +             via Feature 2
   scoped ISR tags           tenants/memberships        theme content)
```

### 1. Tenant registry & resolution ⚠

A `tenants` table in Neon is the source of truth: `id`, `slug`, `primaryDomain`,
`sanityProjectId`, `sanityDataset`, `locale` (the tenant's single language — see
below), `plan` (`FREE`/`GROWTH`), `status` (`ACTIVE`/`SUSPENDED`), timestamps. A
`tenant_domains` table (one-to-many) holds custom domains + the platform
subdomain (`<slug>.platform.tld`).

**i18n posture — one language per tenant (decided 2026-08-10, see the
configurability doc's D10).** Each tenant is **monolingual**; its `locale`
selects the content language its Sanity project is authored in and the matching
per-locale UI voice-pack. This keeps `localePrefix: 'never'` and needs **no**
Sanity content-localization migration. _Multilingual_ per-site content (a
language switcher, localized documents) is **out of scope** and would compound
badly here — document-per-locale multiplies a tenant's doc count against the
free-tier **10k-docs cap**, lowering the tenant ceiling. If it's ever needed,
it's an additive, per-tenant migration (document-level i18n), not a change to
this registry shape.

**Resolution** happens in Next.js middleware: read the `Host` header, look up
the tenant (cached — the registry is small and changes rarely), and attach the
resolved `tenantId` + Sanity coordinates to the request (header or a
request-scoped context read by RSCs). Unknown host → platform marketing page or 404. This is the _only_ new hot-path lookup, and it is cacheable.

### 2. Content reads — per-tenant Sanity client ⚠

`@blog/service` moves from a module-level client bound to
`NEXT_PUBLIC_SANITY_PROJECT_ID` to a **client factory keyed by `projectId`**
(with a small LRU of clients). The resolved tenant supplies projectId + dataset;
the read token is either shared (a platform robot token with access to all
tenant projects) or per-tenant (stored encrypted in the registry) — **open
decision, see §Open**. Every existing `service.*` call gains the tenant context
as an argument (or reads it from the request-scoped resolver). View-model shapes
are unchanged — only _which project_ they read from changes.

**ISR / caching must be tenant-scoped.** Every cache tag gains a `tenantId`
prefix (`t:<id>:post:<slug>`) so revalidating tenant A never purges tenant B.
The revalidation webhook (`/api/revalidate`, `SPEC.md` §9) must carry the tenant
(the Sanity webhook is per-project, so the project → tenant mapping identifies
it) and call `revalidateTag` on that tenant's namespace only. This is a real
change to the caching contract and must land with the service change.

**⚠ Known blocker to resolve here — Vercel tag revalidation is insufficient on
its own.** This repo already learned (the hard way) that on Vercel
`revalidateTag` — even with `expire: 0` — does **not** invalidate prerendered
routes; the current webhook additionally calls `revalidatePath('/', 'layout')`
(and `useCdn` stays `false`) to force it. But `revalidatePath('/', 'layout')` is
**global — it would purge every tenant**, defeating the per-tenant tag scoping
above. So tenant-scoped revalidation is not free: it needs either genuinely
path-addressable tenant output (e.g. a tenant-prefixed route segment so one
tenant's paths can be revalidated in isolation) or verification that tag-only
revalidation actually invalidates prerendered output on the target
Next.js/Vercel version. This is the single biggest cross-tenant correctness risk
in the design and is currently unaddressed — settle it before epic 2 is
ticketed.

### 3. Engagement — shared Neon + `tenantId` (proposed ⚠)

One Neon database. Add:

- `tenants` and `tenant_domains` (above).
- `memberships` — `(userId, tenantId, role)`, `role` ∈ `OWNER`/`EDITOR`/
  `READER` (UPPERCASE const per repo convention). This is the app-facing RBAC.
- **`tenantId` FK on every engagement table** — `comments`, `ratings`,
  `bookmarks`, `subscribers`, and `leads`. Every `@blog/db` query is scoped by
  `tenantId`. **Note:** `bookmarks` and `subscribers` already ship in `@blog/db`
  today; `comments`/`ratings`/`leads` do not yet exist. For the two that exist,
  adding `tenantId` is only additive while they hold no rows — otherwise it is a
  backfill (see §Sequencing epic 3 and the timing note).

**Enforcement — a tenant-bound accessor, not raw queries.** To make "forgot the
`WHERE tenantId`" structurally impossible, `@blog/db` exposes a
`forTenant(tenantId)` factory returning query functions that inject the scope;
callers cannot get an unscoped handle for tenant data. **Postgres Row-Level
Security is a proposed defense-in-depth layer** (a `tenant_id` session GUC +
policies) — strong, but adds operational complexity; open decision.

Auth.js **users stay global** — one person can hold memberships in multiple
tenants; the adapter tables (users/accounts/sessions) get **no** `tenantId`.
Only the domain tables do.

### 4. Auth & the RBAC split

- **Site/engagement auth** = Auth.js (existing), global identity. Signing in on
  a tenant site creates the global user (if new) and a `READER` membership for
  _that_ tenant. Session resolves the current tenant's role via `memberships`.
- **Content-editing auth** = Sanity's own login into that tenant's project/
  Studio — entirely separate, governed by Sanity project membership, never the
  site's Auth.js. A content editor and a site commenter are different identities
  by design.

### 5. Studio per tenant — stays Vercel-hosted (decided)

Keep the current model: a static `sanity build` export served from **Vercel**,
**not `sanity deploy`** (`SPEC.md` §13's deliberate choice — no
`*.sanity.studio` hosting). Per-tenant, two shapes:

- **(a) One Studio codebase, built + deployed per tenant** — each tenant's
  Studio is a Vercel deployment configured with that tenant's
  `projectId`/`dataset` (env-parameterized). Dead simple and provably isolated
  (a tenant only ever sees its own Studio), but N Vercel deployments — the
  fan-out tax (§Migrations).
- **(b) One Vercel Studio deployment, per-host dynamic config** — a single
  deployment whose Studio config resolves `projectId` from the request host
  (subdomain → tenant) and configures a single-workspace Studio for that tenant.
  One deployment instead of N. Caveat: Sanity's native multi-workspace switcher
  would list _every_ tenant's workspace (leaking tenant names), so the config
  must be computed **per host to expose only that tenant's workspace** — more
  moving parts, but removes the deployment fan-out.

**Recommendation ⚠:** start with **(a)** while tenant count is small (simplest,
provably isolated); move to **(b)** if per-tenant Studio deployments become the
bottleneck. Either way it is **Vercel, consistent with §13 — no `sanity
deploy`.**

### 6. Theming per tenant — no `@blog/ui` change

Each tenant's `settings_theme` singleton (Feature 2) lives in _its own_ Sanity
project, so per-tenant branding is just per-tenant content. The `web` theme
injector reads the resolved tenant's theme and sets the CSS variables on
`<html>` exactly as Feature 2 designs. `@blog/ui` is untouched. This is why
Feature 2 is a hard prerequisite.

## Provisioning a tenant (onboarding flow)

An admin/automation flow, not a hot path:

1. **Create the Sanity project** via the Projects API (name, org), create its
   dataset, mint a read token, set CORS for the tenant's domain(s).
2. **Seed initial content** — singletons (`siteSettings`, `settings_theme`,
   navigation/footer) and a starter home page, via a template migration run
   against the new dataset.
3. **Deploy the Studio** — a Vercel static `sanity build` for the tenant's
   `projectId` (§5 shape (a)), or register the tenant with the shared per-host
   Studio deployment (§5 shape (b)). No `sanity deploy`.
4. **Insert registry rows** — `tenants` (+ `sanityProjectId`), the owner's
   `memberships` row, and `tenant_domains`.
5. **Map the domain** in Vercel (custom domain) or assign the platform
   subdomain.
6. **No Neon migration** — the shared DB is already migrated; a new tenant is
   rows, not schema. (This asymmetry is a key advantage — see below.)

This flow is the main net-new tooling and should be scripted early; done by hand
it is the bottleneck the ToS findings warn about.

## The migration story — a deliberate asymmetry

- **Neon (engagement): shared, migrate once.** A schema change runs a single
  `drizzle-kit` migration against the one database for all tenants. Cheap.
- **Sanity (content): fan out, migrate per project.** A schema/content change
  must deploy the schema to and run content migrations against **every tenant
  project's dataset**. This is the recurring operational tax Feature 6 flagged.
  Automate it: a script iterating the `tenants` registry, running
  `migrate:deploy` per project with that project's token, stopping on first
  failure, recording per-project ledger state (the existing `migrationState`
  mechanism, `content-model.md`, now keyed per project).

Naming this asymmetry up front sets expectations: the app's own data scales
cleanly; the CMS side is where "many tenants" costs you, which is exactly why
tenant count stays modest until the automation is solid.

## Sanity free-tier limits & the model ceiling

From Feature 6's 2026-08-07 research, carried here as hard design inputs:

- **Upgrade-before-cap policy.** Free projects have no overage buffer; hitting
  10k documents or the editor cap can deactivate a tenant's project. The
  registry's `plan` field + a usage check must move a tenant to **Growth
  before** it approaches a limit, not after.
- **Verify the editor allowance.** Sources conflict (~20 seats vs. ~2 non-admin
  editors / 2 roles). **Action: confirm the exact current free-tier editor
  number on `sanity.io/pricing` before onboarding real tenants** — it sets how
  soon each tenant starts paying.
- **The gray area is scale-gated.** Fine at tens; confirm with Sanity before
  hundreds. This doc's whole design targets the modest-count regime; the
  explicit escape hatch at scale is **Payload** (self-hosted, one instance,
  native multi-tenant) or a paid Sanity org tier.

## Layer-contract impact

- **`@blog/config`** — new UPPERCASE consts (`TENANT_ROLE`, `TENANT_PLAN`,
  `TENANT_STATUS`); possibly tenant-aware `routes` helpers if URLs embed a
  tenant slug (only for the platform-subdomain scheme).
- **`@blog/service`** — the big one: per-tenant Sanity client factory; tenant
  context threaded through every fetcher; tenant-scoped ISR tags. Stays
  Sanity-only, no React.
- **`@blog/db`** — `tenants`, `tenant_domains`, `memberships` tables; `tenantId`
  on engagement tables; the `forTenant(tenantId)` scoped accessor; optional RLS.
- **`web`** — tenant-resolution middleware; passing tenant context into
  `service`/`db`; the theme injector reading the resolved tenant; the
  revalidation route made tenant-aware; the provisioning/admin surface.
- **`@blog/ui`** — **none.** (The headline simplification.)
- **`cms`** — schema unchanged in shape; what changes is _deployment_ (one
  project per tenant) and the per-project migration runner, not the schemas.
- Graph stays acyclic; `web` remains the only place tenant context meets
  `service`/`db`/`ui`.

## Security & isolation

- **Content:** strong — separate Sanity projects, no shared dataset.
- **Engagement:** logical — shared DB, enforced by the `forTenant` accessor and
  (proposed) Postgres RLS as a backstop. Every write records `tenantId` from the
  resolved context, never from client input.
- **Cross-tenant leakage risks to test explicitly:** cache tags (a mis-scoped
  tag serving A's content to B), the revalidation webhook (project→tenant
  mapping), and any admin/cross-tenant view. Each needs a targeted test.

## Open decisions (need sign-off before ticketing)

1. **Frontend topology ⚠** — shared Next.js app (this doc's assumption) vs.
   deployment-per-tenant. Recommended: **shared app** (one deploy, one Neon
   migration, lean at tens). Confirm.
2. **Read-token model ⚠** — one platform robot token across all tenant projects
   vs. per-tenant tokens in the registry (encrypted). Trade convenience vs.
   blast radius.
3. **Studio hosting ⚠** — Vercel either way (per `SPEC.md` §13, no `sanity
deploy`): a Studio deployment per tenant (simple, isolated) vs. a single
   deployment with per-host dynamic config (one deploy, but must avoid the
   multi-workspace name leak). Start simple.
4. **Postgres RLS ⚠** — defense-in-depth on top of `forTenant`, yes/no.
5. **URL scheme** — custom domains only, platform subdomains, or both (affects
   `routes` + tenant resolution).
6. **Exact free-tier editor allowance** — verify on `sanity.io/pricing` (drives
   billing timing).

## Non-goals (recorded so epics don't sprawl)

- **Billing/subscription integration** (Stripe, plan enforcement UI) — the
  registry carries a `plan` field as the hook; charging is a separate build.
- **Self-serve signup UX** — onboarding is admin/automation first; a public
  "create your site" flow is later.
- **A cross-tenant super-admin analytics dashboard** — noted as a future need,
  not designed here.
- **Migrating to Payload** — the escape hatch, not this doc's plan.
- **Central multi-project management inside one Studio** — not native to Sanity;
  out of scope (each tenant uses its own project's Studio).

## Sequencing & epics (recommendation)

Dependency order; each is a multi-layer epic + per-layer sub-issues per repo
rules. **Gate on Feature 2 (theme-as-content) for per-tenant branding.**

1. **Tenant foundation** — `config` consts + `db` `tenants`/`tenant_domains`/
   `memberships` tables + `web` resolution middleware + registry seed. No
   tenant-facing behaviour yet; the spine everything hangs on.
2. **Per-tenant content reads** — `service` per-tenant client factory +
   tenant-scoped ISR + tenant-aware revalidation route. Ships the ability to
   serve _different tenants' content_ from one app.
3. **Engagement tenant-scoping** — `tenantId` on M5 tables + the `forTenant`
   accessor (+ RLS if chosen). **Do this while the M5 tables are still empty**
   so it's additive, not a live-data migration — this is the timing constraint
   that may reorder work relative to the M5 build.
4. **Auth tenancy** — membership creation on sign-in; role resolution in session.
5. **Provisioning automation** — the onboarding script (Projects API, seed,
   registry, domain) + the per-project migration runner.
6. **Studio-per-tenant** — per the §5 hosting decision.
7. **Later:** billing hooks, self-serve signup, cross-tenant admin.

**Timing note vs. M5:** epic 3 wants the engagement tables empty. **`bookmarks`
and `subscribers` already exist in `@blog/db`**, so that window may already be
closing for them — check whether production holds any rows first. If M5's
remaining tables (`comments`/`ratings`) ship and accrue rows too, adding
`tenantId` becomes a backfill migration (default every existing row to a
"primary" tenant). Cheapest path is to land the `tenantId` columns _with_ each
new table, and for the two that already exist before more rows accrue — worth
deciding before the rest of M5 builds.

## Spec sync when built

- `SPEC.md` **§4** — the per-tenant `service` client and the `db` tenant tables
  change the layer picture; update contracts.
- `SPEC.md` **§9** — tenant-scoped ISR/revalidation.
- `SPEC.md` **§13** — per-tenant Sanity projects + Studio hosting + provisioning
  join the deployment topology.
- `SPEC.md` **§1 / §15** — multi-tenant moves from "direction" to a built
  capability.
- Per repo rules, this doc and Feature 6's section are deleted once the epics
  ship and `SPEC.md` reflects the final shape.
