# Flexible Theming & Page-Builder Growth — Design

**Status:** Design / brainstorm pass (no code in this issue). Output feeds
per-feature `superpowers:writing-plans` passes and `board-keeper` ticketing
once reviewed. Nothing here is filed yet.
**Date:** 2026-08-07
**Scope:** Six related features that grow the blog into a flexible
portfolio/marketing-site builder for many client sites. Features 1–5 are
concrete builds; Feature 6 records a **multi-tenant direction now decided**
(Sanity project-per-tenant, one org), whose implementation is handed off to
its own dedicated design doc + brainstorm (see Feature 6).
**Related / dependencies:**

- **Module type flow** (`packages/config/src/constants/module.ts`) — there is
  **no** hand-maintained `MODULE_TYPE` const. `TModuleType` is **derived** from
  the generated Sanity types (an `Extract<AllSanitySchemaTypes, { _type:
'module_*' }>` template-literal match), so the single source of truth for a
  module's type is the **cms schema's `name:` field**, per `SPEC.md` §6 and the
  archived modular-content-architecture design. Adding a module threads through
  cms `module_*` schema → `pnpm typegen` (regenerates `TModuleType`) → the
  relevant pages' `defineModulesField({ allow })` → `service.modules.<type>` →
  web `MODULE_MAP` (a `Record<Exclude<TModuleType, 'module_hero'>, …>` that
  fails to compile if a type is left unregistered).
- **Design tokens** (`configs/tailwind/theme.css`) — the OKLCH `:root` / `.dark`
  custom-property set (`--bg`, `--surface`, `--text`, `--accent`, …) plus the
  existing `.indigo` accent variant. Features 1–2 generalise this file's values
  from build-time constants into content. **`@blog/ui` already references only
  token names** (audited 2026-08-07: no raw hex/rgb/oklch or arbitrary Tailwind
  literals in `packages/ui/src` or `apps/web/src` except the sanctioned brand
  SVG in `brand-icon-svg.ts`), so component adaptation is automatic.
- **`next/font`** (`apps/web/src/config/fonts.ts`, currently Space Grotesk /
  Newsreader / JetBrains Mono) — the font-loading path Feature 2 makes
  CMS-selectable.
- **`@blog/db` (Neon + Drizzle)** — the engagement persistence layer (#984
  bootstrap). Feature 4 (leads) adds a table here; Feature 6's leaning
  multi-tenant shape would add `tenantId` to the engagement tables plus
  `tenants` / `memberships` tables (open — see Feature 6). `service` stays
  Sanity-only; `db` is the sibling layer `web` consumes.
- **M5 engagement foundations** (`docs/BACKLOG.md`) — Feature 4 reuses the
  `TextInput`/`Textarea` atoms (#1091), status tokens (#1093, `--ok/--warn/
--danger`), and the shared Resend send-email helper (#1107). Build after
  those land, not before.

## Purpose of this pass

A conversation about growing the page builder converged on six features and a
set of decisions about how far editor-controllable styling should go. This
document records those decisions and their layer placement so each feature can
be ticketed correctly (epic + per-layer sub-issues, per repo rules). It does
**not** design pixel-level visuals or write GROQ — it fixes the model, the
contracts touched, the migration posture, and the build order.

The six features, in build-dependency order:

1. **Section appearance object** — per-section styling knobs on every module.
2. **Theme-as-content** — global theme (accent, fonts, radius, density)
   authored in Studio, injected as CSS variables.
3. **New page-builder modules** — the module catalogue that makes full
   marketing/portfolio pages buildable without code.
4. **Contact form / lead capture** — the one module needing a write path.
5. **Portfolio content type** — `project`/`caseStudy` as a first-class
   document with its own surface.
6. **Multi-tenant** — direction now decided (Sanity project-per-tenant, one
   org; app-facing RBAC in Neon). Records the settled decisions; the
   implementation gets its own design doc.

Features 1–2 are the flexibility spine and should ship first. Features 3–5 are
independent of each other and of the spine (they inherit it for free). Feature
6 is not a build in this doc — it records the multi-tenant decisions reached
and hands off to a dedicated design doc + `superpowers:brainstorming` pass
before any code.

## Constraints that shape the design (not decoration)

- **Layer contracts hold unchanged.** `@blog/ui` stays pure, prop-driven, no
  `'use client'`, and keeps referencing token _names_ only — it never learns a
  theme is dynamic. `@blog/service` stays Sanity-only. `apps/web` is the only
  place theme/appearance data meets `ui`. No new cross-layer import, no cycle.
- **Tokens are the contract.** Every color/radius/spacing a component uses is a
  CSS variable. Changing a variable's _value_ on `<html>` re-themes the whole
  app with zero component edits. This is why Features 1–2 are a _source +
  injector_ problem, not a component-retrofit problem.
- **WCAG is a value in this repo.** `theme.css` annotates verified contrast
  ratios (4.5:1 text / 3:1 non-text) per token pair. Any editor-set color must
  preserve those guarantees — by fixing the neutral ramp, deriving dependents,
  or validating pairs at author time (Feature 2).
- **Live-data migration posture.** Additive, optional-only Sanity changes need
  no content migration (stated explicitly per feature below). New `@blog/db`
  tables need a `drizzle-kit generate` schema migration (the generate step _is_
  the dry-run), applied dev-free / prod-gated.

---

## Feature 1 — Section appearance object

**Goal:** let editors vary the rhythm and color-blocking of a page without a
developer, and give every current and future module the same knobs for free.

**Content model.** A new shared object `objects/appearance.ts` (name TBD:
`appearance` / `sectionStyle`), added as an optional field on **every** module
document via a `withAppearance()` helper (mirrors the `titleField` /
`defineModulesField` helper pattern). Fields, each backed by an UPPERCASE
`@blog/config` const:

- `background` — `BACKGROUND_TONE` (`DEFAULT` / `SUBTLE` / `SURFACE` /
  `ACCENT_TINT` / `INVERSE`), resolving to `--bg` / `--bg-subtle` / `--surface`
  / `--accent-muted` / inverted neutrals.
- `spacingTop`, `spacingBottom` — a `SPACING_SCALE` (`NONE`/`SM`/`MD`/`LG`/`XL`).
- `containerWidth` — `CONTAINER_WIDTH` (`NARROW`/`WIDE`/`FULL`).
- `align` — optional `ALIGN` (`START`/`CENTER`).
- `divider` — optional boolean (hairline above the section, `--border`).

**Service.** The thin page query already returns lightweight module descriptors
(`{ _key, _type, _id }`); each per-module fetcher (`service.modules.<type>.v1`)
adds `appearance` to its projection and view-model (`TAppearance | undefined`,
no faked defaults — existing convention).

**UI.** `@blog/ui` gains one pure presentational wrapper — `Section` (atom/
molecule) — that maps `TAppearance` props to token-backed Tailwind classes.
Every module organism renders inside it. No organism learns about the CMS; it
receives resolved props.

**Web.** Each per-module component in `apps/web/src/modules/<type>/` reads its
view-model's `appearance` and passes it to `Section`. This is the only place
the mapping lives.

**Migration.** None — the field is additive and optional on existing module
documents. Unset `appearance` = current default rendering. State this to the
user explicitly when ticketing.

---

## Feature 2 — Theme-as-content

> **Superseded 2026-08-10 by
> [`2026-08-10-configurability-and-de-console-design.md`](./2026-08-10-configurability-and-de-console-design.md)
> — build from that doc, not this section.** Theme-as-content is absorbed into
> that doc's sub-projects A (look) and D (presets), which generalise it into a
> three-axis (look/voice/behavior) per-tenant configurability layer with a
> `console`/`editorial` preset model. The full design (content model, service
> fetcher, `<style>` injector, guardrail lint rule) now lives there; this
> section is intentionally left trimmed to avoid two driftable copies.

**Migration.** None — `settings_theme` is a new, additive singleton; absent =
current hardcoded defaults.

**Deferred — full neutral repaint (the "sepia / old-book-page" case).** Letting
editors set backgrounds too is possible but relational: contrast is a property
of a _pair_, so exposing the neutral ramp multiplies the pairings that can
fail. It requires author-time contrast validation (a custom Sanity validation
computing WCAG ratios from OKLCH, `warning` or `error`) and/or deriving the
ramp from a base lightness + neutral hue. Recorded as a follow-up, not v1.

---

## Feature 3 — New page-builder modules

**Goal:** enough module types to compose a full marketing/portfolio landing
page with zero bespoke code. Each is one `MODULE_TYPE` entry threaded through
all five layers — the established, type-checked pattern.

Catalogue, ordered by portfolio/client value:

- `module_projectGrid` — project / case-study cards (the portfolio showcase;
  fetches from the Feature 5 `project` type).
- `module_gallery` — image/media grid with lightbox.
- `module_featureGrid` — icon + title + text grid (services / skills).
- `module_testimonial` — quote + attribution.
- `module_logoWall` — client / tech logos.
- `module_stats` — metric figures ("40% faster", "3M users").
- `module_faq` — accordion (interactive; the disclosure lives in a `web`
  client leaf per `web-component-practices`, the organism stays pure).
- `module_embed` — video / oEmbed (YouTube, Loom, CodePen).
- `module_contactForm` — Feature 4 (has a write path; specced separately).
- Second wave: `module_pricing`, `module_timeline`.

**Per module, the same steps** (dependency order `cms → service → ui → web` —
**no config-const step**, since a module's `_type` is derived from its schema,
not declared in `@blog/config`): add the cms `module_*` document schema
(`titleField` + display fields + Feature 1 `appearance`) and add it to the
relevant pages' `defineModulesField({ allow })`; run `pnpm typegen` so
`TModuleType` picks up the new `_type`; add `service.modules.<type>.v1` (query +
transformer + view-model + cache tags); add a pure `@blog/ui` organism (+
stories + tests); register the web component in `MODULE_MAP` (the
`Record<Exclude<TModuleType, 'module_hero'>, …>` makes a missing registration a
compile error).

**Migration.** None — new module types and widening `allow` lists are additive.

**Ticketing.** Each module is small enough to be **one issue** (single-ish layer
chain), _not_ a multi-layer epic — but the batch of them should share a tracking
epic so the catalogue is one coherent unit of work.

---

## Feature 4 — Contact form / lead capture

**Goal:** the module clients most want — and the only one in the catalogue with
a write path. Deliberately assembles pieces the M5 engagement phase already
builds.

**Composition (mostly reuse):**

- **db** — a new `leads` table in `@blog/db` (name, email, message, sourcePage,
  createdAt; sibling to `subscribers`). New table → `drizzle-kit generate`
  schema migration, dev-free / prod-gated per `SPEC.md` §8.
- **ui** — a `ContactForm` organism built on the existing `TextInput` /
  `Textarea` atoms (#1091), states bound to status tokens (#1093).
- **web** — a client-island form + server action writing via `@blog/db`, plus a
  notification email through the shared Resend helper (#1107). Spam mitigation
  (honeypot / the Feature-... rate-limit follow-up #1042 pattern) applied here.
- **cms** — the `module_contactForm` document (heading, intro, recipient/label
  config), placeable in the page builder like any module.

**Depends on:** #984 (db), #1091 (atoms), #1093 (tokens), #1107 (Resend). Do not
start before those land.

**Non-goal:** a CRM / inbox UI for leads — v1 stores rows and emails a
notification; managing them is a later concern (mirrors the newsletter
"signup only, no campaign UI" boundary).

---

## Feature 5 — Portfolio content type

**Goal:** turn "a blog" into "a portfolio site that also blogs" by mirroring the
proven `post` pattern rather than bolting portfolio onto posts.

**Content model.** A new `project` (or `caseStudy`) document: title, slug,
client, role, stack (tags), year, `outcomeMetrics` (repeatable label+value),
`heroImage`, `gallery`, `body` (richText), `seo`, `featured`. Reuses the
existing `category` / `tag` taxonomy, the `seo` object + fallback ladder, and
`imageWithAlt`.

**Surfaces.** New routes `/work` (+ `/work/page/N`) and `/work/[slug]`, cloning
the blog-index / post-detail composition, feeds (sitemap + optional RSS), and
JSON-LD (`CreativeWork`). Add `work` and `work/*` to `RESERVED_SLUGS` so the
generic `/[slug]` route doesn't collide.

**Service / UI / Web.** A `service.pages.work.*` slice; reuse `PostsSection` /
`PostCard` where shapes align (or a thin `ProjectCard` variant); web routes +
`generateMetadata` per `seo-and-metadata`.

**Migration.** None — new document type and new routes are additive. Existing
posts are untouched.

**Ticketing.** Multi-layer feature → epic + per-layer sub-issues
(`config → cms → service → ui → web`), like reading-depth (#957).

---

## Feature 6 — Multi-tenant (direction decided; own design doc before build)

**Status of this section.** The thread that began as "readiness" resolved into
an actual direction: the product **is** going multi-tenant — many client sites,
each edited by **that client's own staff**, isolated from each other, at the
scale of **tens of tenants on a lean budget**. This section records the
decisions reached; it is **not** the implementation design. Multi-tenant is
cross-cutting and large enough to earn its **own dedicated design doc +
`superpowers:brainstorming` pass** before any code — treat what follows as the
settled inputs to that doc, not a build plan, and do not ticket from it.

**Content / CMS — decided: Sanity project-per-tenant, one organization.** Each
tenant gets its own Sanity **project** — not a separate account/login, not a
shared dataset with a `tenant` field — all under a single Sanity
**organization** (one billing point). Rationale from the brainstorm:

- **Isolation is automatic and free.** Tenant staff are invited only to their
  own project, so they can neither see nor edit another tenant's content, with
  no per-document ACL to build. Sanity's project membership _is_ the
  content-edit boundary. (Sanity has no row-level security, which is why a
  shared dataset + `tenant` field was rejected — Studio filtering there is
  cosmetic, not a security boundary.)
- **Economics fit "lean, tens of tenants."** The free plan is **per-project**
  (verified 2026-08-07: 20 seats, 10k docs, generous CDN/bandwidth, 2 roles,
  public datasets only), and many free projects live under one org. A tenant
  rides free until _its own_ needs exceed it; upgrading that one project to
  **Growth (~$15/seat/mo)** is then **billed through to that paying tenant** —
  cost scales with tenant success, not with your headcount.
- **Building an own CMS was rejected.** Reproducing Studio (Portable Text
  editor, image pipeline/hotspot, references, draft/publish, history,
  real-time, typegen) is a multi-month build that would be _worse_ than
  Sanity; the only thing it buys — escaping per-seat pricing and getting
  per-tenant RBAC — project-per-tenant already gives cheaply. **Payload CMS**
  (self-hosted, Postgres/Neon, official multi-tenant plugin, access-control
  functions) was noted as the credible "adopt, don't build" fallback if
  project-per-tenant hits its ceiling — **not** the chosen path now.

**Accepted caveat (fine for this product).** Free datasets are **public** —
acceptable because the sites are public anyway, and drafts stay token-gated
regardless. In the model's favour: the frontend **deliberately bypasses the
Sanity CDN** (ISR/build-time reads, `SPEC.md` §9), so a busy tenant is unlikely
to burn its free API/bandwidth quota — traffic is the free limit least likely
to bite.

**Business & operational risk — researched 2026-08-07 (no hard blocker, eyes
open).** Findings on stacking free projects:

- **No explicit ban; commercial use is allowed.** The free plan permits
  commercial use and projects can be created programmatically via the Projects
  API — there is no license-level prohibition on multi-tenant stacking.
- **A fair-use / abuse gray area that grows with count.** Sanity reps have said
  creating _thousands_ of projects will prompt them to reach out, and the ToS
  retains a broad right to throttle/terminate architectures deemed to
  systematically exploit the platform or circumvent paid multi-tenancy. Low-risk
  at tens of tenants; real exposure at hundreds-plus. Confirm with Sanity before
  scaling past a modest count.
- **Hard caps with no overage buffer.** Free projects cap on documents (10k) and
  editors and — unlike paid plans — cannot pay for overage; hitting a cap can
  deactivate that tenant's project or fail its mutations. A tenant approaching a
  limit must be moved to Growth _before_ it hits the wall, not after.
- **Editor allowance is the number to pin down.** Sources conflict (up to ~20
  seats vs. ~2 non-admin editors / 2 roles on free). This sets how soon a tenant
  needs Growth, so verify the _exact_ current free-tier editor allowance on
  `sanity.io/pricing` before committing — it directly drives the "rides free"
  economics.

**The recurring operational tax (free _or_ paid): per-project fan-out.**
Project-per-tenant shares no schema, roles, or config across tenants — a schema
change is _N_ programmatic migrations across _N_ projects, each with its own
project ID + Studio URL, and cross-project unified login/SSO may need Enterprise
org mapping. This is inherent to the model, not a free-tier artifact; it is the
main reason to keep tenant count modest and to invest early in the
provisioning/migration automation (open item 3 below). It also bounds the
model: the dedicated doc should size _how many tenants_ this holds for before
Payload (or a paid Sanity org tier) becomes the better trade.

**RBAC is split — decided.** Two distinct role systems by design:

- **Content editing** → Sanity project membership (per tenant, per project).
- **Frontend / engagement** (comments, ratings, bookmarks, `/bookmarks`, future
  account features) → **the Neon layer**: a `tenants` registry + a `memberships`
  table (`userId`, `tenantId`, `role`) enforced in `web`. Sanity roles cannot
  express "editor within tenant Y," so app-facing roles never live there.

**Open — belongs in the dedicated doc, not settled here:**

1. **Frontend serving topology** — one shared Next.js app resolving the tenant
   by domain/subdomain (a `tenants` registry maps host → Sanity `projectId` +
   `tenantId`; the app reads that tenant's content per request), **vs.**
   deployment-per-tenant (each tenant its own Vercel app). For tens of tenants
   on a lean budget the **shared app is the likely pick** — but not settled.
2. **Neon shape follows from (1).** A shared frontend app ⇒ **shared Neon +
   `tenantId` on every engagement table** (comments, ratings, bookmarks,
   subscribers, leads) + the `tenants`/`memberships` tables, every query
   tenant-scoped. Per-tenant deployment ⇒ branch/DB-per-tenant, no column. The
   leaning shared-app pick **reverses the earlier no-`tenantId` posture** — if
   it holds, each engagement table should get `tenantId` **at creation** (trivial
   on an empty table; a data migration later). **Caveat:** `bookmarks` and
   `subscribers` already exist in `@blog/db` today (only `comments`/`ratings`/
   `leads` are still unbuilt), so for those two the "additive at creation" window
   is only open while they hold no rows — if production already has any, adding
   `tenantId` there is already a backfill. Decide before more rows accrue.
3. **Provisioning automation** — create a Sanity project + dataset, deploy the
   Studio configured with that `projectId`, invite the tenant's staff, via
   Sanity's management API. Bounded, one-time tooling.

**Next step:** a dedicated multi-tenant design doc that resolves (1)–(3) and
records the Sanity-ToS verification outcome, from which epics are then filed.

---

## How this composes — layer flow

```
config  →  BACKGROUND_TONE/SPACING/CONTAINER_WIDTH/ALIGN + RADIUS/DENSITY/FONT_CHOICE consts
           (no module-type const — a module's _type derives from its cms schema via typegen)
cms     →  module_* schemas + appearance object + settings_theme singleton + project type
service →  service.modules.<type>.v1 (+ appearance)   service.settings.theme.v1   service.pages.work.*
db      →  leads table   (+ tenantId + tenants/memberships IF the shared-app multi-tenant shape is confirmed — Feature 6, open)
ui      →  Section wrapper + new module organisms + ContactForm (all pure, token-only)
web     →  <style> theme injector (:root + .dark) + next/font wiring + MODULE_MAP entries + /work routes + lint guard
```

`@blog/ui` never imports `service`/`db`/`sanity`; `web` is the only meeting
point; the graph stays acyclic.

## Decision log

- **D1 — Appearance is a shared object on every module, not a module itself.**
  Maximises reuse; one helper adds it everywhere.
- **D2 — v1 theming exposes accent + fonts + radius + density only; the neutral
  ramp stays fixed for light and dark.** Keeps every text pairing permanently
  WCAG-verified; the only color to validate is accent-on-known-background.
- **D3 — Accent is set as a hue and the ramp is re-derived at fixed lightness,**
  not chosen with a freeform picker. Contrast holds by construction. A picker
  (`@sanity/color-input`) is available if freedom is later preferred over safety.
- **D4 — Fonts v1 = curated list via `next/font`.** Arbitrary upload
  (`@font-face` from a Sanity asset) is deferred; it loses `next/font`
  optimisation and needs its own FOUT/subsetting handling.
- **D5 — Full neutral repaint (sepia/old-book) is deferred behind author-time
  contrast validation,** not built in v1. It is capability-limited by choice,
  not by the mechanism.
- **D6 — Component adaptation is automatic; the work is a source + injector +
  font wiring + appearance mapping + a lint guard** — confirmed by the
  2026-08-07 audit showing `ui`/`web` are already token-pure.
- **D7 — Portfolio mirrors `post` as a new `project` type + `/work` surface,**
  not a variant of `post`.
- **D8 — Multi-tenant is a decided direction: content via Sanity
  project-per-tenant under one org** — not a shared dataset, not a separate
  account per tenant, and not an own-built CMS (rejected on effort/benefit;
  Payload is the "adopt, don't build" fallback). Tenant staff are isolated by
  project membership; each tenant rides the per-project free tier and upgrades
  to Growth (billed through) on its own needs. Researched 2026-08-07: no
  explicit ToS ban and commercial use is allowed, but a fair-use gray area at
  thousands of projects, free hard-caps with no overage buffer, and per-project
  schema-migration fan-out cap the model at a modest tenant count — verify the
  exact free editor allowance and confirm with Sanity before scaling.
- **D9 — RBAC is split.** Sanity project membership governs content editing; a
  Neon `tenants` + `memberships(userId, tenantId, role)` layer governs
  frontend/engagement roles. Sanity roles never express app-facing tenancy.
- **D10 — Frontend topology and Neon shape are left to the dedicated
  multi-tenant design doc.** The leaning pick — a shared Next.js app resolving
  tenant by domain + shared Neon with `tenantId` — would **reverse the earlier
  no-`tenantId` posture** and add `tenantId` to the M5 engagement tables at
  creation. Not yet settled; do not ticket until that doc lands.

## Non-goals (recorded so epics don't sprawl)

- Arbitrary per-client font upload (D4) — follow-up only.
- Editor-repaintable neutral/background ramp + the contrast-validation engine it
  needs (D5) — follow-up only.
- A leads/CRM management UI (Feature 4) — store + notify only.
- The multi-tenant **implementation** — tenant resolution, frontend topology,
  Neon tenant-scoping, provisioning automation. The direction is decided
  (Feature 6); the build gets its own design doc, so it stays out of _this_
  doc's epics.
- Per-module bespoke visuals beyond what the appearance object + tokens express.

## How this should be ticketed (recommendation)

- **Feature 1 (appearance)** — small multi-layer epic; build first, everything
  else inherits it.
- **Feature 2 (theme-as-content)** — multi-layer epic (config consts → cms
  singleton → service fetcher → web injector + font wiring + lint guard); build
  second.
- **Feature 3 (modules)** — one tracking epic; each module is a single issue
  under it (they inherit Features 1–2 for free).
- **Feature 4 (contact form)** — multi-layer epic; gated on M5 foundations
  (#984/#1091/#1093/#1107).
- **Feature 5 (portfolio)** — multi-layer epic (`config → cms → service → ui →
web`), independent.
- **Feature 6 (multi-tenant)** — not ticketed from this doc. Next step is a
  dedicated multi-tenant design doc + `superpowers:brainstorming` pass covering
  frontend topology, Neon tenant-scoping, provisioning automation, and the
  Sanity-ToS verification; epics come from _that_ doc. Note in `SPEC.md` §15
  that multi-tenant is now an active direction (Sanity project-per-tenant).

**Spec sync when built:** Features 1–3 update `SPEC.md` §6 + `docs/context/
content-model.md`; Feature 2 also updates §9 (rendering) and §4 if the injector
changes the layer picture; Feature 5 updates §1 surfaces; Feature 6 updates
§15. Per repo rules, this design doc is deleted once its features ship and
`SPEC.md` reflects them.
