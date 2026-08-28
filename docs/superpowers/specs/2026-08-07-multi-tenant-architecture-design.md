# Multi-Tenant Architecture — Design

**Status:** Design pass. Resolves the open
items handed off from Feature 6 of
[`2026-08-07-flexible-theming-and-page-builder-design.md`](./2026-08-07-flexible-theming-and-page-builder-design.md).
Output feeds per-epic `superpowers:writing-plans` passes and `board-keeper`
ticketing. **All 7 items in §Open decisions are resolved as of 2026-08-14** —
see that section for the final call on each. **Two of them — 3 (Studio
hosting) and 5 (URL scheme) — were reopened on 2026-08-28** (decision 3's
gating spike has since completed and proved the single-deployment shape
viable — §5; the sign-off itself is still open), after a
self-serve-provisioning requirement promoted two former Non-goals (self-serve
signup, billing) into scope; three further decisions (8–10) were added the same
day, and decisions 11–12 plus a new §7 (platform app) on the same date.
Phase 0 (tenant registry) has
already shipped; epic 2a (per-tenant content reads infrastructure) has
shipped too, proven on one loader — epic 2b (migrating the remaining
`service.*` loaders) is next and unblocked.
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
  `leads` table (contact form module, tracked under #1919's
  [`2026-08-23-module-and-page-type-portfolio-design.md`](./2026-08-23-module-and-page-type-portfolio-design.md)
  — moved out of this program's own #1285 in 2026-08-23) — the tables that
  gain `tenantId`.

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
  (custom only)     │  lookup in `tenants` registry (Neon)     │
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

### 1. Tenant registry & resolution — shipped

A `tenants` table in Neon is the source of truth: `id`, `slug`, `primaryDomain`,
`sanityProjectId`, `sanityDataset`, `locale` (the tenant's single language — see
below), `plan` (`FREE`/`GROWTH`), `status` (`ACTIVE`/`SUSPENDED`), timestamps. A
`tenant_domains` table (one-to-many) holds every custom domain a tenant
answers to (resolved 2026-08-14: custom domains only, see §Open decision
5 — no platform subdomain scheme).

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

### 2. Content reads — per-tenant Sanity client — epic 2a shipped (#1543), epic 2b next

`@blog/service` moves from a module-level client bound to
`NEXT_PUBLIC_SANITY_PROJECT_ID` to a **client factory keyed by `projectId`**
(with a small LRU of clients). The resolved tenant supplies projectId + dataset;
the read token is **per-tenant, stored encrypted in the registry**
(resolved 2026-08-14, see §Open decision 2 — not a shared platform token, to
contain blast radius to one tenant per leak). The mechanism landed as epic 2a
(#1543, merged): `getClient()`/`runQuery()`/`isr()` all take an optional
tenant context, proven end-to-end on one loader (`getPostsByIds` / the
bookmarks page). Every other `service.*` call gaining the tenant context is
epic 2b, tracked separately — until a given loader migrates, it keeps reading
the legacy single-tenant client unchanged. View-model shapes are unchanged —
only _which project_ they read from changes.

**ISR / caching must be tenant-scoped.** Every cache tag gains a `tenantId`
prefix (`t:<id>:post:<slug>`) so revalidating tenant A never purges tenant B.
The revalidation webhook (`/api/revalidate`, `SPEC.md` §9) must carry the tenant
(the Sanity webhook is per-project, so the project → tenant mapping identifies
it) and call `revalidateTag` on that tenant's namespace only. This is a real
change to the caching contract and must land with the service change.

**Vercel tag revalidation is insufficient on its own — resolved 2026-08-14:
accept the global purge for v1.** This repo already learned (the hard way)
that on Vercel `revalidateTag` — even with `expire: 0` — does **not**
invalidate prerendered routes; the current webhook additionally calls
`revalidatePath('/', 'layout')` (and `useCdn` stays `false`) to force it. That
call is **global — it purges every tenant** on any one tenant's publish,
defeating the per-tenant tag scoping above in isolation terms — but this is
**not a cross-tenant data leak**, just a synchronized cold-render cost every
tenant pays. Accepted for v1 rather than gating epic 2 on routing-architecture
work (e.g. a tenant-prefixed route segment for path-addressable purges) with
no real tenant count/traffic yet to measure the blast radius against. Revisit
as a follow-up perf ticket once it matters.

### 3. Engagement — shared Neon + `tenantId` (proposed ⚠)

One Neon database. Add:

- `tenants` and `tenant_domains` (above).
- `memberships` — `(userId, tenantId, role)`, `role` ∈ `OWNER`/`EDITOR`/
  `READER` (UPPERCASE const per repo convention). This is the app-facing RBAC.
- **`tenantId` FK on every engagement table** — `comments`, `ratings`,
  `bookmarks`, `subscribers`, and `leads` (the last from the contact form
  module, tracked under #1919, not this program). Every `@blog/db` query is
  scoped by `tenantId`. **Note:** `bookmarks` and `subscribers` already ship
  in `@blog/db` today; `comments`/`ratings`/`leads` do not yet exist. For the
  two that exist, adding `tenantId` is only additive while they hold no rows
  — otherwise it is a backfill (see §Sequencing epic 3 and the timing note).

**Enforcement — a tenant-bound accessor, not raw queries.** To make "forgot the
`WHERE tenantId`" structurally impossible, `@blog/db` exposes a
`forTenant(tenantId)` factory returning query functions that inject the scope;
callers cannot get an unscoped handle for tenant data. **Postgres Row-Level
Security is a confirmed defense-in-depth layer (resolved 2026-08-14: yes)**
— a `tenant_id` session GUC + policies on top of `forTenant`.

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

### 5. Studio per tenant — stays Vercel-hosted (shape REOPENED 2026-08-28)

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

**Resolved 2026-08-14:** start with **(a)** while tenant count is small
(simplest, provably isolated); move to **(b)** if per-tenant Studio
deployments become the
bottleneck. Either way it is **Vercel, consistent with §13 — no `sanity
deploy`.**

**Reopened 2026-08-28.** Two findings, one factual and one of scope:

- **Shape (a) was decided but never implemented.** It requires a fan-out
  redeploy step, and none exists — `deploy-production.yml` deploys exactly one
  Studio (`VERCEL_PROJECT_ID_CMS`). Every tenant's `studio-<slug>` project is
  frozen at the commit that provisioned it. Since `apps/web` is a single shared
  deployment that moves every release, the drift is asymmetric: web ships code
  expecting schema fields no tenant editor can author. That is a correctness
  problem, not the deployment-cost problem the 2026-08-14 note anticipated.
- **Shape (a) is incompatible with self-serve provisioning.** Under (a) every
  signup creates a Vercel project _and_ runs a full Studio build, so a signup
  spike exhausts the account build quota. Shape (a) is also the only reason
  provisioning lives in GitHub Actions: `create-studio-vercel-project.ts` is
  the **one** provisioning step that shells out to a builder (`pnpm install` +
  `vercel build`); every other step is pure API calls with injected `deps`.

The per-tenant Studio exists solely because `projectId`/`dataset` are read from
`SANITY_STUDIO_*` and inlined into the bundle at build time — nothing else
about a tenant Studio differs. The free-tier driver applies to the per-tenant
**Sanity project** (kept), not to the Studio deployment, so collapsing the
Studio costs nothing on that axis.

**Direction (not final): move to (b).** Gated on a spike — a Next-hosted Studio
taking a per-request-resolved `projectId`/`dataset`. The static multi-workspace
array (`defineConfig([...])`) is **not** viable: the list is fixed at build
time, it leaks every tenant name into the bundle, and Sanity's docs state
`hidden` is client-side UI only, never an access boundary.

#### Spike outcome (#2260, 2026-08-28): shape (b) works

The gating spike was built and run against two real tenant projects. **It
works**, and the workspace-leak caveat in (b)'s description above does not
arise, because the config is computed per request rather than being a static
array.

**Mechanism.** `SANITY_STUDIO_*` vars are _statically replaced_ at bundle
time — the [Studio env-var docs](https://www.sanity.io/docs/studio/environment-variables)
state that dynamic access like `process.env[key]` "will not work … in
production" — which is exactly why a `sanity build` artifact is welded to one
project. The documented way out is embedding the Studio as a route in a
Next.js app via `next-sanity`'s `NextStudio`, where the config is an ordinary
object built at request time; that same page names "moving from the default
Vite-based bundler to … an embedded setup inside of Next.js" as a supported
migration. The spike extracted the existing `sanity.config.ts` body into a
`createStudioConfig({ projectId, dataset, name, title, basePath })` factory
called from two places: the unchanged env-driven `sanity.config.ts` (inline
`process.env.SANITY_STUDIO_*` preserved, so the Sanity bundler still inlines
it) and a Server Component at `/studio/[tenant]/[[...tool]]` that resolves the
tenant, `notFound()`s an unknown slug, and hands the values to a `'use client'`
component rendering `<NextStudio>`.

**Evidence — one running server, two projects differing in both projectId and
dataset.** `/studio/tenant-a` and `/studio/tenant-b` each returned 200
carrying only their own coordinates; `/studio/nope` 404'd. In a real browser
each Studio booted, rendered a single workspace titled after its tenant with
no workspace switcher, and issued credentialed calls to its _own_ project host
(`<project-a>.api.sanity.io` and `<project-b>.api.sanity.io`, both 200).
`next build`
emitted the route as `ƒ` (server-rendered on demand) with **no tenant id
anywhere in the build output**, client or server bundle. All four plugins
(`structureTool`, `visionTool`, `codeInput`, `media`) bundled through Turbopack
unmodified — the main technical risk did not materialise.

**Isolation.** Per-request config is what makes this safe: a tenant's bundle
never contains another tenant's identity, so there is no list to leak and
nothing for `hidden` to fail to protect. Enforcement remains Sanity project
membership — a user who guesses another slug gets a shell that cannot
authenticate against that project.

**CORS — one shared origin, and it is materially simpler.** Path-based
selection serves every tenant Studio from a single origin, so each tenant
project needs exactly _one_ CORS entry and it is the _same value_ for all of
them. Provisioning already does precisely this for `ADMIN_APP_BASE_URL` (a
platform-wide env var) in `create-sanity-project.ts`'s idempotent
list-then-add block — the shared Studio origin is one more entry there, no new
machinery. The spike confirmed credentialed cross-origin requests succeed
under this model. A host-based variant (`studio-<slug>.<platform>`) instead
needs a _distinct_ origin per project plus a Vercel domain mapping per tenant,
or a wildcard origin that widens the allowed set to every platform subdomain.
Host-based is otherwise a one-file change (read `Host` instead of the route
param; `basePath` becomes a fixed `/studio`), so **CORS and domain management
are the deciding factor, not the code** — and this interacts with the
still-open URL-scheme call in §Open decision 5.

**Cost — the `SPEC.md` §13 assessment.** §13 currently describes the Studio as
a static `sanity build` export. Under (b) the ~8.8 MB / 319 JS chunks stay
static CDN assets; only the HTML shell becomes a server invocation, once per
Studio _page load_ — the Studio is an SPA, so in-app navigation and all
content traffic still go browser-to-Sanity directly. Negligible at editor
volumes. Against it: builds drop from one-per-tenant to one total, and the
per-tenant Vercel project disappears entirely. **§13 is not amended until an
implementation epic lands** — this is the assessment, not the change.

**`sanity.cli.ts` is unaffected**, as predicted: it is CLI, not the browser
bundle. Left untouched and verified — `pnpm typegen` produced zero drift in
`packages/config/src/sanity/generated/`, and `migrate:list` enumerated
normally.

**Open item this surfaces — a layer-contract decision, not yet made.** The
spike's tenant registry is a server-only env-var stand-in. The real lookup is
the `tenants` table in `@blog/db`, and `apps/cms` may today depend only on
`@blog/config`. A production shape (b) therefore needs either a new `cms → db`
edge (adding `cms` to `db`'s consumer list in `CLAUDE.md` and `SPEC.md` §4) or
an HTTP lookup against `apps/admin` (no new package edge, but a service call
in the hot path of every Studio page load). This belongs to the implementation
epic and must amend the layer contract explicitly before code lands.

### 6. Theming per tenant — no `@blog/ui` change

Each tenant's `settings_theme` singleton (Feature 2) lives in _its own_ Sanity
project, so per-tenant branding is just per-tenant content. The `web` theme
injector reads the resolved tenant's theme and sets the CSS variables on
`<html>` exactly as Feature 2 designs. `@blog/ui` is untouched. This is why
Feature 2 is a hard prerequisite.

**Caveat found in #1324/PR #1407 (added 2026-08-12): fonts don't fully fit
this runtime model.** `headingFont`/`bodyFont` are the one `TThemeTokens`
axis `next/font/google` can't resolve at request time — its optimization
(subsetting, self-hosting, preloading) is a _build-time_ mechanism, and a
font-loader call must be a static, top-level module-scope
`next/font/google(...)` (a hard Next.js/Turbopack constraint, not a style
preference — a dynamic-import-based attempt to scope this per-request broke
the production build outright). Today's single-tenant site works around this
by statically importing every preset's fonts and hand-setting `preload`
per font (Console's stay `true`, Editorial's are `false`) — see Open
decision 7 below for what this means once tenants (and their font choices)
multiply.

### 7. Platform app — marketing, signup, billing (decided 2026-08-28)

The public face of the platform — company/marketing pages, pricing, and the
signup/signin entry point — lives in a **new `apps/platform`**, not in
`apps/web` or `apps/admin`.

- **Not `apps/web`.** Its value in this architecture is that it renders
  _tenants, uniformly_. Platform-only routes (pricing backed by live plan data,
  signup, checkout) break that uniformity and put platform code in every tenant
  request path; a marketing bug would take every tenant site down with it.
- **Not `apps/admin`.** Wrong on four axes at once: authenticated-only, an
  operator/owner audience rather than prospects, no SEO/metadata/OG/sitemap
  infrastructure, and an ESLint guard that deliberately confines it away from
  `@blog/ui`.

Funnel: the **apex domain** — the company's main page belongs at the root, not
on a subdomain — for marketing and signup, then `admin.<domain>` for the owner's
dashboard. Cross-app session is already solved: `@blog/auth` plus
`AUTH_COOKIE_DOMAIN` is exactly this case, and both existing apps already call
their own `NextAuth()`.

**Host map once this lands.** The apex is the platform's own front door, so
everything else is a subdomain — and the tenant wildcard has to coexist with
them:

| Host                  | Serves                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `<domain>` (apex)     | `apps/platform` — marketing, pricing, signup                            |
| `admin.<domain>`      | `apps/admin`                                                            |
| `studio.<domain>`     | the shared Studio (§5, once collapsed)                                  |
| `*.<domain>`          | `apps/web` — self-serve tenants at `<slug>.<domain>` (§Open decision 5) |
| a tenant's own domain | `apps/web`, mapped on the custom-domain upgrade                         |

Two consequences the wildcard proposal did not account for:

- **The wildcard overlaps every platform subdomain.** `admin.`, `studio.`,
  `ui-library.` and `web-storybook.` all match `*.<domain>`. Vercel resolves an
  explicitly-assigned domain ahead of a wildcard held by another project, but
  that must be **verified against the live projects before the wildcard is
  added**, never assumed — getting it wrong points the admin panel at a tenant
  site.
- **Slug registration needs a reserved list.** Once `<slug>.<domain>` is minted
  at signup, a tenant must not be able to claim `admin`, `studio`, `www`, `api`,
  `app`, `mail`, `ui-library`, `web-storybook`, or any future platform
  subdomain. This was not a requirement while tenants were custom-domain-only.

**This displaces whatever holds the apex today.** The apex currently serves the
existing blog (`apps/web`). Giving it to `apps/platform` means that blog moves
to a subdomain or its own domain regardless of how §Open decision 12 resolves —
so the apex call constrains decision 12 rather than waiting on it.

**Layer contract:** `platform → ui, service, db, auth, config, utils, insight`
— identical to `apps/web`'s. `SPEC.md` §4 and CLAUDE.md's layer map both need
the new row when this lands.

**Marketing content is CMS-authored in its own Sanity project (decided
2026-08-28)**, not hand-built pages — read through `@blog/service` with an
env-configured project id, the single-project shape `apps/web` used before
tenancy. `apps/platform` is genuinely single-site, so it does **not** need
tenant resolution. Once §5's shared Studio lands, this project is simply one
more project that Studio serves; it needs no Studio of its own.

**Known costs, recorded so they are not discovered late:**

- A fourth Next app means two more Vercel projects, another deploy job, another
  `.env.example`, and another `turbo.json` build-env set. Note that
  `scripts/check-turbo-env-sync.mjs` hardcodes an `APPS` list (currently `web`
  and `admin`) — a fourth app needs an entry there, or turbo strict mode
  silently strips its vars at build time.
- It needs its own scoped subagent (`.claude/agents/platform-app.md`) per
  CLAUDE.md's delegation rule.
- `NEXT_PUBLIC_SANITY_PROJECT_ID` would mean "the marketing project" in
  `apps/platform` and "the pre-tenancy fallback project" in `apps/web` — one
  name, two meanings, across apps. Feed this into the env-naming work (#1647)
  rather than letting it land unnoticed.
- **Pricing drift.** The enforced entitlement ceiling is `PLAN_REGISTRY` in
  `packages/db/src/constants/tenant.ts`. A CMS-authored pricing page can
  silently disagree with what the code actually grants. Render tier
  capabilities _from_ `PLAN_REGISTRY`, or add a check that fails when the two
  diverge — do not hand-author both.

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
5. **Map the domain** in Vercel — ~~custom domain only~~; superseded, see
   §Open decision 5 (reopened 2026-08-28: wildcard platform subdomain at
   signup, custom domain as a paid upgrade).
6. **No Neon migration** — the shared DB is already migrated; a new tenant is
   rows, not schema. (This asymmetry is a key advantage — see below.)

This flow is the main net-new tooling and should be scripted early; done by hand
it is the bottleneck the ToS findings warn about.

**Self-serve changes where this runs (2026-08-28).** It is scripted today, but
as a CI `workflow_dispatch` an operator triggers from `apps/admin`. A public
signup flow needs §Open decisions 8 (host), 9 (membership) and 10 (trial
lifecycle) settled first. Step 3's shape-(a) branch and step 5's "custom domain
only" are both superseded — see §5 and §Open decision 5.

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

  **Do not run that fan-out inline in the release (added 2026-08-28).** Content
  migrations are irreducibly per-project — the data lives in N projects — so an
  inline step makes the release window O(N): the gap between "schema migrated"
  and "every surface consistent" grows with tenant count, and collapsing the
  Studio (§5) does **not** shrink it, since that only removes the _build_
  fan-out. Run it instead as an idempotent per-tenant reconciler converging
  behind the release, with drift visible in `apps/admin`. This requires schema
  changes to be **expand/contract (additive-only)** so `apps/web` tolerates
  both shapes during convergence — needed regardless, since there is no atomic
  cutover across N independent Sanity projects.

Naming this asymmetry up front sets expectations: the app's own data scales
cleanly; the CMS side is where "many tenants" costs you, which is exactly why
tenant count stays modest until the automation is solid.

## Sanity free-tier limits & the model ceiling

From Feature 6's 2026-08-07 research, carried here as hard design inputs:

- **Upgrade-before-cap policy.** Free projects have no overage buffer; hitting
  10k documents or the editor cap can deactivate a tenant's project. The
  registry's `plan` field + a usage check must move a tenant to **Growth
  before** it approaches a limit, not after.
- **Editor allowance — resolved 2026-08-14, see §Open decision 6.** Free
  plan: 20 total seats, Administrator/Viewer roles only, no scoped Editor
  role — a free-tier tenant's editors need Growth ($15/seat/month) for a
  real non-admin Editor role.
- **The gray area is scale-gated.** Fine at tens; confirm with Sanity before
  hundreds. This doc's whole design targets the modest-count regime; the
  explicit escape hatch at scale is **Payload** (self-hosted, one instance,
  native multi-tenant) or a paid Sanity org tier.

## Layer-contract impact

- **`@blog/config`** — new UPPERCASE consts (`TENANT_ROLE`, `TENANT_PLAN`,
  `TENANT_STATUS`). No tenant-aware `routes` helper changes — custom domains
  only (resolved 2026-08-14) means no tenant slug is ever embedded in a URL.
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
  Postgres RLS as a confirmed backstop (resolved 2026-08-14, §Open decision
  4). Every write records `tenantId` from the resolved context, never from
  client input.
- **Cross-tenant leakage risks to test explicitly:** cache tags (a mis-scoped
  tag serving A's content to B), the revalidation webhook (project→tenant
  mapping), and any admin/cross-tenant view. Each needs a targeted test.

## Open decisions (need sign-off before ticketing)

1. **Frontend topology — resolved 2026-08-14: shared app.** One Vercel
   deployment, one Neon migration, tenant resolved by `Host` header in
   middleware — lean at tens of tenants. This is the topology every other
   section of this doc already assumes.
2. **Read-token model — resolved 2026-08-14: per-tenant encrypted tokens.**
   Each tenant gets its own Sanity read token, stored encrypted in the
   `tenants` registry (never a shared platform-wide token) — explicit choice
   to contain blast radius to one tenant per leak over the convenience of a
   single shared token. The client factory (§2) resolves a tenant's token by
   decrypting its registry row, not from a shared env var. Encryption-at-rest
   mechanism (KMS-backed vs. app-level) and rotation flow are epic-2
   implementation details, not further open decisions here.
3. **Studio hosting — REOPENED 2026-08-28.** (Was: resolved 2026-08-14 as
   shape (a), one Studio codebase built + deployed per tenant.) Shape (a) was
   never actually implemented — no fan-out redeploy step exists, so tenant
   Studios are frozen at their provisioning commit — and it is incompatible
   with self-serve provisioning. Direction is shape (b), pending the
   Next-hosted-Studio spike. Full rationale in §5. **Needs sign-off.**

   **Spike done 2026-08-28 (#2260): shape (b) is proven — it still needs the
   sign-off.** One deployment served two real tenant projects, selected per
   request, each Studio reaching only its own project; no tenant id ends up in
   the build output; `sanity.cli.ts`, typegen and migrations are unaffected;
   evidence and the cost assessment are in §5. Two things remain before an
   implementation epic can be written: (i) **path- vs host-based selection**,
   which is a CORS/domain-management call rather than a code one and is
   entangled with §Open decision 5's reopened URL scheme; and (ii) the
   **layer-contract choice** for the tenant lookup (`cms → db` edge vs. an HTTP
   call to `apps/admin`), which must be settled and written into `CLAUDE.md` /
   `SPEC.md` §4 before code lands. Adopting (b) also dissolves — rather than
   renames — the `VERCEL_PROJECT_ID` collision that #1647/#1648/#1649/#1650
   address for the Studio project, since the per-tenant Studio project ceases
   to exist.
4. **Postgres RLS — resolved 2026-08-14: yes.** Defense-in-depth on top of
   `forTenant(tenantId)` — a `tenant_id` session GUC + policies on every
   engagement table.
5. **URL scheme — REOPENED 2026-08-28.** (Was: resolved 2026-08-14 as custom
   domains only, no platform subdomain scheme.) That call was sound while
   self-serve signup was a Non-goal. It does not survive self-serve: a new
   signup has no domain, and requiring DNS before the environment exists
   breaks the funnel. Proposed replacement — a **wildcard platform domain**
   (`*.<platform>`) on the shared web project, giving every tenant
   `<slug>.<platform>` with **zero** per-tenant Vercel API calls at signup;
   a custom domain becomes a paid upgrade running the existing `map-domain`
   step on demand. Also sidesteps domains-per-project limits. Note the wildcard
   overlaps the platform's own subdomains and forces a reserved-slug list at
   signup — see §7's host map for both. **Needs sign-off.**
6. **Exact free-tier editor allowance — resolved 2026-08-14, verified against
   `sanity.io/pricing`.** Free plan: 20 total seats, but **only
   Administrator and Viewer roles are available — there is no scoped Editor
   role on Free.** A free-tier tenant's content editors must hold full
   Administrator rights to edit anything; a real non-admin Editor role
   requires Growth ($15/seat/month, up to 50 seats, adds Editor/Developer/
   Contributor roles). This sharpens the upgrade-before-cap policy (§Sanity
   free-tier limits): it isn't only the 10k-doc cap that pushes a tenant to
   Growth, it's wanting _any_ non-admin editor at all — a tenant onboarding
   with more than one content-editing staffer who isn't meant to hold full
   project-admin rights needs Growth from day one.
7. **Font selection per tenant — resolved 2026-08-14: fixed preset
   catalogue.** (Added 2026-08-12, from #1324/PR #1407 —
   `headingFont`/`bodyFont` can't join the rest of `TThemeTokens` in the
   runtime `<style>` injector model (§6): `next/font/google` optimization is
   build-time only, and font-loader calls must be static/module-scope.) Since
   decision 1 confirms a **shared app** (no per-tenant build to bake a
   font choice into), tenants pick from a small, curated set of fonts the
   app already statically imports — same pattern as today's Console/
   Editorial presets. No arbitrary per-tenant font choice; revisit only if
   real tenant demand for custom fonts outgrows the catalogue.

8. **Provisioning host — OPEN (raised 2026-08-28).** Provisioning runs today as
   a `workflow_dispatch` on `provision-tenant.yml`, triggered by an operator
   from `apps/admin`. Self-serve makes CI the wrong home: workflow latency,
   Actions minutes per signup, and a public form able to cause CI runs. The
   steps are already shaped for a durable job — `(tenant, env, deps)`
   signatures, per-step idempotency checks, and a `TENANT_PROVISIONING_STEP`
   jsonb ledger — so this is a re-host, not a rewrite, once decision 3 removes
   the single step that needs a builder. Once it does, every remaining step is
   HTTP plus a DB write: there is no filesystem dependency (`placeholderPngBuffer()`
   generates its bytes in code) and the only `import.meta.url` is `run.ts`'s CLI
   entry guard.

   **The real question is not "CI or not" — it is where the org-level
   credentials live.** CI is currently acting as a _credential boundary_, not
   just a runner. `docs/context/environment-variables.md` records
   `SANITY_MANAGEMENT_TOKEN` as "a `production`-scoped GitHub Environment
   secret; never set locally", and #2020's acceptance criteria keep it confined
   there and out of `apps/admin`'s deployment env. That token can create
   projects and datasets, add CORS origins, invite members, archive projects,
   and **mint `editor` robot tokens for any project in the org**;
   `VERCEL_TOKEN` can create and delete Vercel projects and mutate domains.
   Today `apps/admin` holds only a narrowly-scoped `actions: write` PAT — it can
   _ask_ for provisioning but cannot perform it. That privilege separation is
   deliberate and must not be given up by accident.

   Consequently, **"use Vercel Functions" does not by itself answer the security
   question — which Vercel _project_ hosts them does.** A route inside
   `apps/admin`/`apps/platform` puts the org token in a public-facing
   deployment; a separate project with no public routes and its own env scope
   keeps the boundary. Same code, different blast radius. Recommended shape: a
   **dedicated provisioning worker** in its own non-public Vercel project, which
   the apps enqueue to. Note that under decision 5's wildcard scheme the signup
   path needs **no** `VERCEL_TOKEN` at all (no domain mapping at signup), so
   only the Sanity org token has to move; custom-domain mapping stays a
   lower-frequency authenticated operation that can live anywhere.

   **Runtime fit and staging.** Vercel Functions default to a 300s timeout on
   Fluid Compute against a workload of roughly 10–20s of sequential API calls,
   so a single invocation is ample. Because each step is already idempotent and
   persists progress before advancing (`createTenantSanityProject` deliberately
   persists the project id "the moment it's minted, before the dataset/CORS" —
   crash-resume design), **a plain function plus a retry is safe to start
   with**; heavier durable orchestration can wait until something forces it. The
   `concurrency: group: provision-tenant-<id>` the workflow provides today still
   needs an in-app equivalent, most likely an advisory lock on the tenant row.

   If durability is wanted, Vercel's Workflow DevKit maps almost 1:1 — each
   `steps/*.ts` becomes a `"use step"` (full Node access, automatic retry,
   persisted results), `run.ts`'s loop becomes the `"use workflow"`
   orchestrator, and `FatalError`/`RetryableError` express the distinction the
   code already needs (a 403 on invite is fatal, a 429 is retryable). Its
   `createHook()` primitive natively expresses decision 9 option (b)'s
   "invite as viewer → wait for acceptance → grant administrator", which
   otherwise needs a polling reconciler. Two cautions: `"use workflow"` bodies
   run sandboxed (no `fetch`, no Node modules), so every API call must sit in a
   step — `run.ts` currently logs and writes to the DB inline; and WDK persists
   step results for replay, so the `TENANT_PROVISIONING_STEP` ledger must stay
   the _product-visible_ state the admin UI renders rather than becoming a
   second competing source of truth.

   **One layer-contract consequence either way.** These steps carry 7 bare
   `console.*` calls (`create-sanity-project.ts`, `run.ts`), ESLint-exempt only
   under `db/scripts/**`, and CLAUDE.md's carve-out letting `@blog/db` scripts
   import `@blog/insight` directly is explicitly scoped to "standalone CLI tools
   outside the request-handling path". Both exemptions lapse the moment this
   becomes request-path code; logging has to move to the app layer.

   Recommendation: keep the CI driver for operator-initiated runs, and add a
   non-public worker driver for self-serve. **Needs sign-off.**

9. **Tenant membership model — OPEN (raised 2026-08-28).** The owner is
   currently invited to their Sanity project as `viewer`, because
   `SANITY_MANAGEMENT_TOKEN` cannot grant `administrator`
   (`403 Missing permission to invite administrators` — #2020), and an operator
   bumps the role by hand in Sanity Manage afterwards. That is one human step
   per signup and is incompatible with self-serve. Note the asymmetry: the same
   token **can** mint `editor` _robot_ tokens (`seed-content.ts` already does),
   so platform-side write automation is **not** blocked by #2020 — only the
   human path is. Three options:
   - **(a)** Elevate the token per #2020 (human console work). First confirm
     whether the limit is the token's scope or the org role of whoever minted
     it; #2020 assumes scope is adjustable and that assumption is untested.
   - **(b)** Grant the role _after_ acceptance via the ACL endpoint
     (`GET`/`DELETE /projects/{id}/acl/`), which is a different endpoint from
     `/invites` and may carry a different permission check. Cheap to test and
     unblocks with no console change if it works. Counter-evidence: Sanity's
     own guide runs ACL scripts with `--with-user-token`, hinting these
     operations may be user-authenticated rather than org-token-authenticated.
   - **(c)** Drop Sanity human memberships entirely — a platform-hosted Studio
     authenticating against Auth.js, with a server-side proxy holding the
     per-tenant `editor` robot token. Removes both the operator step and the
     second-account friction, and stops consuming Sanity seats; costs proxying
     Sanity's whole API surface (realtime listeners, asset uploads, history),
     which is framework-fighting and must be spiked, not assumed.

   Note (a) and (b) fix the _operator_ burden only. A self-serve user still
   needs a Sanity account and must accept a separate invite before writing —
   two email round-trips in the funnel. Only (c) removes that.
   **Test (b) first. Needs sign-off.**

10. **Trial lifecycle & abandoned-tenant reclamation — OPEN (raised
    2026-08-28).** Sanity imposes no project-count limit (confirmed by the
    project owner, 2026-08-28), so trials need not conserve projects and a
    no-card trial is viable. Recommendation: **one project per tenant from
    signup, promoted in place** — trial and paid are the same project,
    conversion is a `plan` flip. Explicitly **not** recommended:
    - _Recycling a used project between customers._ Members and API tokens are
      **project**-scoped, so deleting the dataset never clears them;
      reassignment risks cross-tenant access. Teardown is scriptable
      (`GET /projects/{id}/acl/` exposes every entry with an `isRobot` flag,
      and removing all roles removes the member), but it trades several
      must-never-miss invariants for a resource that is free and unlimited.
    - _Copying trial content into a fresh project on conversion._ Asset
      references are project-scoped, so this is an asset re-upload plus a ref
      rewrite — a migration, not a copy — run at the exact moment a customer
      pays, and it loses document history.

    A pre-warmed pool of **virgin** (never-assigned) projects stays legitimate
    purely as a signup-latency optimisation; measure end-to-end provisioning
    time before building one. Still undecided: the retention window for a
    lapsed tenant's data before deletion (a product promise and a GDPR-shaped
    commitment), and the extra `TENANT_STATUS` members self-serve needs —
    `TRIAL` and `PAST_DUE` are absent today (`ACTIVE | SUSPENDED | ARCHIVED`).
    Both are `pgEnum`-backed, so a change needs a generated migration.
    **Needs sign-off.**

11. **Marketing project schema — resolved 2026-08-28: reuse `apps/cms`'s
    schema.** One CMS serves the marketing project and every tenant project.
    Rationale (project owner, 2026-08-28): a single schema means a single place
    for types, and nothing leaks from marketing into a tenant's UI — a tenant
    site only renders documents that exist in its _own_ project's dataset, so an
    unused document type in the shared schema is inert.

    Two consequences worth holding:

    - _Studio noise is solvable at the structure layer, not the schema layer._
      `structureTool`'s desk structure and `document.newDocumentOptions` already
      gate what is listed and what is creatable — `sanity.config.ts` does
      exactly this today for `migrationState`. Under §5's per-host Studio
      config that structure is computed per host, so marketing-only types can be
      hidden from tenant Studios (and blog types from the marketing Studio) with
      no second schema. The shared-Studio and shared-schema decisions reinforce
      each other.
    - _The marketing project joins the content-migration fan-out._ It is one
      more project the per-tenant reconciler (§The migration story) has to
      converge, and a newly-required field on a shared type turns it red until
      migrated, exactly like any tenant. It is not exempt for being ours.

12. **Incumbent (pre-tenancy) project adoption — PARTLY DEFERRED
    (2026-08-28).** Two Sanity projects predate tenancy, one per environment.
    Both are still served by the fallback branch in
    `packages/service/src/sanity/client.ts` and `image-base-url.ts`
    (`tenant?.projectId ?? env.NEXT_PUBLIC_SANITY_PROJECT_ID`) — that `??` _is_
    the incumbent sites' code path.

    _Mechanism (needs no new provisioning logic):_ pre-insert a `tenants` row
    with `sanityProjectId`, `sanityDataset` and `seededAt` already set, then run
    provisioning normally. `createTenantSanityProject` skips creation when
    `tenant.sanityProjectId` is set, `seedTenantContent` returns early on
    `seededAt`, and the remaining steps (dataset check, CORS, token mint, domain
    map, webhook) are individually idempotent. A small `db:adopt-tenant` script
    that inserts the row is the whole of the net-new work. Each row goes in its
    own environment's registry branch.

    _Development project:_ becomes a development-registry test tenant — useful
    for exercising the provisioning flow against something real.

    _Production project:_ **deferred, undecided (2026-08-28).** It is the
    project owner's own blog; whether it stays live and becomes tenant #1, or is
    replaced by the marketing site, is not settled. **Do not adopt or repoint it
    until it is.**

    _Sequencing when it does happen:_ after epic 2b, or the site half-reads from
    the registry and half from the env var. Retire `SANITY_API_READ_TOKEN` for
    that site once the per-tenant encrypted token takes over, and verify the
    hand-created revalidate webhook matches what the idempotent `create-webhook`
    step looks for — otherwise you end up with two. **Needs sign-off
    (production half).**

## Non-goals (recorded so epics don't sprawl)

- ~~**Billing/subscription integration**~~ — **promoted to in-scope
  2026-08-28.** The registry's `plan` field remains the hook. Provider not
  chosen; run marketplace discovery before picking one. Lifecycle states and
  what each does to the site and Studio are §Open decision 10.
- ~~**Self-serve signup UX**~~ — **promoted to in-scope 2026-08-28.** A public
  "create your site" flow is now a requirement, not a later nicety. This
  promotion is what reopened decisions 3 and 5 and added 8–10: several calls
  below were sound _because_ self-serve was out of scope.
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
7. **Platform app** — `apps/platform` (§7): marketing + pricing + signup,
   with its own Sanity project for content. Gated on nothing; can start
   independently.
8. **Self-serve signup + billing** — promoted from Non-goals 2026-08-28;
   gated on §Open decisions 8–10 and on epic 7. **Later:** cross-tenant admin.

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
