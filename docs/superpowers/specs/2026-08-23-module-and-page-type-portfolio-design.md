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
  `Record<Exclude<TModuleType, TSlotModuleType>, …>`: the excluded types
  render through a page's dedicated **slot** (a page's `hero`,
  `page_blog.postList`, `page_topicIndex.taxonomyList`) rather than
  `modules[]`, and every other type fails to compile if left unregistered. A
  new slot-only module joins `TSlotModuleType`; a new `modules[]` module
  joins the map. The hero family needs neither: `TSlotModuleType` already
  absorbs every `module_hero*` type through `THeroModuleType`, and a hero's
  own component is registered in `HERO_MAP` instead.
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

`TSlotModuleType` names every module that renders _only_ through a page's
dedicated slot, never `modules[]`, so `MODULE_MAP` is typed
`Record<Exclude<TModuleType, TSlotModuleType>, …>` instead of listing three
string literals. Both types live in `@blog/config` because studio, service
and web all read them. `module_taxonomyList` is a member until Phase 1.5
makes it render both ways, at which point it leaves the union and takes its
`MODULE_MAP` entry (see "The placeable taxonomy list" below).

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
| `page_landing`                 | Optional, same list                                                                     | Breadcrumbs + title header          | Widens from `content` + `cta` to add `postLatest` + `newsletter`                                                                              |
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

| Field                   | Type                                     | Notes                                                                                |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `variant`               | `HERO_VARIANT` radio, required           | `SPLIT` (default) · `STACKED` · `BANNER` — the CTA module's three shapes, same names |
| `brandVariant`          | `brandVariantField({ list: FULL })`      | Band tone; on `BANNER` the overlay tint over the image, as on the CTA banner         |
| `image`                 | `imageWithAlt`                           | Required on `SPLIT` and `BANNER`, optional (below the copy) on `STACKED`             |
| `contentPositionSplit`  | `LEFT` · `RIGHT`, hidden unless Split    | via `defineAlignmentFields()`                                                        |
| `contentPositionBanner` | `LEFT` · `CENTER` · `RIGHT`, Banner only | via `defineAlignmentFields()`                                                        |
| `contentAlignment`      | `LEFT` · `CENTER` · `RIGHT`              | the baseline field `defineAlignmentFields()` always emits                            |
| `mediaOrderSplit`       | `MEDIA_ORDER`, hidden unless Split       | `LAST` (default) · `FIRST` — order once the two columns collapse on mobile           |
| `mediaOrderStacked`     | `MEDIA_ORDER`, hidden unless Stacked     | `LAST` (default) · `FIRST` — order at every width; Stacked is one column throughout  |
| `actions`               | `actionGroupField()`                     | up to two links, rendered by `apps/web`'s `ActionGroup`                              |
| `layout`                | `heroLayoutField`                        | spacing + dividers, no container width                                               |

**Why media order is two fields, not one.** They mean different things: on
Split the layout is two columns and the field only decides what happens once
they collapse, while Stacked is a single column at every width, so its field
is the layout itself. A Sanity field's description and option list are fixed
per named type, so one field cannot say both — the same constraint that makes
`contentPositionSplit`/`contentPositionBanner` two fields. Both collapse to a
single `mediaOrder` value in the service view model, so the `@blog/ui`
organism still takes one prop. Banner emits neither: its image is the
background, not a sibling block. Reordering is visual only — the DOM keeps the
copy before the media at every width, so the `<h1>` stays first for assistive
tech and search.

`defineHeroFields()` takes two options: `variants` (a subset of
`HERO_VARIANT`, for a kind that cannot sensibly be a banner) and `image:
false`, for a kind that supplies its own image field — `module_heroBlog`
chooses its image with an `imageSource` radio, so it omits the shared `image`
and emits its own pair in the same position. A kind's own content fields
(post reference and copy overrides for Blog; eyebrow, heading and supporting
text for Statement; name, role, bio, avatar and social links for Profile) are
that kind's own design decision, made in its own section.

Two constants back this tail, and they land in different phases because
`@blog/config` has no `knip` exemption — an exported const with no importer
fails that gate:

- `MEDIA_ORDER = { LAST, FIRST }` lands in **Phase 0**, because it is a
  **rename** of `CTA_MOBILE_MEDIA_ORDER` and keeps that const's existing CTA
  consumers (same values, same stored strings, so no content migration; the
  CTA schema, service and UI consumers rename in the same PR). It is
  `MEDIA_ORDER`, not `MOBILE_MEDIA_ORDER`, because Stacked's field applies at
  every width.
- `HERO_VARIANT = { SPLIT, STACKED, BANNER }` lands **with
  `defineHeroFields()`**, in `module_heroBlog` — it is genuinely new and has
  no consumer before the helper exists.

`defineHeroFields()` lands with its first consumer, `module_heroBlog`, not in
Phase 0 — a helper with no caller fails `knip`, and `module_hero` is not
retrofitted because it is being retired.

### The `@blog/ui` organism

One `Hero` organism serves every kind. It gains the props `CtaModule`
already has for the same fields — `variant`, `tone`, `contentPosition`,
`contentAlignment`, `mediaOrder` — and keeps its compound slots
(`Hero.Media`, `Hero.Cta`) plus a new `Hero.Aside` slot for kind-specific
chrome such as the Profile avatar. `mediaOrder` is one prop: the service
collapses the two variant-scoped Studio fields into it. DOM order is always
copy before media; position and media order only move things visually, so the
`<h1>` stays first for assistive tech. That change is the `ui` sub-issue of the first
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
make that reachable on `page_landing` too, and the next modules
(`module_postFeatured`, the carousel display mode) carry fallback headings
of their own. It becomes `validateSingleBlankHeadingPerType(types)`, a helper
that takes the list of module types with a heading fallback and enforces "at
most one blank-heading instance per type per page", applied to `page_home`
and `page_landing` in Phase 0 with `[module_postLatest]`, and extended by
each later module that gains a fallback heading.

### Migration

None. Every change is additive: new optional fields, widened `to:` and
`allow` lists, a renamed const whose stored values do not change.
`module_hero` documents keep working until #2813 migrates each tenant's
home page onto `module_heroBlog` and deletes the schema.

### Phase 0 scope, per layer

- **config** — `THeroModuleType`, `TSlotModuleType`, `isHeroModuleType()`,
  and `MEDIA_ORDER` (renaming `CTA_MOBILE_MEDIA_ORDER` and its consumers).
  **Not `HERO_VARIANT`:** nothing consumes it until `defineHeroFields()`
  lands, and `@blog/config` has no `knip` exemption, so an export with no
  importer fails that gate. It ships with the helper, in `module_heroBlog`.
- **studio** — `HERO_SCHEMA_TYPES` + its registry test; `page_home.hero`
  references the list; `page_landing`, `page_blog`, `page_topic` and
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

## `module_heroBlog` — the featured-post hero, rebuilt

**Goal:** the blog member of the hero family, replacing `module_hero` in
function without replacing it in the dataset. It ships beside the old type
with **no migration**; the old one keeps rendering until every production
tenant's page points at a `module_heroBlog`, and a separate chore then
removes it (#2813). Design of record for epic #2780, settled in #2802.

Interactive mock of the Studio form, the rendered hero, the resolved view
model and every validation state:
<https://claude.ai/code/artifact/108d408d-0a5b-4564-a272-20193e4a2c2c>.

### What it fixes

| Today on `module_hero`                         | Rebuilt                              | Why                                                                                     |
| ---------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| `heroEyebrowMode` + `heroEyebrow`              | `eyebrow`                            | Two fields and a radio to express "use the post's topic", which is the default anyway   |
| `heroTitleMode` + `heroTitle`                  | `heading`                            | Same. `title` is unavailable: `titleField()` owns it as the module's editor-facing name |
| `heroSubtitleMode` + `heroSubtitle`            | `supportingText`                     | Same, and the name now matches every other module                                       |
| `heroImageMode` + `heroImage`                  | `imageSource` + `image`              | Kept as a mode: three real states, and "no image" is not expressible as an empty field  |
| `featuredPost`, empty meaning "use the newest" | `postSource` + `post`                | The fallback becomes a choice an editor makes, not a blank field they have to be taught |
| warning "choose a featured post"               | error when nothing resolves          | A hero with no post has no CTA and no heading. That is broken, not merely risky         |
| `secondaryAction: link`                        | `secondaryAction: ctaAction`         | Gains variant and appearance, so the pair can be a filled button beside a text link     |
| `primaryActionLabel` alone                     | `primaryActionLabel` + `…Appearance` | The href stays derived from the post; only the styling is new                           |
| no position/alignment/order controls           | the `defineHeroFields()` tail        | Shared with every other hero kind, and it ships here as its first consumer              |

### Fields

Content fields first, then the shared tail:

| Field                     | Type                                            | Notes                                                                       |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `title`                   | `titleField()`                                  | Editor-facing name, never rendered                                          |
| `postSource`              | `HERO_POST_SOURCE` radio, required              | `PINNED` (default) · `NEWEST_FEATURED`                                      |
| `post`                    | reference → `blog_post`, hidden unless `PINNED` | Required when pinned                                                        |
| `eyebrow`                 | string, max 40                                  | Empty renders the resolved post's topic title                               |
| `heading`                 | string, max 120                                 | Empty renders the resolved post's title                                     |
| `supportingText`          | text, 3 rows                                    | Empty renders the resolved post's excerpt                                   |
| `imageSource`             | `HERO_IMAGE_SOURCE` radio, required             | `POST` (default) · `CUSTOM` · `NONE`                                        |
| `image`                   | `imageWithAlt`, hidden unless `CUSTOM`          | Required when the source is custom                                          |
| `primaryActionLabel`      | string, max 40                                  | Empty renders "Read more". Href is always the resolved post                 |
| `primaryActionAppearance` | `CTA_ACTION_APPEARANCE` radio                   | `CONTAINED` (default) · `INLINE`                                            |
| `secondaryAction`         | `ctaAction`                                     | Optional, fully authored. Validation requires its variant to be `SECONDARY` |
| _shared tail_             | `defineHeroFields({ image: false })`            | variant, brand variant, content position, alignment, media order, layout    |

**The three copy fields are plain optional strings, not mode pairs.** Unset
means "the post's own value", and the Studio placeholder shows what that
value currently is, so the derivation is visible without a second control. A
mode pair buys nothing here: `CUSTOM` with an empty value and no custom mode
at all render identically, which is why the current module has to mask empty
custom values in its transformer.

**`imageSource` stays a mode** because its three states are not
"authored or not". `NONE` is a deliberate choice to render no image at all,
and an empty image field already means "use the post's".

**`image: false` on the shared tail** — the module supplies `imageSource` +
`image` in the tail's place, so the tail's own `image` field is suppressed.
The tail's "required on Split and Banner" rule still applies, expressed
against the resolved image rather than the field (see validation).

### Resolving the post

`postSource` makes the choice explicit:

- **`PINNED`** renders the referenced post. The reference is required, so an
  unresolvable hero cannot be published.
- **`NEWEST_FEATURED`** renders the newest published post marked `featured`,
  re-resolving as the tenant publishes. The `post` field is hidden.

This replaces the current behaviour, where leaving `featuredPost` empty
silently opts into the fallback and a warning validator hints at it. An
editor could not tell the two states apart without reading the field
description.

### Validation

| State                                     | Level   | Message                                                                |
| ----------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `PINNED` with no `post`                   | Error   | Choose a post, or switch the source to Newest featured.                |
| `NEWEST_FEATURED` with none in dataset    | Error   | No published post is marked Featured, so this hero would render empty. |
| Pinned post's `publishedAt` is future     | Warning | This post publishes later. The hero stays empty until then.            |
| `SPLIT`/`BANNER` with `imageSource: NONE` | Error   | These variants are built around an image.                              |
| `imageSource: POST`, post has no image    | Warning | Falls back to no image on the page.                                    |

The "none in dataset" check is async and runs against `getDraftsClient(context)`,
the helper `page_home` already uses for its duplicate-heading rule, so the
error appears while authoring rather than after publish. The scheduled-post
case is a warning because publishing ahead of a date is legitimate.

### One query, not two

The current hero runs the module query and the fallback-post query in
parallel on every render, then picks between them in the transformer. The
rebuilt one resolves the post inside the module projection:

```groq
*[_type == "module_heroBlog" && _id == $id][0]{
  …,
  "post": select(
    postSource == "PINNED" => post->{ postCardFragment },
    *[_type == "blog_post" && featured == true && publishedAt <= now()]
      | order(publishedAt desc)[0]{ postCardFragment }
  )
}
```

**`select()`, not `coalesce()`.** A coalesce over `post->` would fall back to
the newest featured post whenever the pinned reference failed to resolve —
including when the editor deliberately chose `NEWEST_FEATURED` while a stale
reference is still stored on the document. The branch has to follow
`postSource`, not the reference's emptiness.

The resolved post is **nullable**. A `notNull()` here would turn "this tenant
has no posts yet" into a 404 for the entire page, since a hero slot failure
propagates through the page loader.

**Cache tags:** the module's own `modules:heroBlog` and `module:<id>`, plus
`posts`, `post`, `author` and `topic` for the dereferenced post card, plus
the secondary action's link targets (`topic`, `page_landing`, `page_blog`).
One `isr(...)` call now covers what two did. `REVALIDATE_TAGS` gains
`module_heroBlog: ['modules:heroBlog']`.

### Service view model

```ts
type THeroBlogModule = {
  brandVariant: TFullBrandVariant;
  variant: THeroVariant;
  eyebrow: TMaybeUndefined<string>;
  heading: TMaybeUndefined<string>;
  supportingText: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  primaryAction: TMaybeUndefined<THeroPrimaryAction>;
  secondaryAction: TMaybeUndefined<TCtaAction>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<TLayout>;
};
```

`THeroPrimaryAction` carries over unchanged from `module_hero`, including
`hiddenLabelSuffix`: when the editor leaves the label empty, the generic
"Read more" is followed by the post's own title as visually hidden text,
because Lighthouse's link-text audit reads visible text and not `aria-label`.
An authored label is trusted as already descriptive and gets no suffix.

`contentPosition` and `mediaOrder` each collapse their two variant-scoped
Studio fields into one value, so the organism takes one prop per concept.

### `@blog/ui`

No new organism. `Hero` gains the props the shared tail implies — `variant`,
`tone`, `contentPosition`, `contentAlignment`, `mediaOrder` — and keeps its
existing `Hero.Media` and `Hero.Cta` compound slots. DOM order stays copy
before media at every width; position and media order move things visually
only. That work is #2807, and it is what makes the organism serve every
later hero kind rather than just this one.

### Constants

- New in `@blog/config`: `HERO_POST_SOURCE = { PINNED, NEWEST_FEATURED }` and
  `HERO_IMAGE_SOURCE = { POST, CUSTOM, NONE }`.
- **`HERO_FIELD_MODE` does not shrink in this epic.** `module_hero` still
  reads all six of its values, and the whole premise is that it keeps
  rendering unmigrated. It is deleted with that schema in #2813, not narrowed
  here.

### Pages and desk

`module_heroBlog` joins `HERO_SCHEMA_TYPES`, so every page's hero slot
accepts it with no per-page change, and it gets a desk entry in the modules
group. Starter content seeds a `module_heroBlog` rather than a `module_hero`
(#2812), so new tenants never author on the type that is being retired.

### Migration

None for this epic — a new type and new fields only. The retirement chore
(#2813) is where migration happens: per tenant, create a `module_heroBlog`
carrying the old document's values, repoint `page_home.hero`, then delete the
`module_hero` document, in that order and as separate steps, because a Sanity
`_type` is immutable.

## Post grid images and the `showImages` toggle

**Goal:** the post grid shows each post's image, on every surface that
renders it, with one switch per listing module to turn images off. Today
the grid renders no image at all: `PostsSection`'s `IPostCardData` has no
image field, even though `PostCard` has carried a `Media` slot since it was
built and the service already projects every post card's hero image. Most of
this is wiring, not data. Design of record for epic #2782, settled in #2816.

Interactive mock — switch surface, toggle, dataset gaps and viewport:
<https://claude.ai/code/artifact/0723b862-08b2-41f4-b4bd-cb917cba7cad>.

### Where the toggle lives

| Surface                              | Renders through         | Toggle    | Why                                                                      |
| ------------------------------------ | ----------------------- | --------- | ------------------------------------------------------------------------ |
| Home and landing pages, latest posts | `module_postLatest`     | **Yes**   | Per instance — a dense home page may want a text-only teaser             |
| Blog, topic and tag archives         | `module_postList`       | **Yes**   | The archive is a module too; same helper, same default                   |
| Post page, related reading           | `PostsSection` directly | Always on | No module document exists to author a setting on, so the default applies |

The ticket asked how "archive pages that render `PostsSection` outside a
module" pass the image. They do not exist: the blog, topic and tag pages all
render their list through `module_postList` in their required slot, so the
toggle reaches them. The only grid outside a module is the post page's
related-reading section, and that gets images unconditionally.

### Fields

One helper, `showImagesField()`, emitted by both listing modules right after
`sectionHeaderField()`:

| Field        | Type                                              | Notes                                            |
| ------------ | ------------------------------------------------- | ------------------------------------------------ |
| `showImages` | boolean, `initialValue: true`, no validation rule | "Show each post's image on its card." Default on |

`showImages` rather than `hasImages` on the schema, matching the existing
verb-phrase booleans (`openInNewTab`, `newsletterEnabled`); the organism prop
is `hasImages`, matching the repo's `is`/`has` rule for React booleans.

**Existing documents read as on.** Sanity's `initialValue` fills new
documents only; every `module_postLatest` and `module_postList` already in a
tenant dataset has no `showImages`. The service projects
`coalesce(showImages, true)` rather than the bare field, so those documents
behave as if the field had always been there. That is the schema's declared
default applied at read time, not a faked value in the view model, and it is
what makes this ship with **no content migration**. A bare `.notNull()` on
the raw field would instead throw on every pre-existing document and 404
its page.

### Service

Both module view models gain one field:

```ts
type TPostLatestModule = { …; showImages: boolean };
type TPostListModule = { …; showImages: boolean };
```

`TPostCard` is **unchanged**. It already carries `heroImageSanity:
TMaybeUndefined<ISanityImage>` with hotspot, crop, LQIP and alt, and the
related-posts list on the post page is a `TPostCard[]` too. The service does
not strip the image when the toggle is off: the flag says how the module
wants to render, the card says what the post has, and the web layer combines
them. Stripping data to express a presentation choice would also break the
related-reading surface, which has no flag.

### `@blog/ui`

`PostsSection` gains `hasImages?: boolean`. `IPostCardData` gains
`image?: ReactNode`. When `hasImages` is set, **every** card renders
`PostCard.Media` — the node when there is one, the empty frame when there is
not. `PostCard.Media` is already `aspect-video` with a `bg-surface-2` fill,
so a post without an image keeps its tinted 16:9 block and the row stays
aligned rather than going ragged because one editor forgot an image. When
`hasImages` is unset, no card has a media region at all.

The organism never builds an image. It receives a pre-rendered node per
card, the same contract `CtaModule` uses for its `image` prop.

### Web

One helper owns the card image, so every surface sizes it identically:

```tsx
const renderPostCardImage = (post: TPostCard) =>
  post.heroImageSanity ? (
    <SanityImage
      image={post.heroImageSanity}
      width={640}
      height={360}
      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
      loading="lazy"
      className="size-full object-cover"
    />
  ) : undefined;
```

- `640 × 360` is the 16:9 frame at a comfortable density for a third-width
  column; `sizes` follows the grid's own breakpoints (`grid-cols-1
sm:grid-cols-2 md:grid-cols-3`).
- **`loading="lazy"`, never `priority`.** The hero owns the page's LCP
  image, and `SanityImage`'s `priority` withholds the LQIP placeholder and
  hints `fetchPriority="high"`; a grid of six cards must not compete for
  that.
- `alt` comes from the asset via `ISanityImage.alt`; nothing is invented.

`toPostListItems(posts, renderImage?)` takes the helper as an optional
callback and sets `image` on each item when given. The two module components
pass it when `showImages` is on; the post page's related-reading call always
passes it. `PostListModuleView` forwards `hasImages` to `PostsSection`.

### Validation

None — and specifically **no `required()` rule either**.

An earlier revision of this section specified `validation: rule.required()`,
on the reasoning that "a required boolean with an initial value cannot be
invalid." That is true only of documents created after the field exists.
`initialValue` fills the form when an author creates a document; it never
backfills documents already in a dataset. PR #2886 demonstrated the
consequence: `Document validation` reported 18 errors, one per pre-existing
module document (17 `module_postList`, 1 `module_postLatest`), each
`showImages ✖ Required` — contradicting this design's own promise that
existing documents keep validating.

So the field carries `initialValue: true` and nothing else, matching
`newsletterEnabled` on `blog_post`, which is the same shape for the same
reason. New documents default to on through `initialValue`; existing ones
read as on through the `coalesce(showImages, true)` projection below. The
guarantee that makes this safe lives in the query, not in a validation rule.

### Migration

None. One additive field, defaulted at read time for existing documents.

### Per-layer scope

- **studio** — `showImagesField()` helper; both listing modules emit it;
  schema tests; `pnpm typegen`, commit generated types.
- **service** — `coalesce(showImages, true)` projection and `showImages` on
  both module view models; transformer tests for present-true,
  present-false and absent. `TPostCard` untouched.
- **ui** — `hasImages` prop and `image` node; stories with images, without,
  and mixed; a test that every card renders `PostCard.Media` when
  `hasImages` is set, including cards with no node; `COMPONENTS.md`
  regenerated.
- **web** — `renderPostCardImage`; `toPostListItems` callback; the two
  module components and the post page pass it; `PostListModuleView` forwards
  `hasImages`. Lighthouse image audits unchanged, since every request
  carries explicit dimensions and `sizes`.

**Acceptance:** grids show each post's image by default on home, landing,
blog, topic and tag pages and in related reading; the toggle hides them per
module instance; a pre-existing module document with no `showImages`
renders with images; a post with no image keeps its frame when the toggle
is on; no grid image carries `priority`.

### Not in scope

- A site-wide default in `settings_site` — two places to set one thing; the
  per-instance field with a default is the whole feature.
- Alternate crops per module — 16:9 is the card's frame; a different ratio
  is a different card, not a setting.
- Images on author or topic cards — different molecules.
- The carousel (1.4) reuses this exact card, so it inherits images and the
  toggle with no work of its own.

## The placeable taxonomy list

**Goal:** `module_taxonomyList` — today a slot-only module that the Topics
and Tags index pages hold in their required `taxonomyList` slot — becomes
placeable in `page_home.modules[]` and `page_landing.modules[]`, so a blog
home can show topic cards between its latest posts and the newsletter. One
type, one authored field, no sibling. Design of record for epic #2787,
settled in #2841.

Interactive mock of the Studio form, the home composition, the validation
states and the resolved view model:
<https://claude.ai/code/artifact/7006d9e6-981f-47cb-a6c6-1428508036d3>.

### One type, not a sibling

The module already has everything a placed module needs — `titleField()`,
`brandVariantField()`, `sectionHeaderField()`, alignment, `layoutField` —
and a web view built from `PostGrid` + `TaxonomyCard`. The only thing it
lacks in `modules[]` is knowing _which_ taxonomy to list, because today the
index page holding it supplies that (`getTaxonomyList(id, taxonomy, …)`
takes it as a parameter and never queries upward for the parent page).

A sibling `module_taxonomyCards` would duplicate the schema, the service
adaptor, the web view and the cache tags to carry one field, and the
schema-derived registries (`MODULE_MAP`, `REVALIDATE_TAGS`) would each
demand an entry for a type that renders identically. The authored field on
the existing type is the whole feature.

### Fields

Added to `module_taxonomyList` between `brandVariantField()` and
`sectionHeaderField()`:

| Field       | Type                                                | Notes                                                                                                                     |
| ----------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `taxonomy`  | `TAXONOMY_KIND` radio, optional                     | `TOPICS` · `TAGS`. "Which terms to list. The Topics and Tags pages list their own, so their module can leave this empty." |
| `sortOrder` | `TAXONOMY_SORT` radio, `initialValue: ALPHABETICAL` | `ALPHABETICAL` · `MOST_POSTS`. Ties in `MOST_POSTS` fall back to title order                                              |
| `limit`     | number, optional, integer ≥ 1                       | "Show at most this many terms. Empty shows all of them."                                                                  |

`taxonomy` is the field the ticket asked for. `sortOrder` and `limit` are
the two the placement needs to be usable: a blog with forty tags cannot put
"all tags, A to Z" on its home page, and the index pages — where every term
belongs and alphabetical is right — are exactly the surface that must not
change. Both apply wherever the module sits; their defaults reproduce
today's index-page behaviour, so an index page with the fields untouched
renders as it does now.

**`taxonomy` is optional on the document, required by the page.** A
`module_taxonomyList` document cannot know what holds it: the page
references the module, not the reverse, and Sanity's `hidden` callback is
synchronous and sees only the module's own document. So there is no hidden
rule. The field is always visible, and the two places its value matters
each carry an async rule in the `validateSingleBlankHeadingPerType` mould —
a page-level `custom()` on the referencing field that fetches the referenced
module through `getDraftsClient(context)`:

| Page field                                                    | Rule                                                               | Level                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `page_home.modules[]` · `page_landing.modules[]`              | every referenced `module_taxonomyList` has a `taxonomy`            | Error — "Choose whether the '{title}' module lists topics or tags." |
| `page_topicIndex.taxonomyList` · `page_tagIndex.taxonomyList` | the referenced module's `taxonomy`, if set, equals the page's kind | Error — "This page lists topics; the module is set to tags."        |
| `module_taxonomyList.limit`                                   | integer, at least 1                                                | Error                                                               |

The first rule is what "required in `modules[]`" means for a referenced
document; the second is what stops an editor from pointing the Topics page
at a module set to tags and wondering why nothing changed. An index-page
module with `taxonomy` left empty is the common, correct case and passes
both.

### Service

One query resolves the module and its terms together, following the
`module_heroBlog` precedent, with the page's kind passed in as the fallback
for index-page slots:

```groq
*[_type == "module_taxonomyList" && _id == $id][0]{
  …,
  "taxonomy": coalesce(taxonomy, $fallbackTaxonomy),
  "sortOrder": coalesce(sortOrder, "ALPHABETICAL"),
  limit,
  "entries": select(
    coalesce(taxonomy, $fallbackTaxonomy) == "TOPICS" =>
      *[_type == "blog_topic"] | order(title asc){ topicFragment, postCount },
    coalesce(taxonomy, $fallbackTaxonomy) == "TAGS" =>
      *[_type == "blog_tag"] | order(title asc){ tagFragment, postCount }
  )
}
```

- **`coalesce(sortOrder, "ALPHABETICAL")`** is the read-time default for
  documents that predate the field, same as `showImages` — no migration.
- **Sorting and the limit are applied in the transformer**, not in GROQ. A
  tenant has dozens of terms at most, `MOST_POSTS` needs the per-term
  `postCount` the projection already computes, and a `$limit` inside a
  slice is not something the groqd builder types. The entries projection
  mirrors the one the entity loaders already use.
- **The resolved `taxonomy` is nullable in the projection and checked in
  the loader.** A module placed in `modules[]` with no `taxonomy` and no
  fallback has nothing to list; the loader throws, `safeAsync` turns that
  into a failed result, and the module component omits itself — the page
  keeps rendering. Page validation makes that state unpublishable, so this
  is the belt to the validator's braces, never the expected path.
- **Cache tags:** `modules:taxonomyList`, `module:<id>`, plus `topics` or
  `tags` for the terms and `posts` for their counts — the union of what the
  two calls carry today.

```ts
type TTaxonomyListModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: TSectionHeader;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  taxonomy: TTaxonomyKind;
  entries: TTaxonomyEntry[];
};

getTaxonomyList(id, tenant, fallbackTaxonomy?: TTaxonomyKind)
```

`taxonomy` joins the view model because the web layer needs it to build
hrefs and pick copy. `sortOrder` and `limit` do not: they are consumed by
the transformer and `entries` comes out already ordered and cut.

### Constants and the slot-type union

- New in `@blog/config`: `TAXONOMY_SORT = { ALPHABETICAL, MOST_POSTS }`.
  `TAXONOMY_KIND` already exists.
- **`module_taxonomyList` leaves `TSlotModuleType`.** That union names the
  modules that render _only_ through a page slot, and it is what
  `MODULE_MAP`'s `Exclude<TModuleType, TSlotModuleType>` keys on. Removing
  the member turns the missing `MODULE_MAP` entry into a compile error,
  which is the registry doing its job; it also means the config change and
  the web entry cannot merge separately. `TSlotModuleType` becomes
  `THeroModuleType | 'module_postList'`.

### `@blog/ui`

None. The taxonomy list has no organism: the web view composes `PostGrid`
and `TaxonomyCard` directly, and the ticket's "PostsSection-adjacent
organism" does not exist. The view already takes a `headingLevel` prop from
its caller; a `modules[]` placement passes `2`, the same level `PostsSection`
fixes for every other module, because the page's `<h1>` belongs to the hero
or the page header.

### Web

`TaxonomyListModule` takes the `MODULE_MAP` shape (`id`, `locale`, `tenant`)
and resolves everything else itself: hrefs through `routes.topic` /
`routes.tag` by the view model's `taxonomy`, and copy from one
`taxonomyListModule` i18n namespace keyed by kind (`topics.postsCount`,
`tags.postsCount`, `topics.fallbackHeading`, …). The index pages call the
same component with two extra props — the fallback kind and their own
accessible title — and stop passing `buildHref` / `formatPostCount`, which
were only ever the page restating what the kind implies. `topicsPage` and
`tagsPage` keep only the strings that are theirs.

**Empty lists.** In `modules[]` an empty result omits the module, the way
`PostLatestModule` returns `null` — a home page with no topics yet should
not carry an empty section. In an index-page slot the empty message renders
as today, because that page has nothing else to show.

`REVALIDATE_TAGS` already carries `module_taxonomyList`; nothing changes
there.

### Migration

None. `taxonomy` and `limit` are optional; `sortOrder` is defaulted at read
time. The three seed migrations that create index-page modules keep
creating them without a `taxonomy`, which is the correct value for a slot.

### Per-layer scope, and why it is one PR

- **config** — `TAXONOMY_SORT`; `module_taxonomyList` out of
  `TSlotModuleType`.
- **studio** — the three fields; the two page-level rules; `page_home` and
  `page_landing` allow-lists gain `taxonomyListSchema.name`; schema tests;
  `pnpm typegen`, commit generated types.
- **service** — the merged query with `select()`; `fallbackTaxonomy`
  parameter; transformer applies `sortOrder` then `limit`; tests for
  authored-topics, fallback-tags, unresolved (throws), each sort order,
  limit present and absent, and the read-time `sortOrder` default.
- **web** — `MODULE_MAP` entry; the module resolves hrefs and copy from the
  kind; index pages pass the fallback; `modules[]` placement omits itself
  when empty; web tests and a story per kind.

**One PR.** `TAXONOMY_SORT` has no consumer until the studio schema lands
(knip fails on the unused export), and dropping `module_taxonomyList` from
`TSlotModuleType` reds `MODULE_MAP` until the web entry lands. Neither
config change merges green alone, so the epic ships as a single PR, the way
Phase 0 (#2858) did.

**Acceptance:** a home or landing page lists topics or tags between any two
modules, ordered and capped as authored; the Topics and Tags pages render
exactly as before with their module untouched; a placed module with no
taxonomy fails page validation and, if it somehow publishes, omits itself;
an index page whose module is set to the other kind fails validation.

### Not in scope

- A curated pick of specific terms (an array of references). `MOST_POSTS`
  plus `limit` covers the teaser case; hand-picking is a different field
  with its own validation, added when a tenant asks.
- Hiding zero-post terms. They sort last under `MOST_POSTS` and fall off
  under `limit`; on the index pages they stay, as they do today.
- Term images. `blog_topic` / `blog_tag` carry none; a card with an image
  is a different molecule.
- Latest post titles on each topic card. Worth doing — on a home page a
  title, a description and a count read as a second row of post cards with
  the pictures missing — but it is a presentation upgrade across service,
  ui and web that the Topics index wants too, so it is Phase 1.6, epic
  #2891 (design #2892), unblocked once this epic merges. Option B in the
  mock is the proposed shape; the double lead cell there is dropped.
- Tags as a cloud of pills (option C in the mock). A different molecule, and
  nobody has asked for tags on the home page.

## `module_postFeatured` — the editor-pinned spotlight

**Goal:** a module an editor finds by name: one to three posts in a
spotlight — the first large, the rest as cards — as an `h2` section
anywhere in `modules[]`. It is neither `module_heroBlog` (one post, owns
the page's `h1`) nor `module_postLatest` (automatic, never chosen). Design
of record for epic #2784, settled in #2828.

Interactive mock of the Studio form, the three layouts and every
validation state:
<https://claude.ai/code/artifact/d22ed2b2-0508-4bc3-afbe-ebe76ef74013>.

### Fields

| Field               | Type                                                      | Notes                                                                                      |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `title`             | `titleField()`                                            | Editor-facing name, never rendered                                                         |
| `brandVariant`      | `brandVariantField()`                                     |                                                                                            |
| `sectionHeader`     | `sectionHeaderField()`                                    | Blank heading falls back to "Featured"                                                     |
| `showImages`        | `showImagesField()`                                       | The 1.2 toggle, applied to the lead and the cards alike                                    |
| `postSource`        | `POST_SOURCE` radio, required, initial `PINNED`           | `PINNED` · `NEWEST_FEATURED` — the `module_heroBlog` rule, under a name that is not "hero" |
| `posts`             | array of references → `blog_post`, hidden unless `PINNED` | One to three; array order is display order, the first is the lead                          |
| `limit`             | number, hidden unless `NEWEST_FEATURED`, initial `3`      | Integer, 1 to 3                                                                            |
| _alignment, layout_ | `defineAlignmentFields([])`, `layoutField`                |                                                                                            |

**The source is explicit, not inferred from an empty array.** The epic
sketched "pinned when set, newest featured when the array is empty". That
is the rule `module_heroBlog` replaced, for the reason recorded there: an
editor cannot tell "I chose the fallback" from "I forgot to pin" without
reading a field description. `postSource` makes the choice a control, the
array and the limit each show only under the source that uses them, and an
empty array under `PINNED` is an error rather than a silent mode switch.

**The constant is `POST_SOURCE`.** `HERO_POST_SOURCE` shipped with
`module_heroBlog` and has the exact two values this module needs; a
non-hero module importing a `HERO_`-prefixed constant reads wrong for as
long as it exists. It is renamed in `@blog/config` with its four consumers
(the hero schema and its test, the hero query, the starter-content
script) updated in the same small PR, before the module's own PR.

### Validation

| State                                          | Level   | Message                                                                                      |
| ---------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `PINNED` with no posts                         | Error   | Pin at least one post, or switch the source to Newest featured.                              |
| `PINNED` with more than three                  | Error   | A spotlight holds at most three posts.                                                       |
| The same post pinned twice                     | Error   | `unique()` on the array                                                                      |
| A pinned post's `publishedAt` is in the future | Warning | This post publishes later. The spotlight skips it until then.                                |
| `NEWEST_FEATURED` with none in the dataset     | Error   | No published post is marked Featured, so this spotlight would render empty.                  |
| Two blank-heading spotlights on one page       | Error   | `validateSingleBlankHeadingPerType` gains `module_postFeatured` on every page that allows it |

"Published only" needs no picker filter. For a strong reference — the
default, and what `posts` uses — Sanity refuses to publish a document that
references an unpublished one, so a draft-only post cannot be pinned into
a published module; a scheduled post can, and is skipped at
read time until its date, hence the warning rather than an error. The
async "none in the dataset" check runs against `getDraftsClient(context)`,
as `module_heroBlog`'s does.

`blog_post.featured`'s description — "Pin this post to the featured slot on
the home page" — describes `module_hero`, which is being retired. It
becomes "Marks this post for the Newest featured source of the blog hero
and the featured spotlight."

### Service

One query, the `module_heroBlog` shape:

```groq
*[_type == "module_postFeatured" && _id == $id][0]{
  …,
  "posts": select(
    postSource == "PINNED" =>
      posts[]->[publishedAt <= now()]{ postCardFragment },
    *[_type == "blog_post" && featured == true && publishedAt <= now()]
      | order(publishedAt desc)[0...3]{ postCardFragment }
  ),
  limit
}
```

- **Pinned order is authored order.** `posts[]->` keeps the array's
  sequence, so the editor's first pick is the lead. The published filter
  drops what cannot render; nothing re-sorts.
- **The fallback fetches three and the transformer cuts to `limit`.** Three
  is the ceiling, so the literal slice costs nothing, and it keeps a
  parameter out of a slice expression.
- **An empty result is a result, not an error.** Every pinned post
  unpublished, or no featured post yet, yields `posts: []`; the module
  omits itself. Only an unresolvable module id fails.
- **Cache tags:** `modules:postFeatured`, `module:<id>`, `posts`, `author`,
  `topic` — the same set `getPostLatest` carries, in one `isr(...)` rather
  than two.

```ts
type TPostFeaturedModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: TSectionHeader;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  showImages: boolean;
};
```

Structurally `TPostLatestModule`. That is deliberate: the web view, the
card mapping and the carousel display mode (1.4) treat the two as the same
thing with a different first card.

### `@blog/ui` — a `PostsSection` layout, not a new organism

The spotlight is `PostsSection` with a different first card. Everything
else the section owns — the heading and its accessible fallback, the
supporting text, the images toggle, the empty state, the tint and wrap
variants — is unchanged, and 1.4's carousel will wrap this same section.
A `FeaturedPosts` organism would duplicate all of it to change one card.

**`PostCard` gains two booleans.**

| Prop      | Effect                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| `isSplit` | Below `md`, unchanged (media above copy). From `md`, media and copy sit side by side, media first, in a 1:1 split  |
| `isLead`  | Display-size title, the excerpt at three lines instead of two, and a taller media frame; meta and footer unchanged |

Both are presentation only. DOM order is media, meta, title, footer at
every width, so the accessible reading order does not change with the
layout.

**`PostsSection` gains `hasLead?: boolean`.** _(Superseded 2026-09-08: `PostsSection` retires per [`2026-09-08-page-composition-design.md`](./2026-09-08-page-composition-design.md); the arrangement below moves to the featured module component in web, unchanged in shape.)_ When set, the first post
renders as `isLead` + `isSplit` across the full width, and the rest render
below in a row of as many columns as there are cards — two cards as
ordinary cards, a single card as `isSplit` so it too fills its row:

| Posts | Layout                                                            |
| ----- | ----------------------------------------------------------------- |
| 1     | The lead alone, split from `md`                                   |
| 2     | The lead, then the second post as an `isSplit` card at full width |
| 3     | The lead, then two ordinary cards in two columns from `sm`        |

Every count fills its rows; there is no third-column hole because the tail
never uses the section's own three-column grid (`PostsSection` lays out
its cards with its own grid classes, not the `PostGrid` organism). Card heading level stays
`cardHeadingLevel` (default 3) for the lead too — it is the section's
first item, not a new heading tier.

### Web

`PostFeaturedModule` is `PostLatestModule` with a different loader and one
extra prop through to the view: `PostListModuleView` gains `hasLead` and
passes it to `PostsSection`. The image callback stays the 1.2 helper for
the cards; the lead gets a sibling `renderPostLeadImage` — 960 × 540,
`sizes="(min-width: 768px) 50vw, 100vw"`, still `loading="lazy"`, never
`priority` — chosen per post by comparing against the first id. Copy:
`postFeaturedModule.fallbackHeading` = "Featured". `REVALIDATE_TAGS`
gains `module_postFeatured: ['modules:postFeatured']`.

### Pages and desk

`page_home`, `page_landing` and `page_blog` allow it — the blog page today
allows only `cta` and `newsletter` beside its required list, and the
spotlight is the first listing module that makes sense above or below a
paginated archive. Each of the three adds `module_postFeatured` to its
`validateSingleBlankHeadingPerType` list (the blog page gains the rule for
the first time). It sits in the post-modules desk group beside
`module_postLatest`.

### Migration

None — a new type and a constant rename whose stored values do not change.

### Per-layer scope and PRs

- **config** — `HERO_POST_SOURCE` → `POST_SOURCE`, with its four
  consumers. **Its own PR, first**; merges green alone.
- **ui** — `isSplit` / `isLead` on `PostCard`, `hasLead` on
  `PostsSection`; stories for one, two and three posts with and without
  images; tests that the first card carries both variants and the tail
  never renders three columns; `COMPONENTS.md`. **Its own PR**; additive.
- **studio** — the schema, `posts` and `limit` visibility and rules, the
  async featured check, the `featured` description, three allow-lists and
  three validator lists, desk entry; `pnpm typegen`.
- **service** — the merged query, `limit` in the transformer, tests for
  pinned, pinned-with-unpublished, fallback with and without limit, and
  empty.
- **web** — module component, `hasLead` through the view, the lead image
  helper, i18n, `MODULE_MAP` and `REVALIDATE_TAGS`; tests; a story.

**studio + service + web ship as one PR**: typegen adds
`module_postFeatured` to `TModuleType`, which reds `MODULE_MAP` and
`REVALIDATE_TAGS` until the web entries land — the same reason
`module_heroBlog` shipped as one.

**Acceptance:** placeable on home, landing and blog pages; pinned posts
render in authored order with the first as the lead; the newest-featured
source honours its limit; the module renders nothing when nothing
resolves; one, two and three posts each fill their rows; images follow the
toggle; a blank heading reads "Featured" and two blank spotlights on one
page fail validation.

### Not in scope

- Per-post overrides (a custom title or image on a pin). The card shows
  the post as published; the hero is where copy gets rewritten.
- A "sticky" pin that survives the source switch. Switching source hides
  the array; switching back restores it, since the field keeps its value.
- The carousel display mode — 1.4 adds `displayMode` to this module and
  `module_postLatest` together.

## The carousel display mode

**Goal:** an editor turns a post grid into one swipeable row without
choosing a different module. `displayMode` (`GRID` | `CAROUSEL`) is a
per-instance presentation field on the two teaser modules,
`module_postLatest` and `module_postFeatured`; the data scope stays what
the module already is. `module_postList` paginates and never gets it. The
row is a pure `@blog/ui` scroll-snap track that works before hydration; an
`apps/web` client leaf hands it to Embla once hydrated. Nothing autoplays.
Design of record for epic #2785, settled in #2835.

Interactive mock of both modes at three widths, the Studio field, every
runtime state and the layer contracts:
<https://claude.ai/code/artifact/39a2d352-fc1c-4c70-a6d9-f2e8eb8e6bfa>.

### Fields

One field, added by a shared `displayModeField()` helper right after
`showImagesField()` on both modules:

| Field         | Type                                                | Notes                                                                                                                                                                                    |
| ------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `displayMode` | `DISPLAY_MODE` radio, `initialValue: GRID`, no rule | "Grid stacks the posts in rows. Carousel puts them in one row the reader swipes or steps through. On a wide screen where every post already fits, the carousel's buttons stay disabled." |

**No `required()` rule, and a read-time default.** A new field on an
existing type never backfills: `initialValue` applies to documents created
after the field exists, so a `required()` rule would red every
`module_postLatest` already in production. The service reads
`coalesce(displayMode, "GRID")` instead, the `showImages` pattern, and the
epic's "grid remains the default" holds for old and new documents alike.

### Validation

| State                                            | Level   | Message                                                                                                                               |
| ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `module_postLatest`: `CAROUSEL` with `limit` < 4 | Warning | Fewer than four posts fit on one row on wide screens, so this carousel has nothing to scroll there. Raise the limit, or use the grid. |

That is the only carousel rule, and it is a warning on `module_postLatest`
alone. `module_postFeatured` pins three posts at most, so its carousel is a
narrow-screen choice by definition; on a wide screen its buttons render
disabled, which the field description says. Which modules get the field is
also settled: the two teasers only. `module_taxonomyList` (1.5, 1.6) and
the portfolio strand's `module_projectLatest` can adopt the same helper and
organism later; nothing here presumes it.

### Service

Both teaser projections gain `"displayMode": coalesce(displayMode, "GRID")`
and both view models gain `displayMode: TDisplayMode` — required in the
type, defaulted in the query, never faked in the transformer. Nothing else
in the service changes: the carousel is the same posts in a different
layout, and `limit` already caps them.

### `@blog/ui` — `Carousel`, and a slot on `PostsSection`

> **Superseded 2026-09-08** by
> [`2026-09-08-page-composition-design.md`](./2026-09-08-page-composition-design.md):
> `PostsSection` retires, so the `PostsSection.Carousel` slot below is not
> built. `Carousel` stays exactly as specified; the latest and featured
> module components compose it themselves from `PostCardItem` slides.

**`Carousel` is a new pure organism.** It renders a viewport `<div>` that
takes a `viewportRef`, a `<ul>` track, and one `<li>` slide per child,
plus a `Carousel.Controls` slot. It has no hook, no `'use client'` and no
Embla import — it is the markup Embla needs and the CSS that makes that
markup a carousel on its own.

| Prop                                | Effect                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`                          | The slides. Anything that is not a `Carousel.Controls` element becomes an `<li>`                                                                        |
| `viewportRef?: Ref<HTMLDivElement>` | Forwarded to the viewport element — the node Embla binds to. React 19 ref-as-prop, the `IconButton` precedent                                           |
| `isEnhanced?: boolean`              | Off: `overflow-x-auto snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto` and a thin scrollbar. On: `overflow-hidden`, no snap, no scrollbar |
| `ariaLabel: string`                 | Names the region; with `aria-roledescription="carousel"` on the root                                                                                    |
| `Carousel.Controls`                 | Two `IconButton`s centred under the track: `previousLabel`, `nextLabel`, `onPrevious`, `onNext`, `isPreviousDisabled`, `isNextDisabled`                 |

`isEnhanced` is the boundary. Before hydration the viewport is a native
scroll container: swipe, trackpad and shift-wheel all work, mandatory snap
keeps a card aligned, and the thin scrollbar is the mouse user's
affordance. Embla needs `overflow: hidden` on the viewport it drives, so the
leaf flips the flag once Embla reports `init`, and the two mechanisms never
run at once.

**Slide widths track the grid's columns**, so a carousel with three posts
at `md` is pixel-identical to the grid apart from the buttons:

| Width       | Grid      | Slide                       | Why                                                                                                |
| ----------- | --------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| below `sm`  | 1 column  | 85 % of the viewport        | The 15 % peek of the next card is the only cue that the row scrolls while the buttons are disabled |
| `sm`        | 2 columns | ½ minus half a gap          | Two whole cards; a half-card at this width reads as a layout bug                                   |
| `md` and up | 3 columns | ⅓ minus two-thirds of a gap | Three whole cards, the grid's own count                                                            |

Gaps reuse the grid's tokens (`gap-3.5 md:gap-5 lg:gap-7`); slides are
`shrink-0 min-w-0 snap-start`; the track carries
`touch-action: pan-y pinch-zoom` so vertical page scrolling survives a
horizontal drag.

**The controls always render.** They sit centred under the track rather than
in the heading row, so a centred or right-aligned section header keeps
its shape, and they are never hidden — not before hydration (disabled, because
they cannot work yet) and not when every post already fits (both disabled).
Hiding them would shift the layout the moment Embla reports, and a disabled
button is the honest state of "nothing to scroll". Labels are props; the
organism hardcodes none.

**Accessibility is the list's, not a slideshow's.** Every card stays in the
DOM and in the tab order; nothing is `aria-hidden` or `inert` off-screen.
Tab reaches each card link in DOM order, then the two buttons; the viewport
follows focus (the browser natively, Embla through its default
`watchFocus`). Arrow keys are not captured. The root carries
`aria-roledescription="carousel"` and the `ariaLabel`; slides carry no
"n of m" labels, because they are not hidden and the count is the list's.

**`PostsSection` gains a `PostsSection.Carousel` compound slot.** The
section already owns the heading and its accessible fallback, the
supporting text, the images toggle, the empty state, the tint and wrap
variants, and — since 1.3 — a single `renderPostCard`. When the slot is
present the section renders its cards as the track's slides inside a
`Carousel` instead of its grid, passing the slot's props (`viewportRef`,
`isEnhanced`) and its `Carousel.Controls` child through. `hasLead` is
ignored in a carousel: every slide is an ordinary card, because a carousel
is a row of peers. The slot exists so the web leaf never maps a post to a
card — that mapping stays in one place.

### Web

**`PostsCarousel` is the `'use client'` leaf**, under
`apps/web/src/components/shared/`, the `NewsletterForm` shape: it takes
`PostsSection`'s props, imports `SmartLink` itself for `linkAs`, and renders
`PostsSection` with the slot. Its whole job is state Embla owns:

```ts
const [viewportRef, embla] = useEmblaCarousel({
  align: 'start',
  slidesToScroll: 1,
  containScroll: 'trimSnaps',
  dragFree: false,
  loop: false,
  breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
});
```

- `align: 'start'` and `slidesToScroll: 1` — one card per step, the first
  visible card flush left, the same step a drag takes. `containScroll:
'trimSnaps'` (Embla's default, stated because it matters) lands the last
  slide flush right with no empty tail. `dragFree` off and `loop` off; no
  autoplay plugin is installed.
- `isEnhanced`, `isPreviousDisabled` and `isNextDisabled` are `useState`
  fed from `init`, `select` and `reInit` via `canScrollPrev()` /
  `canScrollNext()`. Server render and first client render both have
  `isEnhanced` false, so there is no hydration mismatch.
- **On `init` the leaf reads the viewport's native `scrollLeft`, resets it
  to `0`, and jumps (`scrollTo(index, true)`) to the slide the reader had
  already scrolled to.** A reader who swiped before hydration would
  otherwise see the row snap back to the start when Embla takes over the
  viewport — the one genuinely non-obvious step, and the one to test.
- Reduced motion: the native track uses `motion-reduce:scroll-auto`; Embla
  gets `duration: 0` through its `breakpoints` option, which takes any
  media query. Position changes become instant; nothing else changes.
- Labels: `carousel.previousAriaLabel` and `carousel.nextAriaLabel`, read
  with `useTranslations` in the leaf. The buttons are icon-only, so the
  text is an `aria-label` no sighted reader sees — the accessibility-only
  bucket of `VOICE_FIXED_KEYS` (`blogPostPage.backToTop.ariaLabel`,
  `bookmarkButton.saveAriaLabel`), not a tenant-editable `VOICE_FIELDS`
  entry the way pagination's visible Previous/Next are.

`PostListModuleView` gains `displayMode?: TDisplayMode` and branches once:
`CAROUSEL` renders `PostsCarousel`, anything else the existing
`PostsSection`. `PostLatestModule` and `PostFeaturedModule` pass it through;
`PostListModule` (the archive) never does. The leaf is a static import —
Embla is small enough that a `next/dynamic` split would cost more than it
saves — and `embla-carousel-react@8.6.0` (peer `react ^19`, MIT) is added
to `apps/web` only. The v8 API is the one this design names
(`scrollPrev`/`canScrollPrev`, `reInit`); the `9.0.0-rc` line renames them,
so pin the major.

### Pages and desk

None. The field is on existing module types; allow-lists, the desk and the
blank-heading rule are untouched.

### Migration

None — one optional field, defaulted at read time.

### Per-layer scope and PRs

- **config** — `DISPLAY_MODE` + `TDisplayMode`.
- **studio** — `displayModeField()` helper on both modules, the warning
  rule on `module_postLatest`, schema tests, `pnpm typegen`.
- **service** — the coalesced projection and the view-model field on both
  teasers; transformer tests for an authored value and the read-time
  default.
- **ui** — `Carousel` with `Controls`; the `PostsSection.Carousel` slot;
  stories for a row that fits, a row that scrolls, enhanced and not,
  with and without images, and a carousel spotlight; tests that
  `isEnhanced` swaps the viewport classes, that controls carry their props,
  that the slot replaces the grid and ignores `hasLead`; `COMPONENTS.md`.
- **web** — the dependency, `PostsCarousel`, the `displayMode` branch in
  the view and both modules, the copy keys; a test with
  `embla-carousel-react` mocked that asserts the button wiring, the
  `isEnhanced` flip and the scroll-offset handoff; a web story with real
  Embla.

Four PRs, each green on `main` alone:

1. **ui** first and independent — additive, consumes no new constant.
2. **config + studio** together — `DISPLAY_MODE` has no consumer until the
   schema uses it, and knip fails on the bare export (the taxonomy-list
   precedent).
3. **service** — a field nothing reads yet is a type member, not an export.
4. **web** — the dependency and the leaf; the only PR whose dependency
   review matters.

The `module_postFeatured` half of the studio, service and web work waits
on that module existing on `main` (epic #2784's studio → service → web
PR); the ui PR and the `module_postLatest` half do not.

**Acceptance:** grid remains the default for every existing document;
carousel mode swipes without JavaScript and is Embla-driven with it; the
row keeps its position across hydration; no autoplay; both buttons are
keyboard reachable, labelled, and disabled exactly when Embla cannot move;
reduced motion makes every position change instant; a spotlight in
carousel mode renders three equal slides; a `module_postLatest` carousel
with fewer than four posts warns in the Studio.

### Not in scope

- Dot navigation or a position readout. Two buttons and the peek are the
  whole affordance; dots are a slideshow idiom for a row of cards.
- Grouped stepping (`slidesToScroll: 'auto'`). One card per step matches
  the drag and is predictable; a paging step can be added if a tenant asks.
- An edge-to-edge bleed. The row stays in the content column like the
  grid; a bleed is a `Section` layout decision, not a carousel one.
- `displayMode` on `module_taxonomyList`, `module_postList` or the
  portfolio modules.

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
- **Post grid images are a per-module `showImages` boolean, default on,
  defaulted at read time** — `coalesce(showImages, true)` in the projection
  so pre-existing documents need no migration; the service keeps the image
  on every post card and exposes only the flag; the organism renders the
  media frame on every card when images are on, so a post without one keeps
  the row aligned; one web helper sizes the image, lazy and never `priority`
  (2026-09-07, #2816).
- **`module_heroBlog` replaces `module_hero` by addition, not migration** —
  mode pairs become optional overrides whose Studio placeholder shows the
  derived value; the newest-featured fallback becomes an explicit
  `postSource` choice with an error when nothing resolves; the two per-render
  queries collapse into one `select()` projection; `HERO_FIELD_MODE` shrinks
  only when the old schema is deleted (2026-09-07, #2802).
- **The hero is a family, not one generalised module** — membership is the
  `module_hero*` naming convention, derived into `THeroModuleType`; one
  `defineHeroFields()` tail (variant, brand variant, image, position,
  alignment, media order, actions, layout) shared by every kind;
  `page_home.hero` required, every other page's `hero` optional and
  replacing that page's default header when set; `module_hero`
  retired by content migration once `module_heroBlog` replaces it
  (2026-09-07, #2791).
- **The taxonomy list is one type with an authored `taxonomy`, not a
  sibling** — optional on the document (a module cannot see what holds it,
  so no hidden rule) and required by an async page-level rule on the home and
  landing pages, with the index pages rejecting a mismatched kind;
  `sortOrder` and `limit` make the placement usable and default to today's
  index-page behaviour; one `select()` query resolves module and terms with
  the index page's kind as the fallback; `module_taxonomyList` leaves
  `TSlotModuleType`, so the epic ships as one PR (2026-09-07, #2841).
- **The featured spotlight is `PostsSection` with a lead card, sourced the
  way the blog hero is** — an explicit `postSource` (`POST_SOURCE`, the
  hero's constant renamed) with a one-to-three pinned array in authored
  order or a limited newest-featured fallback, resolved in one `select()`
  query; `PostCard` gains `isSplit`/`isLead`, `PostsSection` gains
  `hasLead`, and the tail never uses the three-column grid so one, two and
  three posts all fill their rows; no new organism (2026-09-08, #2828).
- **Schema naming is a convention with one human-facing name per type** — the
  `_type` stays machine-facing (`{group}_{camelName}`, family token first
  where code selects on it, no member holding the bare family name), while
  `title:` is a single singular Title-Case name reused verbatim by the desk,
  the create menu and every reference picker; the desk reads `name`/`title`/
  `icon` off the schema instead of restating them, which is what let the
  sidebar drift from the schemas it lists. Recorded in
  `.claude/agents/studio.md` "Naming & file layout", which is the durable
  home — this doc is deleted on completion (2026-09-08).
- **`page_generic` is renamed to `page_landing`, with no migration** — the
  `_type` catches up with the `Landing Page` title #1907 already shipped, so
  the stored name and every human-facing label finally agree. `_type`
  immutability only bites when documents exist, and this one had none:
  production, development and a freshly provisioned tenant all report zero
  (`provision-tenant` seeds `page_home` and no other page document). So it is
  a pure code rename reaching `studio`, the regenerated types, `service`,
  `config` (`routes.genericPage` → `routes.landingPage`) and `apps/web` — and
  because a `_type` rename reds `type-check` in every layer above it until all
  of them land, it ships as **one PR**, not the expand/contract sequence an
  earlier revision of this entry described. The schema moves to
  `documents/pages/landing/` exporting `landingSchema`, and `service` and
  `apps/web` rename their own `generic` directories and symbols to match
  (2026-09-08, #2904).

- **Grid vs. carousel is one `displayMode` field on the two teaser modules,
  and the carousel is a pure scroll-snap track that Embla takes over after
  hydration** — `coalesce(displayMode, "GRID")` keeps every existing
  document a grid with no migration; `Carousel` in `@blog/ui` owns the
  markup, the slide widths and an `isEnhanced` switch, a
  `PostsSection.Carousel` slot keeps the card mapping in one place, and the
  `apps/web` `PostsCarousel` leaf owns Embla (`align: 'start'`, one slide
  per step, no autoplay, `duration: 0` under reduced motion) and hands the
  reader's pre-hydration scroll position across; the buttons always render
  and are disabled exactly when Embla cannot move; a spotlight in carousel
  mode drops its lead treatment; four PRs, ui first (2026-09-08, #2835).

- **Pages are chrome, a heading and modules; every part fetches what it
  alone needs; `PostsSection` and the `*-page-view.tsx` layer retire** —
  recorded in
  [`2026-09-08-page-composition-design.md`](./2026-09-08-page-composition-design.md),
  which supersedes the `PostsSection.Carousel` slot in the carousel section
  and `hasLead` on `PostsSection` in the spotlight section, and adds
  `page_post.modules[]` with a `module_postRelated` (2026-09-08).

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
- **Post grid images** — epic #2782 (design #2816, then `studio → service →
ui → web`); the featured spotlight (#2784) and carousel (#2785) wait on it.
- **Featured spotlight** — epic #2784 (design #2828, then config in its own
  PR, ui in its own PR, and `studio → service → web` as one PR).
- **Page composition** — epic #2943 (sub-issues #2944–#2955) from
  [`2026-09-08-page-composition-design.md`](./2026-09-08-page-composition-design.md)
  (post page first, `PostGrid` columns alongside, then listing modules,
  then `PostsSection` retirement,
  then the related-posts module, then one sub-issue per page); the
  carousel's ui and web sub-issues rebase on it.
- **Carousel display mode** — epic #2785 (design #2835, then ui in its own
  PR, config + studio as one PR, service in its own PR, web in its own PR);
  the `module_postFeatured` half waits on #2784.
- **Placeable taxonomy list** — epic #2787 (design #2841, then `config →
studio → service → web` in a single PR; no ui work).
- **Topic cards list their latest posts** — epic #2891 (design #2892, then
  `service → ui → web`, studio only if a toggle is settled); waits on #2787.
- **`module_heroBlog`** — epic #2780 (design #2802, then `studio → service →
ui → web → db`), plus the retirement chore #2813 once production is moved.
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

- **2026-09-08** — page composition: marked the carousel section's
  `PostsSection.Carousel` slot and the spotlight section's `hasLead` on
  `PostsSection` as superseded by the new page-composition design doc, and
  added its decision-log and ticketing entries.
- **2026-09-08** — added "The carousel display mode" design section (#2835):
  one `displayMode` field defaulted at read time, the pure `Carousel`
  organism with an `isEnhanced` boundary, the `PostsSection.Carousel` slot,
  the Embla leaf's options and scroll-position handoff, and the four-PR
  split.
- **2026-09-08** — added the "`module_postFeatured`" design section (#2828):
  explicit `postSource` under a renamed `POST_SOURCE`, the one-to-three
  pinned array, the merged query, `isSplit`/`isLead` on `PostCard` and
  `hasLead` on `PostsSection`, and the three-PR split.
- **2026-09-07** — added "The placeable taxonomy list" design section
  (#2841): one type with an optional authored `taxonomy` guarded by page-level
  rules, `sortOrder` and `limit`, the merged `select()` query with a fallback
  kind, and `module_taxonomyList` leaving `TSlotModuleType`.
- **2026-09-07** — added the "Post grid images and the `showImages` toggle"
  design section (#2816): where the toggle lives, the read-time default for
  pre-existing documents, the unchanged post card, the organism's frame-on-
  every-card rule and the single web image helper.
- **2026-09-07** — corrected two claims this doc made about where constants
  land, after checking them against `main` while implementing #2780.
  `HERO_VARIANT` does **not** ship with `defineHeroFields()`: it landed early,
  with #2794 (`packages/config/src/constants/module.ts`), so
  `module_heroBlog` consumes it rather than introducing it. And `MEDIA_ORDER`
  does not exist — #2794 renamed `CTA_MOBILE_MEDIA_ORDER` to
  `MOBILE_MEDIA_ORDER`, not to `MEDIA_ORDER`. The doc's name and its
  every-width rationale are the ones being kept: the rename to `MEDIA_ORDER`
  is done in #2807, alongside the organism work that first needs it.
  `module_heroBlog` also cannot ship as one PR per layer — `HERO_MAP` and
  `REVALIDATE_TAGS` are exhaustive over the schema-derived module unions, so
  the studio, service and web sub-issues share a PR; see #2780 for the stack.
- **2026-09-07** — added the "`module_heroBlog`" design section (#2802) and
  corrected the shared tail's media-order row: two variant-scoped fields
  (`mediaOrderSplit`, `mediaOrderStacked`) collapsing to one `mediaOrder`
  prop, and the constant is `MEDIA_ORDER` rather than `MOBILE_MEDIA_ORDER`
  because Stacked's field applies at every width.
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
