# Tenant Config Moves to Postgres + a Dedicated Admin App — Design

> **Supersedes, in part:** the configurability doc's D3 ("tenant picks a preset +
> curated overrides via CMS") and the multi-tenant doc's §6 ("Theming per
> tenant... lives in its own Sanity project") both assumed Sanity was the
> storage/editing surface for theme and voice config. This doc revises that
> specific assumption; it does not relitigate anything else in either doc
> (Sanity-per-tenant for _content_, the RBAC split, the engagement-data
> tenant-scoping model, D1/D2/D4–D10 of the configurability doc all stand as
> written). `SPEC.md` sync (when this ships) updates both source docs in
> place rather than leaving this as a permanent third doc — see "Spec sync
> when built" below.

## Purpose

Phase 2 (theme) and Phase 3 (voice) were built as Sanity CMS singletons,
editable via Sanity Studio. Two findings from building Phase 3 undermine that
choice:

1. **Sanity's free tier has exactly two roles: Administrator and Viewer.**
   There is no way to grant "can write blog posts" without also granting "can
   edit every settings singleton." Curated CMS fields don't help — the access
   control they'd need doesn't exist below Enterprise pricing.
2. **Almost no customer will actually want to.** Picking an `accentHue` or
   filling in 20 voice-override strings inside a generic Sanity document
   editor is real onboarding friction for a product being sold to
   non-technical customers, most of whom just want to pick a preset and move
   on.

The fix: stop treating "how the site looks/sounds/behaves" as CMS content.
Sanity stays the single source of truth for **editorial content only**.
Product/tenant configuration moves to Postgres (`@blog/db`), edited through a
new, purpose-built admin app — not Sanity Studio.

## Scope

**Moves out of Sanity, into Postgres + the admin app:**

- `settings_theme` (Phase 2, shipped) — preset, `accentHue`, `logoHue`,
  `headingFont`, `bodyFont`, `radiusScale`, `density`.
- `settings_voice` (Phase 3, #1421, merged) — the 20 curated voice-override
  fields.
- `settings_features` (Phase 4, #1289, not yet built) — never gets a Sanity
  schema at all; built directly in Postgres.
- `brand.logo` (currently a field on `settings_site`) — pulled out; it's
  visual branding tightly coupled to theme rendering, not editorial content.

**Stays in Sanity (editorial content):** posts, categories, tags, pages,
`settings_navigation`, `settings_footer`, `settings_newsletter` (signup copy),
and the rest of `settings_site` (name, SEO fields).

## Data model — `packages/db`

One new table, following the existing `admins`/`subscribers` Drizzle
convention:

```
site_config
  id            uuid PK
  tenantId      uuid, not null   -- see "tenantId now" below
  preset        pgEnum('CONSOLE' | 'EDITORIAL')
  accentHue     integer
  logoHue       integer
  headingFont   pgEnum(FONT_CHOICE values)
  bodyFont      pgEnum(FONT_CHOICE values)
  radiusScale   pgEnum(RADIUS_SCALE values)
  density       pgEnum(DENSITY values)
  logoAssetUrl  text, nullable   -- Vercel Blob URL
  voiceOverrides jsonb           -- Record<string, string>, the curated keys
  createdAt / updatedAt
```

**Typed columns for theme, JSONB for voice — a deliberate split, not an
oversight.** Theme's field set is small and stable (six knobs, unchanged
since Phase 2 shipped). Voice's curated field list already changed once
mid-build this session (a real gap was found and fixed live) — JSONB avoids a
migration every time that set grows or shrinks, at the cost of per-key type
safety and queryability. If per-key querying turns out to matter later,
promoting specific JSONB keys to real columns is a normal, additive Drizzle
migration — not a redesign.

**`tenantId` is added now, on a table with zero rows, specifically to avoid
the mistake already made once.** `bookmarks` and `subscribers` shipped without
`tenantId` and will need a backfill migration when Phase 8 lands — an
accepted, known gap for tables that already held data by the time multi-tenant
was designed. This table doesn't exist yet. The multi-tenant doc's own advice
applies directly: "cheapest path is to land the `tenantId` columns _with_
each table's creation." Today there is exactly one tenant (a fixed default
row); the column exists so Phase 8 is additive, not a migration.

`features`/`feature_toggles` (Phase 4) gets the same treatment when it's
built — typed columns or JSONB per what that phase's exact shape turns out to
need, `tenantId` from day one either way.

## Migration mechanics

- **Retire the Sanity schemas** (`cms`): remove the `settings_theme` and
  `settings_voice` document types, their desk-structure entries, their
  `documents/index.ts` registrations, and `brand.logo` from `settings_site`.
  Re-run `pnpm typegen`.
- **`settings_theme` has live production data** — PR #1414 migrated real
  `accentHue`/`logoHue` values into it. This needs an actual, human-gated
  Sanity→Postgres migration script: read the current document via the Sanity
  client, transform, insert into `site_config`. Same backup-first,
  dry-run-then-approve posture as any other production data move in this
  repo — this is cross-system, not the usual `apps/cms/migrations/` tooling.
- **`settings_voice` almost certainly has zero real data** — the schema
  merged in this same session, before any tenant could have filled anything
  in. Worth a one-line check against the live dataset before assuming this,
  but no migration script is expected to be needed.

## Consumers — `db`, not `service`

Per this repo's existing layer contract, `@blog/db` is a sibling to
`@blog/service`, consumed only by `web` — this is new `@blog/db` query
functions (`getSiteConfig()`, `updateSiteConfig()`), not a `service`-layer
change. `apps/web`'s theme `<style>` injector and the `next-intl` request-
config voice-ladder merge both switch from calling
`service.global.themeSettings`/`voiceSettings` to calling `@blog/db` directly.
The ladder itself (`neutral base ← preset pack ← tenant override`) and the
code-owned preset defaults (`PRESET_REGISTRY`, `CONSOLE_VOICE_PACK`,
`deepMergePartial`) are unaffected — they're config-layer, storage-agnostic,
and already built correctly (#1419).

## The admin app — `apps/admin`, a new workspace

Not a route group inside `apps/web`. A genuinely separate app, matching the
precedent already in this repo: `apps/cms` (Sanity Studio) is already its own
Vercel deployment, its own domain, "Vercel-hosted, not `sanity deploy`"
(`SPEC.md` §13). `apps/admin` follows the same shape:

- New workspace: `package.json`, `tsconfig.json`, `vitest.config.ts`, a
  Next.js app skeleton, sharing `@blog/eslint-config`/`@blog/prettier-config`/
  `configs/tailwind`, depending on `@blog/db`/`@blog/config`/`@blog/ui` the
  same way `apps/web` does. Added to `turbo.json`'s pipeline and the pnpm
  workspace list.
- Its own Vercel project, its own domain (`admin.valstack.dev`) — human-gated
  provisioning, same as any other deploy setup (`docs/DEPLOY.md`).
- **Session sharing across subdomains:** Auth.js session cookie set with
  `Domain: .valstack.dev` so a user already logged into the main site doesn't
  need a second login for admin — `requireAdmin()`'s `OWNER`-membership check
  gates access on top of the shared session, it doesn't replace
  authentication.
- **Tenant resolution is session-based, not host-based.** `admin.valstack.dev`
  is one fixed domain; which tenant's config a logged-in user sees/edits comes
  from their `memberships` row(s), the same way Vercel's own dashboard
  resolves "your projects" from who's logged in — not from a per-tenant
  admin subdomain. This is deliberately different from the public site's
  host-based tenant resolution (middleware reading the `Host` header), which
  stays as the multi-tenant doc already designed it. Today, with one tenant,
  this distinction is invisible; it matters once Phase 8 lands.

**Supersedes #1202–#1204's current shape.** That epic is open, not merged —
this is a clean correction, not an undo of shipped work. `#1203` (the
`admins` table) is unaffected — correct regardless of which app reads it.
`#1204` (`requireAdmin()` + `/admin` route-group _inside_ `apps/web`) gets
rescoped: the `requireAdmin()` logic is still right, it moves to
`apps/admin`'s own root layout instead of an `apps/web` route group.

## Deployment topology (confirmed, not new — restated for this doc's scope)

- **`apps/web` (the tenant-facing site) stays a single shared Vercel
  project.** Vercel's own documented guidance (`multi-project-platforms`
  vs. `multi-tenant-platforms` docs) is explicit: multi-project is for
  platforms where tenants deploy their own code; multi-tenant/single-project
  is for "all tenants use the same application, content differs but code is
  the same" — which is this product. One deployment, N custom domains
  attached, tenant resolved by `Host` header in middleware. No fan-out
  deploys, no per-tenant env vars.
- **Blast-radius control** (the original worry that prompted this sub-thread)
  comes from Rolling Releases (canary rollout, one deployment) and
  preview→production promotion gates, not from per-tenant deployments — and
  gets an extra lever once `settings_features`/Phase 4 lands: risky changes
  can be flag-gated per tenant as data, not deploy topology.
- **`apps/admin` is a separate deployment from `apps/web`**, for the reasons
  in the previous section — this is a _second_ axis of blast-radius
  isolation (an admin-panel bug can't break the public site and vice versa),
  additive to Rolling Releases, not a replacement for the "no per-tenant
  deploys" decision on the public site.

## Fonts — no change to the already-decided mechanism

Flagging explicitly since it came up in this same discussion: font choice
stays a **curated, closed set** (`FONT_CHOICE`'s enum). All curated fonts are
statically imported once in the single shared `apps/web` build (self-hosted
regardless of which tenants use them); the active one applies via a CSS
custom property at request time, exactly like `accentHue` today. Only the
single most-common default carries the `preload` hint — this is the same
trade-off the codebase already ships between the `console`/`editorial`
presets today (`preload: true` vs `false`), just extended to more tenants
picking from the same known set. No per-tenant rebuild needed. A possible
future refinement (manually injecting a per-tenant `<link rel="preload">`
pointing at the already-self-hosted asset) is noted but not committed to —
worth investigating only if the non-default-font latency proves to matter in
practice, not assumed solved here.

## Impact on in-flight and shipped Phase 2/3 work

| Item                                                                        | Status                | Disposition                                                                                                 |
| --------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| #1419 (config: `PRESET_REGISTRY`, `CONSOLE_VOICE_PACK`, `deepMergePartial`) | merged                | **Stays valid, unaffected** — code-owned defaults, storage-agnostic.                                        |
| #1421 (cms: `settings_voice` schema)                                        | merged                | **Retired** — real undo of just-shipped work, named plainly.                                                |
| #1420 (web: neutralize `en.json`)                                           | stopped mid-work      | Unaffected by storage location — resumable as-is whenever picked back up.                                   |
| #1422 (service: voice-settings fetcher)                                     | stopped mid-work      | **Obsolete in its current form** — replaced by a `@blog/db` query, not a `@blog/service` one.               |
| Phase 2's shipped `settings_theme` schema/fetcher/injector                  | merged                | Same treatment as #1421/#1422 — schema retired, fetcher moves to `@blog/db`, `apps/web` injector rewritten. |
| Chrome-gating epic (#1415–#1417)                                            | ticketed, not started | Unaffected — component composition, not data storage.                                                       |
| Email-templates issue (#1418)                                               | ticketed, not started | Unaffected.                                                                                                 |
| #1202–#1204 (admin/role gating epic)                                        | ticketed, not started | #1203 unaffected; #1204 superseded per "The admin app" above.                                               |

## Non-goals (recorded so this doesn't sprawl)

- **Multi-tenant admin UX** (switching between tenants inside `apps/admin`,
  per-tenant admin permission tiers beyond `OWNER`) — Phase 8's job, not this.
  This doc only makes the single-tenant-today shape _not_ need re-architecture
  when Phase 8 lands.
- **Per-tenant Neon databases** — evaluated and rejected (Neon free tier
  supports up to 100 projects/org, so it's _feasible_, but reintroduces the
  same per-project fan-out tax this whole move is trying to get away from on
  the Sanity side). Shared `@blog/db`, `tenantId`-scoped, stands.
- **Free-form font selection** ("any Google Font") — out; the curated closed
  set stands, per the fonts section above.
- **Moving `settings_navigation`/`settings_footer`/`settings_newsletter` out
  of Sanity** — these are genuinely editorial content (an editor building a
  nav, writing footer copy, tuning campaign copy), not product configuration.
  Explicitly not in scope for this move.

## Spec sync when built

- Configurability spec's **D3** — rewrite "tenant picks a preset + curated
  overrides via CMS" to name Postgres + the admin app as the editing surface.
- Multi-tenant spec's **§6 "Theming per tenant"** — rewrite "lives in its own
  Sanity project" to describe the shared-`@blog/db`, `tenantId`-scoped model.
- `SPEC.md` §6 (content model) — `site_config` table, retirement of
  `settings_theme`/`settings_voice` from the Sanity content model.
- `SPEC.md` §4 (layer contracts) — `apps/admin` as a new workspace, its
  relationship to `@blog/db`/`@blog/config`/`@blog/ui`.
- `docs/context/content-model.md` — remove the `settings_theme`/
  `settings_voice` entries this session added; document `site_config` instead.
- Per repo rules, this doc is deleted once its epic(s) ship and `SPEC.md`
  reflects the final shape — same as any other design doc.
