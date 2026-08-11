# Content model

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §6. Update this file (not a duplicate) whenever
> the Sanity schema changes shape.

Source of truth: `apps/cms/src/schema-types/` (documents grouped `blog/`,
`pages/`, `settings/`; shared `objects/`; `modules/` — standalone,
cross-referenceable page-builder documents, not embedded objects). Naming
convention `{group}_{name}` is being applied incrementally (#251):
`settings_navigation`, `settings_footer`, `page_home`, `page_generic`, and
every `module_*` document are done; `siteSettings` still carries a legacy
name.

**Modules are documents, not embedded objects** — pages reference them by
`_ref`, so a module is independently listable, previewable, and reusable
across pages (Studio's built-in **Incoming references** view shows which
pages use a given module before it's edited or deleted). `MODULE_TYPE`
(`packages/config/src/constants/module.ts`) is the single source of truth for
the module type registry; every layer (cms schema list, `service.modules`
namespace, web `MODULE_MAP`) derives from it, so omitting a type from one is a
compile error or an obvious gap, not a silent drift — `MODULE_MAP`'s one
intentional exception is `module_hero` (see [`data-flow.md`](./data-flow.md)),
excluded because it's schema-forbidden from ever appearing in a `modules[]`
array.

**Module documents** (`apps/cms/src/schema-types/modules/`)

- `module_hero` (`heroSchema`) — internal `title`, `featuredPost` (ref to
  `post`, warning-only — falls back to the newest featured post), four
  mode/custom field pairs (`heroEyebrow`, `heroTitle`, `heroSubtitle`,
  `heroImage`) built via the `defineModeFieldPair` helper and driven by the
  UPPERCASE `HERO_FIELD_MODE` const (`CUSTOM`/`NONE`/`POST_CATEGORY`/
  `POST_TITLE`/`POST_EXCERPT`/`POST_IMAGE`), `primaryActionLabel`,
  `secondaryAction` (`link`).
- `module_postList` (`postListSchema`) — internal `title` (display heading),
  `limit` (posts to fetch, 1–12).
- `module_content` (`contentSchema`) — internal `title`, `body` (portable
  text).
- `module_cta` (`ctaSchema`) — internal `title`, `heading`, `text`, `action`
  (`link`, required).
- `module_newsletter` (`newsletterSchema`) — internal `title`, `heading`
  (required, max 80), `description` (optional, max 300). `heading`/
  `description` come from the shared `newsletterContentFields()` helper
  (`schema-types/helpers/newsletter-content-fields.ts`), reused by
  `settings_newsletter` below.

Every module document gets a required internal `title` via the reusable
`titleField` helper (§ below) so it's listable/previewable in Studio
independent of its display fields, immediately followed by a **required**
`brandVariant` field via the shared `brandVariantField()` helper
(`schema-types/helpers/brand-variant-field.ts`) — stored values from
`@blog/config`'s `BRAND_VARIANT` const, `PRIMARY`/`SECONDARY` by default;
`module_hero` passes the wider `BRAND_PRIMARY`/`PRIMARY`/`SECONDARY` option
list. Every module document also gets an optional `appearance` field via the
shared `appearanceField` value (`schema-types/helpers/appearance-field.ts`)
— see the `appearance` object below.

**Page documents reference modules**

- `page_home` (`homeSchema`, singleton) — `titleField` (internal Studio label;
  `preview.prepare` falls back to the generic "Unknown" when unset), `hero`
  (single **required**
  reference to a `module_hero`, kept
  separate from the module list — it always renders first), `modules` (array of
  references via `defineModulesField({ allow: [MODULE_TYPE.POST_LIST,
MODULE_TYPE.CTA, MODULE_TYPE.NEWSLETTER] })`), `seo`.
- `page_generic` (`genericSchema`) — `title`, `slug` (source: title),
  `modules` (array of references via `defineModulesField({ allow:
[MODULE_TYPE.CONTENT, MODULE_TYPE.CTA] })`), `seo`.
- `page_blog` (`blogPageSchema`, singleton) — the `/blog` index page config:
  `titleField` (internal Studio label; `preview.prepare` falls back to the
  generic "Unknown" when unset), `heading` (the page `<h1>`), `supportingText`
  (optional line under it), `itemsPerPage` (number, 1–24, drives the
  pagination window size), `modules` (array of references via
  `defineModulesField({ allow: [MODULE_TYPE.POST_LIST, MODULE_TYPE.CTA,
MODULE_TYPE.NEWSLETTER] })`, optional — editors opt a newsletter-signup
  module (or others) into this page rather than it being hardcoded), `seo`.

`defineModulesField({ allow, description? })`
(`schema-types/helpers/define-modules-field.ts`) builds the `modules` array
field's `of` from the allowed `TModuleType[]`, one strong `reference` array
member per allowed type — the single place that field shape is defined,
replacing a hand-duplicated block per page document.

**Other documents**

- `post` — title, slug, excerpt, heroImage (`imageWithAlt`, **optional** — a
  post without one renders imageless rather than 404ing), author (ref),
  category (ref → `category`, required — the post's single primary
  classification), tags (refs → `tag`, optional, max 6), publishedAt, body
  (portable text incl. code blocks and `aside` blocks), featured,
  `newsletterEnabled` (boolean, default `true` — per-post opt-out of the
  newsletter-signup form shown on its post page), seo, skim
  (`skim` object, **optional** — `takeaways` (3-7 items, each max 160 chars),
  `generatedAt`/`model` read-only in Studio; pipeline-populated for the
  choose-your-depth reading feature, #957).
- `author` — name, slug, image, bio, role, socialLinks (unified `link`-based).
- `category` — title, slug, description.
- `tag` — title, slug, description, seo (topic taxonomy for posts; drives the
  `/tag` archives + related-posts, alongside the section-level `category`).
- `siteSettings` (singleton) — `titleField` (bare; see helper note below),
  brand
  (`brand` object: name/prefix/suffix/logo/specLine/variant — `specLine` is
  a `specLine` object, `{ items: string[] (max 4, each max 15 chars),
separator: SPEC_LINE_SEPARATORS }`, replacing a plain string so the
  service layer can join it with a chosen separator glyph), description,
  tagline, `defaultOgImage` (`imageWithAlt`, required — the last-resort
  social image).
- `settings_navigation` (singleton) — `titleField` (bare; see helper note
  below), items (links).
- `settings_footer` (singleton) — `titleField` (bare; see helper note below),
  social links.
- `settings_newsletter` (singleton) — `titleField` (bare; see helper note
  below), `heading` (required, max 80), `description` (optional, max 300) —
  the CMS-authored source of the newsletter form's copy wherever it's
  rendered outside the `module_newsletter` page-builder placement (e.g. the
  per-post compact form gated by `post.newsletterEnabled`). Lives in the
  desk's **Blog** section, directly after Authors, not the top-level
  Settings group.

**Reusable `titleField` helper** (`schema-types/helpers/title-field.ts`) —
`titleField({ initialValue?, readOnly?, description?, max? })` returns a
required `defineField({ name: 'title', type: 'string', … })`. Keep it **bare**
for singletons: a fixed `initialValue` + `readOnly: true` does **not** fix the
Studio "Untitled" heading — `initialValue` doesn't fire for a singleton
opened by `documentId`, and `readOnly` then leaves the field permanently
empty. Singletons resolve their Studio label via `preview.prepare` instead
(select `title`, fall back to `'Unknown'`). Content/module documents pass
`max` for an editable headline.

**Objects** — `link` (unified internal/external, `LINK_TYPE` const),
`socialLink`, `brand`, `specLine` (structured spec-line: `items` + a
`SPEC_LINE_SEPARATORS`-driven `separator`), `imageWithAlt` (required alt —
used by `heroImage`, `author.avatar`, `brand`, `openGraph.image`, and
site-settings favicon/logo), `bodyImage` (required alt; optional `layout`
from `IMAGE_LAYOUT`, undefined = Inline — shares its `alt`/hotspot shape with
`imageWithAlt` via the `image-alt-field` helper, but is a distinct type
registered only as `richText`'s body-array image member, so the layout
choice can't leak into hero/avatar/OG/brand images), `seo` (all-optional
override bag) + `openGraph`,
`blockText` / `richText`, `aside` (deep-dive block type registered in
`richText`'s portable-text array; `kind` from `ASIDE_KIND`, required; `body`
via `blockText`, required — part of the choose-your-depth reading feature,
#957), `skim` (see `post` above), `appearance` (five all-optional fields, no
defaults set at the schema level: `spacingTop`/`spacingBottom`
(`SPACING_SCALE`), `containerWidth` (`CONTAINER_WIDTH`), `align` (`ALIGN`),
`divider` (boolean) — attached to every `module_*` document via the shared
`appearanceField` value; `service`/`apps/web`'s `Section` component decide
unset-vs-set and rendering defaults). Background is no longer part of
`appearance` — every `module_*` document instead gets its own standalone,
**required** `brandVariant` field (`@blog/config`'s `BRAND_VARIANT` const)
via the shared `brandVariantField()` helper, placed immediately after
`titleField` in each schema's `fields` array (see "Page-builder modules"
above).

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
- Tooling lives in `apps/cms/migrations/` (`README.md`) with helper scripts:
  `migrate:new` (folders are now UTC-timestamped, `YYYYMMDDTHHmm-<slug>`, for
  deterministic run order) / `migrate:dry` / `migrate:run` / `dataset:export`.
- Workflow: **dry-run → dataset export (backup) → human-gated run**. Running
  against `production` is human-gated, like deploys. Migrations must be
  idempotent.
- **`migrate:deploy`** runs only the migrations not yet recorded in a
  per-dataset `migrationState` ledger document (`_id: 'migrationState'`, a
  system doc — not a Studio schema type, never part of typegen), in order:
  dry-run → run (`--no-dry-run --no-confirm`) → append `{id, runAt, sha}` to
  the ledger, stopping on first failure. A second run with nothing new is a
  no-op. `migrate:backfill` records the currently-pending folder migrations as
  applied **without** running them (one-time, per dataset, for migrations that
  predate the ledger). Both need a write token (`SANITY_AUTH_TOKEN` /
  `SANITY_DEPLOY_TOKEN`) and remain **manual, local-only commands today** — no
  CI workflow invokes them yet.
- CI (`Migrations` job) validates every migration loads and — with a read
  token — dry-runs each one read-only. It never mutates data.
- Future: a gated post-merge workflow that runs `migrate:deploy` against
  `production` automatically (write token, durable backup, release ordering
  vs. the Vercel web deploy) — designed in
  `docs/superpowers/specs/2026-07-10-migration-deployment-automation-design.md`
  (#261, rollout steps 4–5); steps 1–3 (timestamped ids, the ledger,
  `migrate:deploy`/`migrate:backfill`) are implemented and usable locally
  today, e.g. `SANITY_STUDIO_DATASET=development pnpm --filter cms migrate:deploy`.
