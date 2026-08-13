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

## Sequencing: registry first, resolution later

The multi-tenant work was originally sequenced last, as one monolithic
"Phase 8", on the rationale that per-tenant look/voice/behavior is just those
settings _stored per Sanity project_ — so multi-tenant adds tenant resolution,
not new per-tenant knobs. **Moving config into Postgres invalidates that
rationale.** Once configuration lives in tenant-scoped rows, the config layer
and the tenant-scoping layer are the same layer; you cannot build the first
without deciding the second.

"Phase 8" is therefore split, and only one half moves:

**Tenant registry — built first (new Phase 0).** The `tenants`,
`tenant_domains`, and `memberships` tables, plus one seed row for the existing
site. Purely additive, and — critically — **nothing reads it at request time**.
The public site still resolves its Sanity project from env vars exactly as it
does today; no middleware, no client factory, no cache-key change. The only
consumer is the admin app. That makes it a small, low-risk migration whose
blast radius is a table nobody queries on the hot path yet.

**Tenant resolution — stays last (Phase 8).** Host→tenant middleware, the
per-tenant Sanity client factory (the multi-tenant doc's own "largest single
change and the main risk"), tenant-scoped ISR tags, `forTenant()`, provisioning
automation, Studio-per-tenant. This half keeps every one of its existing
blocking open decisions — above all **tenant-addressable revalidation**, which
that doc calls "the single biggest cross-tenant correctness risk in the design
and is currently unaddressed." Splitting the registry out does **not** resolve
that, and must not be read as doing so. It is deliberately left in front of the
second tenant, not in front of the first.

**What the split buys, concretely:**

- `site_config.tenantId` is a genuine FK from its first migration — no
  placeholder constant, no cross-phase promise (see the data-model section).
- The admin panel is built once, in its final shape: real tenant list, real
  switcher, real tenant-scoped routes — with one tenant. No single-tenant shell
  to restructure later. This is a stated requirement, not a nice-to-have; see
  the product-design companion doc.
- `memberships` existing means the Team page and per-tenant access control are
  real from day one rather than stubbed to "the only user is the owner."

**What it deliberately does not buy:** the ability to actually add a second
tenant. That needs provisioning, which needs resolution. The add-tenant wizard
stays behind Phase 8 — see the product-design doc for how the UI handles that
gap honestly.

**Phases 1 and 5–7 are unaffected** by this reordering. Section appearance
(Phase 1) is editorial content and stays in Sanity; the module catalogue,
portfolio, and contact form are independent feature work that was never a
multi-tenant prerequisite.

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
  logoAssetUrl  text, nullable   -- Vercel Blob URL, full-size logo
  faviconAssetUrl text, nullable -- Vercel Blob URL, pre-cropped square
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
each table's creation."

**Where the value comes from: a real FK, from the first migration.** The
`tenants` registry is built _before_ this work, not after it — see
[Sequencing](#sequencing-registry-first-resolution-later) below. So
`site_config.tenantId` is an ordinary foreign key to an ordinary table that
already has a row in it. There is no placeholder constant, no "retroactive
FK", and no promise a later phase has to remember to keep.

An earlier revision of this doc proposed a `DEFAULT_TENANT_ID` literal UUID in
`@blog/config` to stand in until Phase 8 built the registry. That is
deliberately dropped. It was a workaround for building things in the wrong
order, and it carried two real costs: a cross-phase promise (the future seed
row _must_ reuse that exact UUID, enforced by nothing but a comment), and an
admin panel whose tenant list would have had to render a hardcoded fiction
instead of a query. Building the registry first costs one small additive
migration and removes both.

`features`/`feature_toggles` (Phase 4) gets the same treatment when it's
built — typed columns or JSONB per what that phase's exact shape turns out to
need, `tenantId` from day one either way.

## Logo & favicon storage

Checked Vercel Blob's actual docs/pricing rather than assume (2026-08-13).
**Public-access-mode Vercel Blob** — direct public URL, no auth needed to
read, exactly the "large media, images, public assets" use case Vercel names
for it. Free tier (Hobby): 5 GB storage, 100 GB data transfer, 100K simple +
10K advanced operations/month, hard-capped like Neon's and Sanity's free
tiers rather than billed overage. Logos and favicons are tens-of-KB files —
a non-issue at any realistic tenant count.

**Real gap versus Sanity's asset pipeline: no on-the-fly image transforms.**
`buildImageUrl(image, { width, height, fit })` currently works because
Sanity's CDN accepts crop/resize URL params; Blob is a raw object store, it
doesn't. Two ways to cover it — `next/image` at render time (works with any
remote URL given `next.config.ts`'s `remotePatterns`), or pre-generating
fixed variants at upload time in the admin panel. For the favicon
specifically (needs one exact small square crop, not arbitrary per-request
sizing) pre-generating at upload is simpler and more reliable than resizing
on every request — hence `faviconAssetUrl` as its own column above, a
separately-stored pre-cropped object, not derived from `logoAssetUrl` at
serve time.

**`apps/web/src/app/icon.tsx`'s fetch-through pattern is unchanged.** Fetch
the asset's bytes server-side, return with the right `Content-Type`, fall
back to the static default SVG on any failure — same mechanism, just reading
`faviconAssetUrl` from `@blog/db` instead of a Sanity CDN URL.

## Input validation

Checked what this codebase already does before proposing anything new
(2026-08-13): **Zod is the established validation library** (`.safeParse()`
in `apps/web/src/app/api/generate-skim/route.ts`, and in `env.ts`'s env-var
schemas), but there's no existing max-length convention for text fields
(`identity-actions.ts`'s `updateDisplayNameAction` trims and checks
non-empty, never caps length) and **no file-upload handling anywhere in this
repo yet** — `apps/admin`'s logo/favicon upload is the first. So text-field
limits follow the existing trim-then-validate shape; file upload validation
is new ground, not a reused pattern.

**Text fields (voice overrides, tenant name/slug, team invite email) — Zod
schemas, server-side authoritative.** Client-side validation is UX sugar
only, same posture `newsletter-actions.ts` already takes (re-validates email
server-side even though the client form already checked) — never trust a
client-only check for anything persisted.

- Each of the 20 curated voice fields gets a Zod string schema:
  `.trim().max(N)`, `N` sized to the field's role (~100 chars for short
  labels like a prompt command, ~300 for longer copy like a 404 description)
  — not one flat limit for all 20.
- **Empty string is "clear the override," not "set to blank."** An emptied
  form field should store `undefined`/absent in the `voiceOverrides` JSONB,
  not `""` — preserving the same "blank falls through to the preset default"
  semantic the retired Sanity schema had. Getting this wrong (storing literal
  empty strings) would silently break the override ladder for anyone who
  clears a field expecting the default back.
- **Interpolation-token safety, checked and found not currently needed:**
  some voice-style strings elsewhere in `en.json` carry required placeholders
  (e.g. `deleteConfirmPlaceholder: 'type: {handle}'`), which would need a
  `.refine()` checking the token survives editing. None of the 20 _curated_
  fields carry one today (checked against the classification table) — noting
  the principle for whenever a future curated field does, not inventing a
  requirement that doesn't apply yet.
- Tenant slug: `.regex(/^[a-z0-9-]+$/)` (URL-safe, since it's usable as a
  platform subdomain per the multi-tenant doc) plus a uniqueness check
  against the `tenants` table (Phase 8) — not just a format check.
- Team invite email: Zod's built-in `.email()` — `apps/admin` is a new
  codebase free to standardize on Zod throughout rather than mix in
  `apps/web`'s separate loose-regex `isValidEmail` helper.

**File uploads (logo, favicon) — server-side content sniffing, not
trusted MIME type.** A browser-reported `Content-Type` is attacker-controlled
input, not proof of what the file actually is — validate by inspecting the
actual bytes (magic-number/file-type detection), not the upload's claimed
type.

- Allowed types: PNG, JPEG, WebP, SVG.
- **SVG is the one format needing real sanitization** — it can carry
  `<script>` tags and event-handler attributes. Either sanitize on upload
  (strip scripts/handlers/external references before writing to Blob) or
  don't accept SVG at all for v1; if it's accepted, sanitization isn't
  optional. Defense-in-depth on top of sanitization, worth confirming against
  Next.js's own documented safe-SVG pattern at implementation time:
  `images: { dangerouslyAllowSVG: true, contentDispositionType: 'attachment',
contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;" }`.
- File size cap (e.g. 2 MB) — enforced server-side; a client-side check is
  UX-only and bypassable.
- Dimension bounds are a nicety for the **logo** — reasonable min/max pixel
  dimensions to reject absurd uploads, not precisely specified here.
- **The favicon is the exception: square aspect ratio is enforced at upload,
  not advisory.** Reject a non-square favicon rather than accepting and
  center-cropping it. This is stricter than it looks: Vercel Blob has no
  on-the-fly transforms (unlike the Sanity CDN this project is used to), so
  whatever is uploaded is exactly what browsers render at 16–32px. A wide
  header-lockup image center-cropped to that size is unreadable — which is
  the original bug this requirement comes from (#1408/#1409, superseded by
  this design; the enforcement moves from Sanity schema validation to the
  admin panel's upload path, but it does not become optional in the move).

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
  Next.js app skeleton — **reconsidered back from Vite+React to Next.js**
  (2026-08-13, same session): Vite+React was evaluated and its two real costs
  (manual `@auth/core` session wiring instead of `next-auth`'s Next.js-native
  handling; a hand-built API surface for `@blog/db` writes instead of Server
  Actions) were enough to prefer reusing what `apps/web` already has proven
  working, rather than accept that plumbing twice. `apps/cms` (Sanity Studio,
  Vite-based) remains a valid non-Next.js precedent in this repo generally —
  just not the better fit for an app that specifically needs to share
  `apps/web`'s session and write pattern. Sharing
  `@blog/eslint-config`/`@blog/prettier-config`/`configs/tailwind`, depending
  on `@blog/db`/`@blog/config`/`@blog/ui` the same way `apps/web` does. Added
  to `turbo.json`'s pipeline and the pnpm workspace list.
- Its own Vercel project, its own domain (`admin.valstack.dev`) — human-gated
  provisioning, same as any other deploy setup (`docs/DEPLOY.md`).
- **Session sharing across subdomains:** Auth.js session cookie set with
  `Domain: .valstack.dev` so a user already logged into the main site doesn't
  need a second login for admin — `requireAdmin()`'s `OWNER`-membership check
  gates access on top of the shared session, it doesn't replace
  authentication. Both apps run `next-auth`, so this is the same session
  config on both sides, not a cross-framework integration.
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

## Email — Resend, per tenant

Checked the current implementation (`apps/web/src/server/email/send-email.ts`,
`magic-link-from-address.ts`, `newsletter-from-address.ts`): today it's one
module-level `Resend` client keyed off a single `RESEND_API_KEY`, and a
`from` address resolved from a single env var per email type
(`MAGIC_LINK_FROM_ADDRESS`/`NEWSLETTER_FROM_ADDRESS`), falling back to
Resend's shared testing sender.

**Stays one shared Resend account/API key** — proportionate to the
multi-tenant doc's own target ("tens of tenants on a lean budget"), and
consistent with the same shared-over-per-tenant call already made for the
Sanity read-token open decision. What changes: each tenant's verified sending
domain becomes **tenant config data** (part of `site_config` or a sibling
column), not an env var — `resolveNewsletterFromAddress`/
`resolveMagicLinkFromAddress`'s env-var read is replaced with a per-tenant
lookup. Resend supports multiple verified domains under one account, so this
is a data change plus a one-time DNS-verification step per tenant during
onboarding, not new infrastructure or a new Resend account per tenant.

## Confirmed, not changed: Sanity stays project-per-tenant

Came up in this same discussion (2026-08-13) — worth recording since it
reinforces rather than merely repeats the multi-tenant doc's already-settled
"Content is Sanity project-per-tenant." Checked Sanity's own dataset docs
directly: datasets explicitly share "the same user access and billing" as
their parent project, and private (authenticated-only) datasets are a
Growth-plan-only feature — free tier doesn't support dataset-scoped access at
all. So "one project, N datasets per tenant" would mean any project member
(on free tier: any non-Viewer) sees every tenant's dataset — the exact same
free-tier role limitation that motivated this whole doc, showing up again on
the content side. Separate Sanity projects per tenant is confirmed necessary,
not just preferred. No change to the multi-tenant doc from this — it already
said project-per-tenant — this is additional grounding for why.

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
- ~~`SPEC.md` §4 (layer contracts) — `apps/admin` as a new workspace, its
  relationship to `@blog/db`/`@blog/config`/`@blog/ui`.~~ **Done early**
  (#1453), because adding the `admin-app` subagent made `CLAUDE.md` assert
  `apps/admin` as a `@blog/db` consumer, which §4 would otherwise have
  contradicted. §13 (deployment topology) is still pending — `apps/admin` has
  no deploy job yet.
- `docs/context/content-model.md` — remove the `settings_theme`/
  `settings_voice` entries this session added; document `site_config` instead.
- Per repo rules, this doc is deleted once its epic(s) ship and `SPEC.md`
  reflects the final shape — same as any other design doc.
