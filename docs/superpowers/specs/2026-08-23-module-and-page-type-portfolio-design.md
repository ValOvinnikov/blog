# Module & Page-Type Portfolio — Design

**Status:** Living design doc for epic #1919 (`feat: module & page-type
portfolio`). Extracted 2026-08-23 from
[`2026-08-07-flexible-theming-and-page-builder-design.md`](./2026-08-07-flexible-theming-and-page-builder-design.md)'s
Features 3–5, which specced this work as three fixed phases of the #1285
configurability/multi-tenant program. That program is a closed set of
rollout phases meant to finish; growing the page-builder module catalogue and
adding new CMS content types is open-ended and keeps expanding past any one
phase — so it now has its own epic (#1919) and its own doc that grows with
it, instead of hanging off a program that's meant to close. #1290
(module catalogue), #1291 (portfolio content type), #1292 (contact form
module) moved from #1285 to #1919 on the same date; this doc is their spec of
record going forward, not the phase numbers in the old rollout plan.
**Date:** 2026-08-07 (original design), extracted 2026-08-23.
**Milestone:** M9 — Portfolio (moved off M7 — Configurability & Multi-tenant
2026-08-23, alongside the epic/sub-issue move).
**Scope:** The page-builder module catalogue, the one write-path module
(contact form), and the portfolio content type + `/work` surface — the three
strands of "grow what the page builder can build," independent of each other
and additive to the flexibility spine (appearance + theme-as-content) that
#1285 already shipped.
**Related / dependencies:**

- **Module type flow** (`packages/config/src/constants/module.ts`) — there is
  **no** hand-maintained `MODULE_TYPE` const. `TModuleType` is **derived**
  from the generated Sanity types (an `Extract<AllSanitySchemaTypes, { _type:
'module_*' }>` template-literal match), so the single source of truth for a
  module's type is the **cms schema's `name:` field**, per `SPEC.md` §6.
  Adding a module threads through cms `module_*` schema → `pnpm typegen`
  (regenerates `TModuleType`) → the relevant pages' `defineModulesField({
allow })` → `service.modules.<type>` → web `MODULE_MAP` (a
  `Record<Exclude<TModuleType, 'module_hero'>, …>` that fails to compile if a
  type is left unregistered).
- **Section appearance object** (shipped) — every module document carries an
  optional `appearance` field (background/spacing/container width/align/
  divider) via the `withAppearance()` helper, rendered by `@blog/ui`'s
  `Section` wrapper. Every module in this doc's catalogue inherits it for
  free — no per-module appearance work needed.
- **Theme-as-content** (shipped) — accent/fonts/radius/density are
  CMS-authored and injected as CSS variables; new modules need no
  theme-specific work either, they're already token-pure.
- **`@blog/db` (Neon + Drizzle)** — the engagement persistence layer. The
  contact form module adds a `leads` table here, sibling to `subscribers`.
  `service` stays Sanity-only; `db` is the sibling layer `web` consumes.
- **M5 engagement foundations** (`docs/BACKLOG.md`) — the contact form module
  reuses the `TextInput`/`Textarea` atoms (#1091), status tokens (#1093,
  `--ok/--warn/--danger`), and the shared Resend send-email helper (#1107).
- **Multi-tenant architecture** — the `leads` table this doc adds is one of
  the engagement tables that gains `tenantId` per
  [`2026-08-07-multi-tenant-architecture-design.md`](./2026-08-07-multi-tenant-architecture-design.md)
  §3. That doc owns the tenancy shape; this doc just adds the table.

## Purpose of this doc

Three related but independent strands of "make the page builder build more":

1. **New page-builder modules** — the module catalogue that makes full
   marketing/portfolio pages buildable without code. Open-ended — new modules
   get proposed and added to the catalogue below over time; this section is
   never "done."
2. **Contact form / lead capture** — the one module needing a write path.
3. **Portfolio content type** — `project`/`caseStudy` as a first-class
   document with its own surface.

Each is independent of the others and of the flexibility spine — they inherit
appearance/theme for free, already shipped.

## Module catalogue — new page-builder modules

**Goal:** enough module types to compose a full marketing/portfolio landing
page with zero bespoke code. Each is one `MODULE_TYPE` entry threaded through
all five layers — the established, type-checked pattern.

Catalogue, ordered by portfolio/client value (append new proposals to the
end rather than renumbering):

- `module_projectGrid` — project / case-study cards (the portfolio showcase;
  fetches from the portfolio content type below).
- `module_gallery` — image/media grid with lightbox.
- `module_featureGrid` — icon + title + text grid (services / skills).
- `module_testimonial` — quote + attribution.
- `module_logoWall` — client / tech logos.
- `module_stats` — metric figures ("40% faster", "3M users").
- `module_faq` — accordion (interactive; the disclosure lives in a `web`
  client leaf per `web-component-practices`, the organism stays pure).
- `module_embed` — video / oEmbed (YouTube, Loom, CodePen).
- `module_contactForm` — see below (has a write path; specced separately).
- Second wave: `module_pricing`, `module_timeline`.

**Per module, the same steps** (dependency order `cms → service → ui → web` —
**no config-const step**, since a module's `_type` is derived from its
schema, not declared in `@blog/config`): add the cms `module_*` document
schema (`titleField` + display fields + the shipped `appearance` object) and
add it to the relevant pages' `defineModulesField({ allow })`; run `pnpm
typegen` so `TModuleType` picks up the new `_type`; add
`service.modules.<type>.v1` (query + transformer + view-model + cache tags);
add a pure `@blog/ui` organism (+ stories + tests); register the web
component in `MODULE_MAP` (the `Record<Exclude<TModuleType, 'module_hero'>,
…>` makes a missing registration a compile error).

**Migration.** None — new module types and widening `allow` lists are
additive.

**Ticketing.** Each module is small enough to be **one issue** (single-ish
layer chain), _not_ a multi-layer epic — file each under #1919 when work on
it starts, same pattern as any other item added to this catalogue.

## Contact form / lead capture

**Goal:** the module clients most want — and the only one in the catalogue
with a write path. Deliberately assembles pieces the M5 engagement phase
already built.

**Composition (mostly reuse):**

- **db** — a new `leads` table in `@blog/db` (name, email, message,
  sourcePage, createdAt; sibling to `subscribers`). New table →
  `drizzle-kit generate` schema migration, dev-free / prod-gated per
  `SPEC.md` §8. Gains `tenantId` per the multi-tenant spec, §3.
- **ui** — a `ContactForm` organism built on the existing `TextInput` /
  `Textarea` atoms (#1091), states bound to status tokens (#1093).
- **web** — a client-island form + server action writing via `@blog/db`, plus
  a notification email through the shared Resend helper (#1107). Spam
  mitigation (honeypot / rate-limiting) applied here.
- **cms** — the `module_contactForm` document (heading, intro,
  recipient/label config), placeable in the page builder like any module.

**Depends on:** #984 (db), #1091 (atoms), #1093 (tokens), #1107 (Resend). Do
not start before those land.

**Non-goal:** a CRM / inbox UI for leads — v1 stores rows and emails a
notification; managing them is a later concern (mirrors the newsletter
"signup only, no campaign UI" boundary).

## Portfolio content type

**Goal:** turn "a blog" into "a portfolio site that also blogs" by mirroring
the proven `post` pattern rather than bolting portfolio onto posts.

**Content model.** A new `project` (or `caseStudy`) document: title, slug,
client, role, stack (tags), year, `outcomeMetrics` (repeatable label+value),
`heroImage`, `gallery`, `body` (richText), `seo`, `featured`. Reuses the
existing `category` / `tag` taxonomy, the `seo` object + fallback ladder, and
`imageWithAlt`.

**Surfaces.** New routes `/work` (+ `/work/page/N`) and `/work/[slug]`,
cloning the blog-index / post-detail composition, feeds (sitemap + optional
RSS), and JSON-LD (`CreativeWork`). Add `work` and `work/*` to
`RESERVED_SLUGS` so the generic `/[slug]` route doesn't collide.

**Studio desk.** Per #1907's by-domain regrouping, `/work` gets its own
`Work` section as a peer of `Blog`, not entries under the top-level `Pages`
list (which stays for genuinely site-level pages only):

```
Content
├─ Pages          Home Page, Landing Page
├─ Blog           Blog Page, Topics, Tags, Posts, Authors, Settings
├─ Work           ← this section
│  ├─ Work Page       the /work index
│  ├─ Project Pages   per-project page documents, if this adopts the
│  │                  page-document pattern from the page-architecture
│  │                  programme
│  └─ Projects        the project / caseStudy entities
├─ Modules
└─ Settings
```

Whether `/work/{slug}` is a page document or a plain entity route is this
strand's own call — the desk grouping holds either way.

**Service / UI / Web.** A `service.pages.work.*` slice; reuse `PostsSection`
/ `PostCard` where shapes align (or a thin `ProjectCard` variant); web routes,
plus `generateMetadata` per `seo-and-metadata`.

**Migration.** None — new document type and new routes are additive.
Existing posts are untouched.

**Ticketing.** Multi-layer feature → epic + per-layer sub-issues
(`config → cms → service → ui → web`), like reading-depth (#957).

## How this composes — layer flow

```
config  →  no module-type const — a module's _type derives from its cms schema via typegen
cms     →  module_* schemas (inherit shipped appearance object) + project type
service →  service.modules.<type>.v1   service.pages.work.*
db      →  leads table (+ tenantId per the multi-tenant spec)
ui      →  new module organisms + ContactForm (all pure, token-only)
web     →  MODULE_MAP entries + /work routes
```

`@blog/ui` never imports `service`/`db`/`sanity`; `web` is the only meeting
point; the graph stays acyclic.

## Decision log

- **New modules inherit appearance + theme for free** — both already shipped
  as a shared object/injector, so no per-module styling work is needed beyond
  choosing which tokens a module's own content (not its section chrome) uses.
- **Portfolio mirrors `post` as a new `project` type + `/work` surface,** not
  a variant of `post` (carried from the original Feature 5 decision D7).
- **Contact form is store + notify only, v1** — no CRM/inbox UI, mirrors the
  newsletter boundary.

## Non-goals (recorded so #1919 doesn't sprawl)

- A leads/CRM management UI — store + notify only.
- Per-module bespoke visuals beyond what the appearance object + tokens
  express.
- Multi-tenant tenancy mechanics — the `leads` table's `tenantId` and every
  other tenancy concern belongs to
  [`2026-08-07-multi-tenant-architecture-design.md`](./2026-08-07-multi-tenant-architecture-design.md),
  not this doc.

## How this is ticketed

- **Module catalogue** — one tracking epic (#1919 itself, or a dedicated
  sub-epic if the catalogue outgrows a flat issue list); each module is a
  single issue under it.
- **Contact form** — multi-layer epic under #1919; gated on M5 foundations
  (#984/#1091/#1093/#1107).
- **Portfolio** — multi-layer epic under #1919 (`config → cms → service → ui
→ web`), independent.

**Spec sync when built:** each strand updates `SPEC.md` §6 +
`docs/context/content-model.md` as it ships; portfolio also updates §1
surfaces. Unlike a closed-program spec, **this doc is not deleted when a
strand ships** — it stays live as #1919's catalogue reference and gets new
entries appended as new modules/page types are proposed. Only delete a
strand's section here if the catalogue item itself is later dropped, not when
it ships (ship it, then update the entry to note "shipped" and keep it as
the durable per-module record — or move shipped detail into `SPEC.md` if it
gets repetitive; use judgement per repo doc-retention norms once the
catalogue has enough shipped history to matter).
