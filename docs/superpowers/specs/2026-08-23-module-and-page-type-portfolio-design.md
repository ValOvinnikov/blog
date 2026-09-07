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
**Date:** 2026-08-07 (original design), extracted 2026-08-23, resynced
against the shipped codebase 2026-09-06 (see "Resync log" at the end).
**Milestone:** M9 — Portfolio (moved off M7 — Configurability & Multi-tenant
2026-08-23, alongside the epic/sub-issue move).
**Scope:** The page-builder module catalogue, the one write-path module
(contact form), and the portfolio content type + `/work` surface — the three
strands of "grow what the page builder can build," independent of each other
and additive to the flexibility spine (module styling + theme-as-content)
that #1285 already shipped.
**Related / dependencies:**

- **Module type flow** (`packages/config/src/constants/module.ts`) — there is
  **no** hand-maintained `MODULE_TYPE` const. `TModuleType` is **derived**
  from the generated Sanity types (an `Extract<AllSanitySchemaTypes, { _type:
'module_*' }>` template-literal match), so the single source of truth for a
  module's type is the **studio schema's `name:` field**, per `SPEC.md` §6.
  Adding a module threads through a `packages/studio` `module_*` schema →
  `pnpm typegen` (regenerates `TModuleType`) → the relevant pages'
  `defineModulesField({ allow })` → `service.modules.<type>` → web
  `MODULE_MAP`. `MODULE_MAP` is typed
  `Record<Exclude<TModuleType, 'module_hero' | 'module_postList' |
'module_taxonomyList'>, …>`: the three excluded types render through a
  page's dedicated **slot** (`page_home.hero`, `page_blog.postList`,
  `page_topicIndex.taxonomyList`) rather than `modules[]`, and every other
  type fails to compile if left unregistered. A new slot-only module joins
  that `Exclude` list; a new `modules[]` module joins the map.
- **Module styling (shipped)** — the "section appearance object" the
  original design proposed shipped under different names, and every module
  in this doc's catalogue gets them from shared helpers rather than
  per-module work: a required `brandVariant` (`brandVariantField()`, the
  full-bleed band tone), an all-optional `layout` object (`layoutField()` —
  `spacingTop`/`spacingBottom`, `containerWidth`, `dividerTop`/
  `dividerBottom`; `heroLayoutField` is the `containerWidth`-less variant),
  an optional `sectionHeader` (`sectionHeaderField()` — `heading` +
  `supportingText`, with a `requireHeading` override), and a module-level
  `contentAlignment` (`defineAlignmentFields()`). `apps/web`'s `Section`
  component (`apps/web/src/components/shared/section`) — **not** `@blog/ui` —
  renders the band, spacing, dividers and the `<section>` landmark; the
  `@blog/ui` organism is bare content inside it. Full contract: `SPEC.md` §6.
- **Theme-as-content** (shipped, now Postgres-backed via `site_config`) —
  accent/fonts/radius/density are tenant-authored and injected as CSS
  variables; new modules need no theme-specific work, they're already
  token-pure. The 2026-09-06 generic-theme design (#2746) removes the
  `CONSOLE` preset's separate rendering path, so a new organism renders
  **one** structure — never a `chromeOn`/`isPlain` branch.
- **Copy placement** — per `SPEC.md`'s "Curated UI copy lives in Voice, not
  on modules" and the 2026-09-06 design's D4: a module never carries an
  override for copy Voice owns; feature-wide copy for a Sanity-modelled
  feature lives on that feature's `settings_*` singleton (the newsletter's
  form strings on `settings_newsletter` are the precedent); per-instance
  content lives on the module document.
- **`@blog/db` (Neon + Drizzle)** — the engagement persistence layer. The
  contact form module adds a `leads` table here, sibling to `subscribers`.
  `service` stays Sanity-only; `db` is the sibling layer `web` consumes.
  Every tenant-scoped write goes through `apps/web`'s `isTenantActive()`
  predicate (`apps/web/src/server/tenant/`) — a SUSPENDED/ARCHIVED tenant's
  site stays readable while nothing new lands against it.
- **`@blog/email`** — the single home for every email the product sends
  (`sendEmail`, the branded shell, `escapeHtml`). The contact form's
  notification email goes through it; callers pass resolved copy and URLs.
- **Capability gating** — `@blog/config`'s `CAPABILITY` keys, the tenant's
  `settings_features` toggles and `@blog/db`'s `PLAN_REGISTRY` entitlement
  gate every write-path feature (`module_newsletter` is omitted at render
  when `NEWSLETTER` is off). The contact form is the next capability in that
  list.
- **Multi-tenant architecture (shipped)** — every tenant has its own Sanity
  project; `apps/web` routes live under `app/[tenant]/[locale]/`, and every
  engagement table carries `tenantId`. The `leads` table this doc adds
  follows that shape; the tenancy mechanics themselves belong to
  [`2026-08-07-multi-tenant-architecture-design.md`](./2026-08-07-multi-tenant-architecture-design.md)
  and `SPEC.md`.
- **CMS page architecture** — every public page is a CMS document with a
  required slot ([`2026-08-20-cms-page-architecture-design.md`](./2026-08-20-cms-page-architecture-design.md)).
  Its two settled patterns shape the portfolio strand below: a per-entity
  page document owns the route (`page_post` owns `slug` + `publishedAt`; the
  `post` entity has neither), and a listing is **two module types, one per
  mode** — a paginated archive in a required slot (`module_postList`) and a
  latest-N teaser in `modules[]` (`module_postLatest`).

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
module styling and theme for free, already shipped.

## Module catalogue — new page-builder modules

**Goal:** enough module types to compose a full marketing/portfolio landing
page with zero bespoke code. Each is one `module_*` schema threaded through
the four layers below — the established, type-checked pattern.

Catalogue, ordered by portfolio/client value (append new proposals to the
end rather than renumbering):

- `module_projectLatest` — latest-N project / case-study cards, the
  portfolio teaser for the home page and landing pages (a `modules[]`
  member; fetches from the portfolio content type below). Mirrors
  `module_postLatest`.
- `module_projectList` — the paginated project archive occupying
  `page_work`'s required `projectList` slot. Mirrors `module_postList`, is
  excluded from `MODULE_MAP` the same way, and is specced with the portfolio
  strand below rather than here. (The original catalogue had a single
  `module_projectGrid`; the page-architecture programme's two-modules-per-mode
  rule splits it.)
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

**Per module, the same steps** (dependency order `studio → service → ui →
web` — **no config-const step**, since a module's `_type` is derived from its
schema, not declared in `@blog/config`): add the `packages/studio` `module_*`
document schema (`titleField()` + `brandVariantField()` + the module's own
display fields + `sectionHeaderField()`/`defineAlignmentFields()` where the
module has a heading + `layoutField()`) and add it to the relevant pages'
`defineModulesField({ allow })`; run `pnpm typegen` so `TModuleType` picks up
the new `_type`; add `service.modules.<type>.v1` (query + transformer +
view-model + cache tags — plus a `REVALIDATE_TAGS` entry in `apps/web`, which
every module type requires regardless of how it renders); add a pure
`@blog/ui` organism (+ stories + tests); register the web component in
`MODULE_MAP`, wrapped in `apps/web`'s `Section`.

**Migration.** None — new module types and widening `allow` lists are
additive.

**Ticketing.** Each module is small enough to be **one issue** (single-ish
layer chain), _not_ a multi-layer epic — file each under #1919 when work on
it starts, same pattern as any other item added to this catalogue.

## Hero family & the generic home page

**Goal:** the home page stops being blog-shaped. Its required `hero` slot
accepts a _family_ of hero modules — one per kind of site (blog, statement,
profile) — and every other page gains the same slot as an optional field
that replaces its default header, so a tenant can compose a marketing landing
page, a personal profile page, or a blog front page from the same catalogue
with zero bespoke code. This section
is the design of record for the family's infrastructure (epic #2778); each
member hero gets its own design section as it is added (`module_heroBlog`
first, under #2780).

Interactive mock of every decision below:
<https://claude.ai/code/artifact/ad822029-c1e5-42db-953b-5269fb45093d>.

### Membership is a naming convention, enforced by the compiler

A hero is any module whose schema `name:` starts with `module_hero`. Nothing
is registered by hand:

```ts
// @blog/config — constants/module.ts
type THeroModuleType = Extract<TModuleType, `module_hero${string}`>;
type TSlotModuleType =
  THeroModuleType | 'module_postList' | 'module_taxonomyList';
```

`THeroModuleType` is the same template-literal `Extract` that already derives
`TModuleType` from the generated Sanity types, one level down. Today it
resolves to `'module_hero'`; after M9 it is `'module_hero' |
'module_heroBlog' | 'module_heroStatement' | 'module_heroProfile'`, and the
legacy `module_hero` drops out of the union the day its schema is deleted
(the retirement ticket, #2813).

`TSlotModuleType` names every module that renders through a page's dedicated
slot rather than `modules[]`, so `MODULE_MAP` is typed
`Record<Exclude<TModuleType, TSlotModuleType>, …>` instead of listing three
string literals. Both types live in `@blog/config` because studio, service
and web all read them.

Two maps are keyed on the family, and both refuse to compile until a new
`module_hero*` schema is named in them — the same guarantee `MODULE_MAP`
gives `modules[]` modules:

- `apps/web/src/modules/hero-map.ts` — `HERO_MAP: Record<THeroModuleType,
ComponentType<{ id: string }>>`, plus a `HeroSlot({ id, type })` component
  that looks the type up and renders the module. `ModuleRenderer` keeps its
  warn-and-render-nothing fallback for a runtime type the map does not know;
  `HeroSlot` mirrors it, since the page query cannot narrow `_type` at the
  GROQ level.
- `apps/web`'s `REVALIDATE_TAGS` — already `Record<TModuleType | …>`, so it
  needs no new guard; each hero adds its `modules:<kind>` tag entry.

In the studio the equivalent guard is a `HERO_SCHEMA_TYPES` list (the hero
schema objects, exported next to them) used by every page's `to:` list, and a
test asserting that every registered `module_hero*` schema is in it — a hero
added to the schema registry but not to the list fails `pnpm test` rather
than silently being un-pickable.

### Which pages get a hero slot

One rule, no exceptions: **home has a required hero; every other page has an
optional one; a hero always replaces that page's default header and owns the
`<h1>`.**

Every page other than home already opens with a header built from its own
fields — the generic page's breadcrumbs and title, the blog page's authored
`heading` and `supportingText`, the topic and tag pages' term-derived heading
— so without a hero it renders exactly as it does today, and the first
`modules[]` entry can never be the opener because the `<h1>` has a home
either way. Home has no such fallback, which is why its slot is the only
required one.

| Page                           | Hero slot                                                                               | Without a hero                      | `modules[]` allow-list                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `page_home`                    | **Required**, `to:` = `HERO_SCHEMA_TYPES`                                               | —                                   | Widens to every `modules[]` module: `content`, `cta`, `newsletter`, `postLatest` (+ later `postFeatured`, carousel, placeable `taxonomyList`) |
| `page_generic`                 | Optional, same list                                                                     | Breadcrumbs + title header          | Widens from `content` + `cta` to add `postLatest` + `newsletter`                                                                              |
| `page_blog`                    | Optional, same list                                                                     | `heading` + `supportingText` header | Unchanged                                                                                                                                     |
| `page_topic` · `page_tag`      | Optional, same list — one document per term, so a flagship topic can carry its own hero | Term header                         | Unchanged                                                                                                                                     |
| `page_work` (portfolio strand) | Optional, when that page lands                                                          | Its own header                      | Designed with the work page                                                                                                                   |

A hero's copy is always authored on the hero. A taxonomy-page hero that
derives its heading from the term, the way `module_heroBlog` derives from a
post, is a later add, not part of this phase. The document's `title` still
feeds breadcrumbs, metadata and the Studio preview whether or not a hero is
set, exactly as `page_home.title` does today.

### The shared field tail — `defineHeroFields()`

Every hero kind is _content fields first, shared tail last_. The tail is
emitted by one studio helper so an editor who has configured one hero already
knows the next, and so the web view for every kind maps the same props onto
the same `@blog/ui` organism:

| Field                   | Type                                      | Notes                                                                                |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `variant`               | `HERO_VARIANT` radio, required            | `SPLIT` (default) · `STACKED` · `BANNER` — the CTA module's three shapes, same names |
| `brandVariant`          | `brandVariantField({ list: FULL })`       | Band tone; on `BANNER` the overlay tint over the image, as on the CTA banner         |
| `image`                 | `imageWithAlt`                            | Required on `SPLIT` and `BANNER`, optional (below the copy) on `STACKED`             |
| `contentPositionSplit`  | `LEFT` · `RIGHT`, hidden unless Split     | via `defineAlignmentFields()`                                                        |
| `contentPositionBanner` | `LEFT` · `CENTER` · `RIGHT`, Banner only  | via `defineAlignmentFields()`                                                        |
| `contentAlignment`      | `LEFT` · `CENTER` · `RIGHT`               | the baseline field `defineAlignmentFields()` always emits                            |
| `mobileMediaOrder`      | `MOBILE_MEDIA_ORDER`, hidden unless Split | `LAST` (default) · `FIRST`                                                           |
| `actions`               | `actionGroupField()`                      | up to two links, rendered by `apps/web`'s `ActionGroup`                              |
| `layout`                | `heroLayoutField`                         | spacing + dividers, no container width                                               |

`defineHeroFields()` takes two options: `variants` (a subset of
`HERO_VARIANT`, for a kind that cannot sensibly be a banner) and `image:
false`, for a kind that supplies its own image field — `module_heroBlog`'s
image is a mode pair (post image / custom / none), so it omits the shared
`image` and emits its pair in the same position. A kind's own content fields
(post reference and mode pairs for Blog; eyebrow, heading and supporting text
for Statement; name, role, bio, avatar and social links for Profile) are
that kind's own design decision, made in its own section.

Two constants move to `@blog/config` with this: `HERO_VARIANT = { SPLIT,
STACKED, BANNER }`, and `MOBILE_MEDIA_ORDER = { LAST, FIRST }`, which
**replaces** `CTA_MOBILE_MEDIA_ORDER` (same values, same stored strings, so
no content migration — the CTA schema, service and UI consumers rename in the
same PR).

`defineHeroFields()` lands with its first consumer, `module_heroBlog`, not in
Phase 0 — a helper with no caller fails `knip`, and `module_hero` is not
retrofitted because it is being retired.

### The `@blog/ui` organism

One `Hero` organism serves every kind. It gains the props `CtaModule`
already has for the same fields — `variant`, `tone`, `contentPosition`,
`contentAlignment`, `mobileMediaOrder` — and keeps its compound slots
(`Hero.Media`, `Hero.Cta`) plus a new `Hero.Aside` slot for kind-specific
chrome such as the Profile avatar. DOM order is always copy before media;
position and mobile order only move things visually, so the `<h1>` stays
first for assistive tech. That change is the `ui` sub-issue of the first
hero that needs it (#2807, under `module_heroBlog`); Phase 0 has no `ui`
work.

### Service

`TModule` becomes generic over its type — `TModule<T extends TModuleType =
TModuleType> = { id: string; type: T }` — and the page view models narrow the
slot: `THomePage.hero: TModule<THeroModuleType>`, and the generic, blog,
topic and tag page view models gain `hero?: TModule<THeroModuleType>`. The
page queries already project `_id` and `_type` for a slot; a `toHeroSlot()` transformer applies an `isHeroModuleType()`
guard from `@blog/config` (a `startsWith('module_hero')` check typed as a
predicate) and a slot that fails it is a data error the loader returns
through its existing failure path, never a silently blank page. Each hero
kind keeps its own loader (`getHero(id)` today, `getHeroBlog(id)` next), so
the slot stays two-step — page, then hero by id — as it is now.

### Validation: the blank-heading rule generalises

`validateSinglePostLatestWithoutHeading` exists because two
`module_postLatest` instances on one page both fall back to the same
"Latest posts" heading — duplicate landmark names. The widened allow-lists
make that reachable on `page_generic` too, and the next modules
(`module_postFeatured`, the carousel display mode) carry fallback headings
of their own. It becomes `validateSingleBlankHeadingPerType(types)`, a helper
that takes the list of module types with a heading fallback and enforces "at
most one blank-heading instance per type per page", applied to `page_home`
and `page_generic` in Phase 0 with `[module_postLatest]`, and extended by
each later module that gains a fallback heading.

### Migration

None. Every change is additive: new optional fields, widened `to:` and
`allow` lists, a renamed const whose stored values do not change.
`module_hero` documents keep working until #2813 migrates each tenant's
home page onto `module_heroBlog` and deletes the schema.

### Phase 0 scope, per layer

- **config** — `THeroModuleType`, `TSlotModuleType`, `isHeroModuleType()`,
  `HERO_VARIANT`, `MOBILE_MEDIA_ORDER` (renaming `CTA_MOBILE_MEDIA_ORDER`'s
  consumers).
- **studio** — `HERO_SCHEMA_TYPES` + its registry test; `page_home.hero`
  references the list; `page_generic`, `page_blog`, `page_topic` and
  `page_tag` gain an optional `hero` referencing it; the home and generic
  allow-lists widen; the generalised blank-heading validator. No
  `defineHeroFields()` yet.
- **service** — generic `TModule<T>`, `toHeroSlot()`, `hero?` on the
  generic, blog, topic and tag page view models.
- **ui** — none.
- **web** — `HERO_MAP` + `HeroSlot`; `MODULE_MAP` excludes via
  `TSlotModuleType`; the generic, blog, topic and tag page views render the
  optional hero in place of their default header.

**Acceptance:** `page_home.hero` and every other page's optional `hero`
accept the family; adding a `module_hero*` schema without a `HERO_MAP` entry
or a `HERO_SCHEMA_TYPES` entry fails `type-check`/`test`; every existing
page renders unchanged while no hero is set on it and `module_hero` is the
family's only member.

## Contact form / lead capture

**Goal:** the module clients most want — and the only one in the catalogue
with a write path. Deliberately assembles pieces the M5 engagement phase
already built, and mirrors `module_newsletter` — the shipped write-path
module — wherever the two overlap.

**Composition (mostly reuse):**

- **db** — a new `leads` table in `@blog/db` (`tenantId`, name, email,
  message, sourcePage, createdAt; sibling to `subscribers`). New table →
  `db:generate` schema migration, dev-free / prod-gated per `SPEC.md` §8.
- **config** — a new `CAPABILITY` key so the tenant can switch the form off
  and the plan can entitle it; `settings_features` gains the matching
  column (a `@blog/db` schema migration) and `PLAN_REGISTRY` the matching
  entry.
- **ui** — a `ContactForm` organism built on the existing `TextInput` /
  `Textarea` atoms, states bound to the status tokens (`--ok/--warn/
--danger`).
- **web** — a client-island form + server action writing via `@blog/db`
  behind `isTenantActive()`, plus a notification email through
  `@blog/email`'s `sendEmail`. Spam mitigation (honeypot / rate-limiting)
  applied here. Rendered through `MODULE_MAP` and omitted silently when the
  capability is off, exactly like `module_newsletter`.
- **studio** — the `module_contactForm` document (heading, intro, which
  fields to show) placeable in the page builder like any module, plus a
  `settings_contact` singleton for the feature-wide copy — recipient address,
  success/error/consent strings — per the copy-placement rule above. Voice
  owns none of it.

**Dependencies:** all landed — `@blog/db` (#984), the `TextInput`/`Textarea`
atoms (#1091), the status tokens (#1093), Auth.js (#1107) and the
`@blog/email` transport (2026-09-03). Nothing gates a start.

**Open decisions (settle in the ticket before dispatch):**

- Plan entitlement: `FREE` or `GROWTH`-only? The newsletter is `GROWTH`-only
  and default-off; lead capture is the module clients most want, which
  argues for `FREE`.
- Where a tenant reads their leads before a CRM UI exists: the notification
  email only, or a read-only list in `apps/platform`?

**Non-goal:** a CRM / inbox UI for leads — v1 stores rows and emails a
notification; managing them is a later concern (mirrors the newsletter
"signup only, no campaign UI" boundary).

## Portfolio content type

**Goal:** turn "a blog" into "a portfolio site that also blogs" by mirroring
the proven `post` pattern rather than bolting portfolio onto posts.

**Content model.** A new `project` (or `caseStudy`) entity document: title,
client, role, stack (tags), year, `outcomeMetrics` (repeatable label+value),
`heroImage`, `gallery`, `body` (richText), `featured`. Reuses the existing
`topic` / `tag` taxonomy and `imageWithAlt`. It carries **no `slug` and no
`publishedAt`** — those belong to its page document, below, exactly as
`post` no longer carries them since `page_post`.

**Page documents.** The page-architecture programme settled what the
original design left open ("whether `/work/{slug}` is a page document or a
plain entity route"): every public page is a CMS document.

| Document       | Kind       | Required slot | Also                         | Route                   |
| -------------- | ---------- | ------------- | ---------------------------- | ----------------------- |
| `page_work`    | singleton  | `projectList` | `modules[]`, `seo`           | `/work`, `/work/page/N` |
| `page_project` | per-entity | `project` ref | `slug`, `publishedAt`, `seo` | `/work/{slug}`          |

`page_project` mirrors `page_post` field-for-field: it owns `slug` (with the
shared slug-URL preview input, prefix `/work/`) and `publishedAt`, and is
one-to-one with its `project` via the same uniqueness validation. `page_work`
mirrors `page_blog`: its `projectList` slot holds a `module_projectList`
(`pageSize`; the route supplies the page number).

**Surfaces.** Routes under `app/[tenant]/[locale]/`: `/work` (+
`/work/page/N`) and `/work/[slug]`, cloning the blog-index / post-detail
composition, sitemap entries (+ optional RSS), and JSON-LD (`CreativeWork`).
Add `work` to `RESERVED_SLUGS` so the generic `/[slug]` route doesn't
collide. (That const still lists the retired `category`/`tag`/`author`
prefixes — prune them in the same change or a separate cleanup, but don't
copy the pattern.)

**Studio desk.** #1907 (shipped) regrouped the desk by domain so this strand
has somewhere to land: `/work` gets its own `Work` section as a peer of
`Blog`, not entries under the top-level `Pages` list (which stays for
genuinely site-level pages only):

```
Content
├─ Pages          Home Page, Landing Page
├─ Blog           Blog Page, Topics, Tags, Posts, Authors, Settings
├─ Work           ← this section
│  ├─ Work Page       the /work index (page_work)
│  ├─ Project Pages   page_project documents
│  └─ Projects        the project / caseStudy entities
├─ Modules
└─ Settings
```

**Service / UI / Web.** A `service.pages.work.*` slice plus
`service.modules.projectList` / `projectLatest`; reuse `PostsSection` /
`PostCard` where shapes align (or a thin `ProjectCard` variant); web routes,
plus `generateMetadata` per `seo-and-metadata`.

**Migration.** None — new document types, new module types and new routes
are additive. Existing posts are untouched.

**Ticketing.** Multi-layer feature → epic + per-layer sub-issues
(`config → studio → service → ui → web`), like reading-depth (#957).

## How this composes — layer flow

```
config  →  RESERVED_SLUGS + a CAPABILITY key; no module-type const — a module's _type derives from its studio schema via typegen
studio  →  module_* schemas (shared styling helpers) + project entity + page_work / page_project
service →  service.modules.<type>.v1   service.pages.work.*
db      →  leads table (tenantId) + settings_features column
email   →  lead-notification template via sendEmail
ui      →  new module organisms + ContactForm (all pure, token-only)
web     →  MODULE_MAP entries, slot renderers, /work routes, server action behind isTenantActive()
```

`@blog/ui` never imports `service`/`db`/`sanity`; `web` is the only meeting
point; the graph stays acyclic.

## Decision log

- **New modules inherit module styling + theme for free** — both already
  shipped as shared helpers/an injector, so no per-module styling work is
  needed beyond choosing which tokens a module's own content (not its
  section chrome) uses.
- **Portfolio mirrors `post` as a new `project` entity + `page_project` /
  `page_work` pages + `/work` surface,** not a variant of `post` (carried
  from the original Feature 5 decision D7; page documents added 2026-09-06
  per the page-architecture programme).
- **Project listing is two modules, one per mode** — `module_projectList`
  (slot, paginated) and `module_projectLatest` (`modules[]`, teaser) —
  replacing the single `module_projectGrid` (2026-09-06).
- **Contact form is store + notify only, v1** — no CRM/inbox UI, mirrors the
  newsletter boundary — and is a tenant-toggleable, plan-entitled
  capability like the newsletter (2026-09-06).
- **The hero is a family, not one generalised module** — membership is the
  `module_hero*` naming convention, derived into `THeroModuleType`; one
  `defineHeroFields()` tail (variant, brand variant, image, position,
  alignment, mobile media order, actions, layout) shared by every kind;
  `page_home.hero` required, every other page's `hero` optional and
  replacing that page's default header when set; `module_hero`
  retired by content migration once `module_heroBlog` replaces it
  (2026-09-07, #2791).

## Non-goals (recorded so #1919 doesn't sprawl)

- A leads/CRM management UI — store + notify only.
- Per-module bespoke visuals beyond what the shared styling helpers + tokens
  express.
- Multi-tenant tenancy mechanics — the `leads` table's `tenantId` and every
  other tenancy concern belongs to
  [`2026-08-07-multi-tenant-architecture-design.md`](./2026-08-07-multi-tenant-architecture-design.md)
  and `SPEC.md`, not this doc.

## How this is ticketed

- **Module catalogue** — one tracking epic (#1919 itself, or a dedicated
  sub-epic if the catalogue outgrows a flat issue list); each module is a
  single issue under it.
- **Hero family & generic home page** — epic #2778 under `M9 — Portfolio`
  (design #2791, then `config → studio → service → web`); each member hero
  is its own epic with a design sub-issue first (`module_heroBlog` #2780).
- **Contact form** — multi-layer epic under #1919; no longer gated.
- **Portfolio** — multi-layer epic under #1919 (`config → studio → service
→ ui → web`), independent.

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

## Resync log

- **2026-09-07** — added the "Hero family & the generic home page" design
  section (#2791): derived `THeroModuleType`/`TSlotModuleType`, the hero slot
  per page, the shared `defineHeroFields()` tail, the generalised
  blank-heading validator and Phase 0's per-layer scope.
- **2026-09-06** — brought back in line with what shipped between
  2026-08-23 and today: the `cms` layer is `packages/studio` (`@blog/studio`);
  the "appearance object" shipped as `brandVariant`/`layout`/
  `sectionHeader`/`contentAlignment` helpers rendered by `apps/web`'s
  `Section`; `MODULE_MAP` excludes three slot types, not one; the M5
  dependencies all landed and the email transport is `@blog/email` (#1107
  was the Auth.js issue, not a Resend helper); tenant writes go through
  `isTenantActive()`; write-path modules are capability-gated; #1907's desk
  regroup shipped; the page-architecture programme settled `page_project`
  / `page_work` and the two-modules-per-mode split; feature copy follows
  the 2026-09-06 D4 placement rule.
