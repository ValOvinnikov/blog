# Content model

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §6. Update this file (not a duplicate) whenever
> the Sanity schema changes shape.

Source of truth: `packages/studio/src/schema-types/` (documents grouped `blog/`,
`pages/`, `settings/`; shared `objects/`; `modules/` — standalone,
cross-referenceable page-builder documents, not embedded objects). Naming
convention `{group}_{name}` is being applied incrementally (#251):
every `settings_*`, `page_*`, `blog_*`, `block_*` and `module_*` document is
done; `link` and `migrationState` still carry legacy names.

**Modules are documents, not embedded objects** — pages reference them by
`_ref`, so a module is independently listable, previewable, and reusable
across pages (Studio's built-in **Incoming references** view shows which
pages use a given module before it's edited or deleted). `TModuleType`
(`packages/config/src/constants/module.ts`) is the single source of truth for
the module type registry — a **type-only** union derived from the generated
Sanity types, not a runtime const. Every layer derives from it, so omitting a
type is a compile error rather than silent drift, in two separate places:
web's `MODULE_MAP`, and `REVALIDATE_TAGS`' required
`Record<TModuleType, …>` half (see [`data-flow.md`](./data-flow.md)).

`MODULE_MAP` is keyed `Exclude<TModuleType, TSlotModuleType>`, so it excludes
the hero family — the only modules rendered _through_ a dedicated page slot
(`hero`) rather than a `modules[]` array, and so the only ones that can never
reach `ModuleRenderer`. Exclusion there does **not** exempt them from
`REVALIDATE_TAGS`, which requires an entry for every module type.

**Module documents** (`packages/studio/src/schema-types/modules/`)

- `module_hero` (`heroSchema`) — internal `title`, `featuredPost` (ref to
  `page_post`, warning-only — falls back to the newest featured post), four
  mode/custom field pairs (`heroEyebrow`, `heroTitle`, `heroSubtitle`,
  `heroImage`) built via the `modeFieldPair` helper and driven by the
  UPPERCASE `HERO_FIELD_MODE` const (`CUSTOM`/`NONE`/`POST_TOPIC`/
  `POST_TITLE`/`POST_EXCERPT`/`POST_IMAGE`), `primaryActionLabel`,
  `secondaryAction` (`link`).
- `module_postList` (`postListSchema`) — the **paginated archive**: internal
  `title`, `headingBlock` (required heading — see below), `pageSize` (posts per
  page, 1–24, required), and a vestigial `limit` awaiting removal. It carries
  **no `emptyMessage`** (removed in
  #1899) — empty-state copy belongs to Voice (`site_config.voiceOverrides`),
  same as every other module below.
- `module_postLatest` (`postLatestSchema`) — the **latest-N teaser**: internal
  `title`, `headingBlock` (required heading), `limit` (posts to fetch, 1–12). Split
  from `module_postList` so one type is never both a teaser and an archive;
  which mode you get is settled by the type, not by page context.
- `module_taxonomyList` (`taxonomyListSchema`) — internal `title`,
  `headingBlock` (required heading), `taxonomy` (`TAXONOMY_KIND`, optional),
  `sortOrder` (`TAXONOMY_SORT`, `ALPHABETICAL` by default) and `limit`
  (optional integer ≥ 1). Lists taxonomy entries as cards. `taxonomy` is
  optional on the document because a module cannot see what holds it, so the
  requirement lives on the pages: `page_home`/`page_landing` reject a
  `modules[]` placement that leaves it empty, while an index page leaves it
  empty and the service falls back to that page's own kind — and that page's
  slot rule rejects a module set to the other kind. It carries
  **no `emptyMessage`**: empty-state copy
  belongs to Voice (`site_config.voiceOverrides`, edited in the platform's
  Voice page and overridable per tenant), not to modules — same
  as `module_postList` since #1899.
- `module_content` (`contentSchema`) — internal `title`, `body` (portable
  text). No `headingBlock` — its rich-text `body` supplies any in-content
  headings, so a separate structured heading field would just be a second
  way to do the same thing.
- `module_cta` (`ctaSchema`) — internal `title`, `headingBlock` (heading
  **required**), `action` (`link`, required).
- `module_newsletter` (`newsletterSchema`) — internal `title`,
  `headingBlock` (heading **required**).

Every module document gets a required internal `title` via the reusable
`titleField` helper (§ below) so it's listable/previewable in Studio
independent of its display fields, immediately followed by a **required**
`brandVariant` field via the shared `brandVariantField()` helper
(`schema-types/fields/brand-variant-field/brand-variant-field.ts`) — stored values from
`@blog/config`'s `BRAND_VARIANT` const, `PRIMARY`/`SECONDARY` by default;
`module_hero` passes the wider `BRAND_PRIMARY`/`PRIMARY`/`SECONDARY` option
list. `module_cta`/`module_postList`/`module_newsletter` also get a
`headingBlock` field via the shared `headingBlockField()` helper
(`schema-types/objects/heading-block/heading-block-field.ts`) — see the
`headingBlock` object below. Every module document (incl. `module_hero`)
also gets an optional `layout` field via the shared `layoutField`/
`heroLayoutField` values (`schema-types/objects/hero-layout/hero-layout-field.ts`) — see the
`layout`/`heroLayout` objects below.

**Page documents reference modules**

Every page document is built the same way: `titleField` (internal Studio label),
a `headingBlock`, an optional `heroField`, a `modulesField` and `seoField`. The
allow-lists below are what differs.

- `page_home` (`homePageSchema`, singleton) — `preview.prepare` falls back to
  the generic "Unknown" when the title is unset.
  `heroField({ allow: [heroBlog, heroStatement, heroProfile] })`;
  `modulesField({ allow: [content, cta, newsletter, postLatest, taxonomyList,
postFeatured, featureList, testimonial] })`. Module validation rejects more
  than one blank-heading `module_postLatest`/`module_postFeatured`, and a
  `module_taxonomyList` without a taxonomy.
- `page_landing` (`landingPageSchema`) — adds `slug` (source: title, rejecting
  `RESERVED_SLUGS`). Same `heroField`, `modulesField` and validation as
  `page_home`.
- `page_post` (`postPageSchema`) — the post itself: `slug` (source: title),
  `heroImage` (`imageWithAlt`, optional — a post without one renders imageless
  rather than 404ing), `content` (`articleText`, required), `featured`,
  `author` (ref → `blog_author`, required), `topic` (ref → `blog_topic`,
  required — the post's single primary classification), `tags` (refs →
  `blog_tag`, optional, max 6), `publishedAt` (required), `postTakeaways`
  (optional — the 30-second-skim takeaways for the choose-your-depth reading
  feature). No `heroField`;
  `modulesField({ allow: [postRelated, newsletter, cta] })`, rejecting more
  than one blank-heading `module_postRelated`.
- `page_postIndex` (`postIndexPageSchema`, singleton) — the `/blog` index page
  config. `heroField({ allow: [heroBlog] })`;
  `modulesField({ allow: [postList, cta, newsletter, postFeatured,
taxonomyList] })` — the archive is a `module_postList` placed here, and the
  module's own `pageSize` drives the pagination window. Document validation
  errors on more than one `module_postList` and warns when none is present.
- `page_topic` / `page_tag` (`topicPageSchema` / `tagPageSchema`) — the archive
  page for one term: `slug` (source: title) and a required `topic`/`tag`
  reference, each validated unique across pages of that type.
  `heroField({ allow: [heroBlog] })`;
  `modulesField({ allow: [postList, postLatest, cta, newsletter,
taxonomyList] })`. Document validation errors on more than one
  `module_postList`, warns when none is present, and rejects a
  `module_postList` already referenced by another page of the same type.
- `page_topicIndex` / `page_tagIndex` (`topicIndexPageSchema` /
  `tagIndexPageSchema`, singletons) — the `/topics` and `/tags` indexes, both
  produced by the shared `taxonomyIndexPage` factory
  (`documents/pages/taxonomy-index/taxonomy-index-page.ts`), which takes the
  type name, copy and `TAXONOMY_KIND` per index.
  `heroField({ allow: [heroBlog] })`;
  `modulesField({ allow: [taxonomyList, postLatest, cta, newsletter] })`.
  Document validation errors on more than one `module_taxonomyList`, warns when
  none is present, and errors when a referenced `module_taxonomyList`'s
  taxonomy does not match the page's kind. A `taxonomyList` singular reference
  survives as a `readOnly`, `deprecated` field — superseded by the
  `module_taxonomyList` folded into `modules[]`, and left in place only until a
  follow-up migration drops it.

`modulesField({ allow, description? })`
(`schema-types/fields/modules-field/modules-field.ts`) builds the `modules` array
field's `of` from the allowed `TModuleType[]`, one strong `reference` array
member per allowed type — the single place that field shape is defined,
replacing a hand-duplicated block per page document.

**Other documents**

- `blog_author` — name, image (`imageWithAlt`), bio, role, socialLinks (array of
  `socialProfile`), profilePage (optional ref → a `link` document, so any page
  type it can target).
- `blog_topic` — `title` (required, max 60), slug, description (max 300). The
  post's single primary classification, rendered by the `page_topic` archive
  that references it.
- `blog_tag` — same shape as `blog_topic`. A peer taxonomy, not a sub-level of
  it: a post carries one required `topic` and up to six optional `tags`, and
  each drives its own archive. Neither carries `seo` of its own — the archive's
  metadata lives on the `page_topic`/`page_tag` document that renders it, and
  both warn when no such page exists.
- `block_feature` (`featureBlockSchema`) — a reusable feature card, referenced
  by `module_featureList`'s `features` array (2–8 per module).
- `link` — the single link target every reference-shaped object
  (`linkRef`, `ctaButton`, `ctaSecondaryButton`, `socialProfile`,
  `blog_author.profilePage`) points at.
- `settings_site` (singleton) — `titleField` (bare; see helper note below),
  brand
  (`brand` object: name/logo/tagline — `logo` is optional, falling
  back to a default mark when unset; `tagline` is
  a `brandTagline` object, `{ items: string[] (max 4, each max 15 chars),
separator: BRAND_TAGLINE_SEPARATORS }`, replacing a plain string so the
  service layer can join it with a chosen separator glyph). Carries no SEO
  fields — page metadata and the RSS channel description are authored on the
  pages themselves.
- `settings_theme` (singleton, `themeSettingsSchema`) — `titleField` (bare; see
  helper note below), `preset` (required, `PRESET_ID` stored value:
  `CONSOLE`/`EDITORIAL`), `accentHue`/`logoHue` (optional numbers, 0-360,
  OKLCH hue channels — `logoHue` falls back to `accentHue` when unset),
  `headingFont`/`bodyFont` (optional, `FONT_CHOICE`), `radiusScale`
  (optional, `RADIUS_SCALE`), `density` (optional, `DENSITY`) — a
  tenant-level theme override resolved against `PRESET_REGISTRY` in
  `@blog/config`; part of the Phase 2 configurability epic (#1285).
- Voice copy has no Studio schema. Tenant-overridable UI strings live in
  Postgres, in `site_config`'s `voiceOverrides`, edited in the platform's
  Voice page and merged over the neutral catalog at request time. The
  `settings_voice` singleton that once held them was deleted after the
  Postgres cutover left it with no read path.
- `settings_navigation` (singleton) — `titleField` (bare; see helper note
  below), items (links).
- `settings_footer` (singleton) — `titleField` (bare; see helper note below),
  `social` (social links).
- `settings_newsletter` (singleton) — `titleField` (bare; see helper note
  below), `heading` (required, max 80), `description` (optional, max 300),
  `trustCues` (optional, max 2 phrases of 40 characters) — the CMS-authored
  source of the newsletter form's copy wherever
  it's rendered outside the `module_newsletter` page-builder placement. Lives
  in the desk's **Blog** section, directly after Authors, not the top-level
  Settings group.
- `migrationState` — the system ledger recording which content migrations in
  `packages/studio/migrations/` have run. `studio-config.ts` hides it from
  document actions and the new-document menu; it is never authored by hand.

**Reusable `titleField` helper** (`schema-types/fields/title-field/title-field.ts`) —
`titleField({ initialValue?, readOnly?, description? })`
returns a required `defineField({ name: 'title', type: 'string', … })`. The
field is an **internal Studio label**, never rendered, and its single default
description says so. It says nothing about the slug even on the documents
whose slug derives from it — `slugField()`'s own description already does, one
field below. A caller passing its own `description` overrides the default.
Keep it **bare**
for singletons: a fixed `initialValue` + `readOnly: true` does **not** fix the
Studio "Untitled" heading — `initialValue` doesn't fire for a singleton
opened by `documentId`, and `readOnly` then leaves the field permanently
empty. Singletons resolve their Studio label via `preview.prepare` instead
(select `title`, fall back to `'Unknown'`). Content/module documents pass
`max` for an editable headline.

**Objects** — `linkRef`, `ctaButton`, `ctaSecondaryButton` and
`socialProfile` (each wrapping a reference to a `link` **document**),
`brand`, `brandTagline` (structured tagline: `items` + a
`BRAND_TAGLINE_SEPARATORS`-driven `separator`), `imageWithAlt` (required alt —
used by `page_post.heroImage`, `blog_author.image`, `brand.logo`,
`openGraph.image`, `block_feature.image` and the hero/CTA modules), `bodyImage` (required alt; optional `layout`
from `IMAGE_LAYOUT`, undefined = Inline — shares its `alt`/hotspot shape with
`imageWithAlt` via the `image-alt-field` helper, but is a distinct type
registered only as `richText`'s body-array image member, so the layout
choice can't leak into hero/avatar/OG/brand images), `seo` (`metaTitle`
required, 30–60 characters; every other field optional and omitted from the
page head when unset — there is no fallback) + `openGraph`,
`proseText` / `richText`, `aside` (deep-dive block type registered in
`richText`'s portable-text array; `kind` from `ASIDE_KIND`, required; `body`
via `proseText`, required — part of the choose-your-depth reading feature,
#957), `postTakeaways` (see `page_post` above), `layout`/`heroLayout` (all-optional
fields, no defaults set at the schema level: `spacingTop`/`spacingBottom`
(`SPACING_SCALE`), `containerWidth` (`CONTAINER_WIDTH`, `layout` only —
`heroLayout` omits it, Hero's grid always manages its own width),
`dividerTop`/`dividerBottom` (boolean) — the two types share their
overlapping fields via `spacingAndDividerFields()` (same
two-named-types-sharing-a-helper pattern as `imageWithAlt`/`bodyImage`), and
are attached to every `module_*` document via the shared `layoutField`/
`heroLayoutField` values; `service`/`apps/web`'s `Section` component decide
unset-vs-set and rendering defaults), `headingBlock` (`heading` (string)
and `supportingText` (text) — neither carries a length cap, forced `max()`
validation having been removed as editor-hostile). There is **one**
registered `headingBlock` type; requiredness is enforced at two levels,
since Sanity never descends into an absent object — the registered type
marks its nested `heading` `required()`, and `headingBlockField()`, which
takes no options, marks the containing field `required()` so that nested
rule always has an object to run against. The heading is
**required on every call site** — every module and every page — so no layer
has to reason about which case it is holding; `module_content` and
`module_hero` carry no `headingBlock` at all, and
alignment is not bundled here — it is a separate module-level
`contentAlignment` field. Every `module_*` document gets its own
standalone, **required** `brandVariant` field (`@blog/config`'s
`BRAND_VARIANT` const) via the shared `brandVariantField()` helper, placed
immediately after `titleField` in each schema's `fields` array (see
"Page-builder modules" above).

**Conventions**

- `defineType`/`defineField`/`defineArrayMember` everywhere; validation
  `rule.required()` on every field the frontend assumes; images get
  `hotspot: true` + required alt. Every schema definition is a **named
  export** (`{localName}Schema`) — never `export default defineType`.
- Enum-ish stored values come from `@blog/config` constants — **both key and
  value UPPERCASE** (`LINK_TYPE.INTERNAL === 'INTERNAL'`,
  `HERO_FIELD_MODE.CUSTOM === 'CUSTOM'`), `as const`; schema `options.list` and
  migrations use the same constant.
- Singletons enforced through desk structure; Studio also groups a top-level
  **Modules** section with one browsable list per module type (Heroes, Post
  Lists, Content, CTAs).
- No migration was needed for the modules-as-documents redesign — datasets
  were recreated clean before this model shipped.

## Migrations & live data (core contract)

Content is live in the `production` dataset. Schema and content are decoupled:
changing a schema does **not** change existing documents.

- Any change altering an _existing_ shape (rename/remove/move a field, rename a
  `_type`, restructure a document) **requires a content migration** — decide
  this before implementing, and surface the plan to the user. Additive,
  optional-only changes need none (say so explicitly).
- Tooling lives in `packages/studio/migrations/` (`README.md`) with helper scripts:
  `migrate:new` (folders are now UTC-timestamped, `YYYYMMDDTHHmm-<slug>`, for
  deterministic run order) / `migrate:dry` / `migrate:run` / `dataset:export`.
- Workflow: **dry-run → dataset export (backup) → human-gated run**. Running
  against `production` is human-gated, like deploys. Migrations must be
  idempotent.
- **`migrate:deploy`** runs only the migrations not yet recorded in a
  per-dataset `migrationState` ledger document (`_id: 'migrationState'`, a
  declared but Studio-hidden schema type — no create/edit/delete actions,
  excluded from the new-document menu), in order:
  dry-run → run (`--no-dry-run --no-confirm`) → append `{id, runAt, sha}` to
  the ledger, stopping on first failure. A second run with nothing new is a
  no-op. `migrate:backfill` records the currently-pending folder migrations as
  applied **without** running them (one-time, per dataset, for migrations that
  predate the ledger). Both need a write token (`SANITY_AUTH_TOKEN` /
  `SANITY_DEPLOY_TOKEN`).
- CI (`Migrations` job) validates every migration loads and — with a read
  token — dry-runs each one read-only. It never mutates data.
- `migrate:deploy --yes` is automated as part of the deploy pipeline: dev runs
  it via `deploy-development.yml`'s `migrate` job on merges to `main` that
  touch `studio` or `web` (an admin-only merge skips it, since neither changed;
  a web-only change still needs the migration), production runs it
  unconditionally via `deploy-production.yml` on a `vX.Y.Z` tag push, after a
  dataset export backup and behind the `production` Environment's
  required-reviewer gate, same as `sanity deploy`. Both commands remain
  available to run manually (e.g.
  `SANITY_STUDIO_DATASET=development pnpm --filter @blog/studio migrate:deploy`) for
  local rehearsal or backfilling a dataset outside the pipeline.
