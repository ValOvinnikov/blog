# CMS Schema & Studio Restructure — Design

**Issue:** #242 — `refactor(cms): revisit + reorganise schema structure and Studio`
**Depends on:** #241 (content-migration tooling — merged/in review) — every `_type`
rename or field move below ships with a migration authored via that tooling.
**Date:** 2026-07-10

## Goal

Revisit the CMS schema and Studio as a whole before the next phase: remove
duplicated shapes, apply a consistent naming convention, adopt a page-template +
modules model for pages, split the `siteSettings` god-object, and lay out the
Studio desk so authors navigate intuitively — all with migrations for the live
`production` content (project `ccs8c2no`).

## Constraints

- Content is **live**. Every change is tagged by migration cost:
  - 🟢 **additive** — new optional field/type, no migration.
  - 🟡 **field rename/move** — data migration + `pnpm typegen` + `@blog/service`
    fragment/transformer updates.
  - 🔴 **`_type` rename** — migrate the `_type` of **every existing document or
    embedded object** of that type, plus every `_type ==` GROQ reference
    downstream. Object `_type` renames (embedded in arrays/fields) are the
    trickiest and often need an export → transform → import rather than an
    in-place patch.
- Layer boundaries hold: schema (`cms`) → typegen → `@blog/service` fragments →
  `@blog/ui` props → `apps/web`. No boundary may be crossed to make a change
  "work".
- `sanity.types.ts` (generated at
  `packages/config/src/sanity/generated/types.ts`) is regenerated and committed
  after schema changes.
- Production migrations are **human-gated** (like `sanity deploy`).

## Decisions (locked with the user)

1. **Naming — documents only** get a `{group}_{name}` `_type` prefix. Shared
   objects keep concise semantic names.
2. **Hero → page template + `modules[]`.** Pages own an ordered module array;
   hero is `module_hero`.
3. **Links unified into one `link` object**, used everywhere including footer
   social (`footer.social: link[]`); `link` gains `openInNewTab` (external only)
   and an optional `platform` (for social glyphs).
4. **Navigation & Footer** become their own top-level Studio singletons.
5. `blog_author.name` stays `name` (documented exception to "primary field =
   title"). `blockText` keeps its name (block-only rich text for bios).
6. **Tags dropped** — `categories` is the single blog taxonomy. `post.tags`
   removed.
7. **SEO/OG** — extract a shared `openGraph` object reused by `seo` and
   `settings_site`.
8. **Brand** — one `brand` object in `settings_site` is the single source for
   header (prefix+suffix) and footer (name).

## Type inventory — before → after

### Documents

| Before (`_type`) | After (`_type`)       | Notes                                     |
| ---------------- | --------------------- | ----------------------------------------- |
| `post`           | `blog_post`           | 🔴 rename + 🟡 drop `tags`, seo→openGraph |
| `author`         | `blog_author`         | 🔴 rename; `name` kept                    |
| `category`       | `blog_category`       | 🔴 rename                                 |
| `homePage`       | `page_home`           | 🔴 rename + 🔴 hero fields → `modules[]`  |
| `page`           | `page_generic`        | 🔴 rename + 🟢 add `seo` + 🔴 `modules[]` |
| `siteSettings`   | `settings_site`       | 🔴 rename + 🟡 split nav/footer out       |
| `link`           | _removed_ → object    | 🔴 document → shared object               |
| —                | `settings_navigation` | 🟢 new singleton (header nav)             |
| —                | `settings_footer`     | 🟡 new singleton (footer nav + social)    |

### Shared objects

| Before (`_type`) | After (`_type`) | Notes                                                         |
| ---------------- | --------------- | ------------------------------------------------------------- |
| `imageWithAlt`   | `image`         | 🔴 rename (embedded across many docs)                         |
| `portableText`   | `richText`      | 🔴 rename (embedded in post/page body)                        |
| `blockText`      | `blockText`     | unchanged (author bio)                                        |
| `seo`            | `seo`           | 🟡 `ogTitle/ogDescription/ogImage`→openGraph                  |
| —                | `openGraph`     | 🟢 new — `{ ogTitle, ogDescription, ogImage }`                |
| `navItem`        | _removed_       | 🔴 fold into `link`                                           |
| `socialLink`     | _removed_       | 🔴 fold into `link`                                           |
| `link` (was doc) | `link` (object) | `{ label, kind, reference \| href, openInNewTab, platform? }` |

### Module blocks (new `module_` group — page-builder)

| `_type`           | Shape                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `module_hero`     | eyebrow/title/subtitle (each source mode + custom), image, actions: `link[]` |
| `module_postList` | title, limit, (optional) explicit posts / featured behaviour                 |
| `module_cta`      | heading, body, actions: `link[]` (scaffold for future pages)                 |

## Object designs

### `openGraph`

```
openGraph (object)
  ogTitle:       string  (max 70)
  ogDescription: text    (max 200)
  ogImage:       image
```

- Inside `seo`: all optional (overrides).
- Inside `settings_site`: `ogImage` required (site-wide fallback), titles
  optional.

### `seo`

```
seo (object)
  metaTitle:       string (required, max 60)
  metaDescription: text   (max 160)
  openGraph:       openGraph
```

### `link`

```
link (object)
  label:        string (required)
  kind:         string, radio: 'internal' | 'external'   (required)
  reference:    reference → (blog_post | blog_category | page_generic)
                 — shown/required when kind === 'internal'
  href:         string (path or URL) — shown/required when kind === 'external'
  openInNewTab: boolean — shown only when kind === 'external'
  platform:     string, dropdown from a predefined SOCIAL_PLATFORMS const
                 (optional) — social platform key; drives the footer social icon
  preview:      label + resolved target (icon from platform when set)
```

`platform` is **not** freeform. It is a `string` field whose
`options.list` comes from a single shared `SOCIAL_PLATFORMS` const (key/value
pairs), so authors pick from a fixed set and the stored value is a stable key
that maps 1:1 to an icon downstream (`@blog/ui` / `apps/web`). Seed set (extend
as needed):

```ts
// apps/cms/src/schema-types/constants/social-platforms.ts
export const SOCIAL_PLATFORMS = [
  { title: 'X (Twitter)', value: 'x' },
  { title: 'GitHub', value: 'github' },
  { title: 'LinkedIn', value: 'linkedin' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'Instagram', value: 'instagram' },
  { title: 'Mastodon', value: 'mastodon' },
  { title: 'Bluesky', value: 'bluesky' },
  { title: 'Facebook', value: 'facebook' },
  { title: 'Threads', value: 'threads' },
  { title: 'RSS', value: 'rss' },
] as const;
```

- The `value` keys are the contract with the presentation layer — the footer
  social renderer maps each key to an icon; adding a platform means adding the
  const entry **and** an icon mapping in `apps/web`/`@blog/ui`.
- `platform` stays optional (a plain external `link` with no platform is still
  valid); the footer only expects it on `settings_footer.social[]`.
- Validation option: `settings_footer.social` may constrain each item to
  `kind === 'external'` with `platform` set, so social entries are always
  icon-resolvable.

### `settings_site` (singleton)

```
settings_site
  brand (object)
    name:   string (required)   — footer wordmark / RSS / default SEO prefix
    prefix: string (required)   — header logo primary (e.g. "val")
    suffix: string             — header logo accent (e.g. ".dev")
    logo:   image (required)
  description: text (required, 50–160) — default meta description
  tagline:     string
  defaultSeo:  openGraph (ogImage required) — social fallback
```

### `settings_navigation` (singleton)

```
settings_navigation
  items: link[]   — header nav
```

### `settings_footer` (singleton)

```
settings_footer
  nav:    link[]   — footer link columns/list
  social: link[]   — social profiles (each link.platform set)
```

### `page_generic` / `page_home` (shared template)

```
page_generic
  title:   string (required)
  slug:    slug (required)
  modules: array of module_* blocks (ordered)
  seo:     seo

page_home  (singleton — documentId 'page_home')
  title:   string (required, internal)
  modules: array of module_* blocks (seeded: module_hero, module_postList)
  seo:     seo
```

The 8 flat `heroXxxMode`/`heroXxx` fields on the old `homePage` migrate into a
single `module_hero` instance (the source-mode radios and custom fields move
verbatim into the module). `latestPostsTitle`/`latestPostsLimit` → `module_postList`.

## Studio desk layout

```
Content
├─ Pages
│   ├─ Home Page            (singleton → page_home)
│   └─ Generic Pages        (page_generic collection)
├─ Blog
│   ├─ Posts                (blog_post)
│   ├─ Categories           (blog_category)
│   └─ Authors              (blog_author)
├─────────
├─ Navigation              (singleton → settings_navigation)
├─ Footer                  (singleton → settings_footer)
└─ Site Settings           (singleton → settings_site)
```

- `link` no longer appears as a collection (it is an inline object).
- Singletons pinned via fixed `documentId`; consistent lucide icons + previews
  on every document (adds previews to `blog_category`, `page_generic`).

## Naming conventions (written down — point 6)

- **Document `_type`:** `{group}_{name}`, snake-prefixed group, camel name:
  `page_home`, `blog_post`, `settings_navigation`.
- **Module `_type`:** `module_{name}` (`module_hero`).
- **Shared object `_type`:** concise semantic camelCase (`seo`, `openGraph`,
  `link`, `image`, `richText`, `blockText`).
- **Fields:** camelCase; primary display field is `title` on every document
  **except `blog_author`** (uses `name`). Symmetric action fields use `link`
  (no `xxxLabel` scalars). Booleans read as flags (`featured`, `openInNewTab`).

## Downstream impact (`@blog/service`, `@blog/ui`, `apps/web`)

`packages/service/src/shared/fragments/` mirrors most of these shapes and must
update in lockstep with each rename:

- `image.ts`, `seo.ts`, `social-link.ts`, `link.ts`, `author.ts`, `category.ts`,
  `post.ts` fragments + their transformers.
- GROQ `_type ==` / projection field names change with each 🔴 rename.
- `home` query moves from flat hero fields to `modules[]` projection (largest
  service change).
- Generated types consumed downstream (`ISanityImage`, `TSeoMeta`, `TPostCard`,
  `THomePage`, `PortableText`/`BlockText`, `TSocialLink`, `TCategory`) rename;
  `@blog/ui` prop names follow.

Each is handled by the owning subagent (`service`, `ui`, `web`) in dependency
order after the `cms` layer + typegen land.

## Migration & implementation sequence

Implemented in dependency order, **cheapest/safest first**, each schema change
paired with a migration (dry-run → backup → human-gated run) and typegen:

1. 🟢 **Additive, no migration:** add `openGraph` object; add `seo` to
   `page` (still `page`); add `module_*` + `link` object types (unused yet).
2. 🟡 **SEO/OG move:** `seo.og*` → `seo.openGraph.*`; `siteSettings` og fields
   → `defaultSeo`/`openGraph`. Migration + typegen + service `seo` fragment.
3. 🟡 **Brand + siteSettings split:** introduce `brand`; extract
   `settings_navigation` + `settings_footer` (create the two singleton docs and
   move `navigation`/`socialLinks` into them). Migration copies array data.
4. 🔴 **Links unification:** migrate `navItem`/`socialLink`/`link`-doc data into
   the `link` object shape across nav, footer, hero/page actions.
5. 🔴 **Pages → modules:** migrate `homePage` hero + latest-posts fields into
   `page_home.modules[]`; give `page_generic` a `modules[]` body.
6. 🔴 **`_type` renames:** object renames (`imageWithAlt→image`,
   `portableText→richText`) then document prefixes (`post→blog_post`, …). These
   are the highest-risk; do them last, one type per migration, export-backed.
7. Regenerate `sanity.types.ts`; update `@blog/service` → `@blog/ui` →
   `apps/web`; run full `type-check | lint | test | web build`.

> **Note on ordering vs churn:** the 🔴 `_type` renames could alternatively be
> done first to avoid re-touching fragments twice. The plan step will pick the
> concrete order that minimises rework; this sequence favours landing low-risk
> value early and isolating the risky `_type` migrations at the end.

## Deferred to a later phase (not built here)

- `blog_series` document (ordered post series).
- `post.readingTime` / `post.updatedAt` for richer SEO/JSON-LD.
- `blog_category.color`/icon for UI theming.
- A `redirects` document for slug changes (pairs with migration tooling).
- Additional `module_*` blocks for the full page builder.

## Acceptance criteria (from #242)

- [x] A short spec proposing the revised schema/Studio structure (reuse map,
      grouping, naming, desk layout) — this document.
- [ ] Implementation follows, with migrations for any change touching existing
      content and regenerated `sanity.types.ts`.
- [ ] `pnpm type-check | lint | test` green; Studio navigates cleanly.

## Open risks

- Object `_type` renames on embedded content (`image`, `richText`) are the
  riskiest migrations — validate each with `--from-export` dry runs against a
  fresh `production` export before any live run.
- This is a large multi-layer refactor. The implementation plan will decompose
  it into independently shippable PRs (likely: additive+SEO; siteSettings split;
  links; pages/modules; `_type` renames) rather than one mega-PR.
