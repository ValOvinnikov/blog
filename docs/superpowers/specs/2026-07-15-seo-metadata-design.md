# SEO / metadata end-to-end design (#355)

**Date:** 2026-07-15
**Issue:** [#355 — SEO/metadata: revisit end-to-end flow (CMS → service → web)](https://github.com/ValOvinnikov/blog/issues/355)
**Status:** Approved design, pending implementation plan

## Problem

Route metadata is assembled in the web layer by pairing a page fetch with a
settings fetch and merging them through long `??` fallback chains, duplicated
across routes. The "page SEO → site settings → literal" resolution policy is
business logic living in components. Known latent bug: when a page is
unauthored, the home title resolves to `brand.name` and the layout template
re-appends `| Brand` → "Brand | Brand". The blog index title is hardcoded
(`'Blog'`) with a TODO.

## Decisions

1. **Fallback ladder: authored SEO → content-derived → site defaults.**
   Authored `seo` values always win; otherwise metadata derives from the
   content itself (post title/excerpt/hero image, blog heading); site settings
   are only the final safety net. Every URL always ships complete metadata;
   editors rarely need to touch SEO.
2. **The `seo` object becomes a pure override bag — all fields optional.**
   `metaTitle` loses its `required()` (an editor can override only the
   description without retyping the title). Max-length validations stay.
3. **Site settings keep a thin default layer only.** Keep `description`
   (last-resort meta description; also feeds RSS). Replace `defaultSeo`
   (openGraph object) with `defaultOgImage` (`imageWithAlt`, required).
   `defaultSeo.ogTitle` / `ogDescription` are removed — they can never win the
   ladder once content always resolves, and `brand.name` already drives the
   title template.
4. **Resolution lives in the service layer.** Web consumes a fully-resolved
   `seo` view-model and maps it to Next `Metadata` with one shared helper.
5. **Scope:** home, blog index (paginated), and the upcoming post detail route
   (`/blog/{slug}`). The generic page route adopts the same contract when it
   is built (out of scope here).
6. **`post.mainImage → heroImage` rename is a separate chore ticket that
   lands first**, so the SEO resolver is written once against `heroImage`.

## 1 — Content model (CMS)

- `seo` object (`apps/cms/src/schema-types/objects/seo.ts`): `metaTitle`,
  `metaDescription`, `openGraph` all optional. Field descriptions reworded as
  "overrides — leave empty to use the page content".
- `seo` stays an **optional** field on `page_home`, `page_blog`,
  `page_generic`, `post`.
- `settings_site` (`.../settings/site-settings.ts`):
  - unchanged: `title`, `brand`, `description` (required), `tagline`;
  - `defaultSeo` (openGraph) → **`defaultOgImage`** (`imageWithAlt`,
    required). Description: "Fallback social-sharing image used when a page
    has no own OG image."
- After the schema change: `pnpm typegen`, commit regenerated types.

### Migration notes

- `metaTitle` required → optional is a relaxation: **no migration**.
- `defaultSeo` → `defaultOgImage` touches exactly one singleton document:
  re-author manually in Studio (copy the existing `defaultSeo.ogImage` into
  `defaultOgImage`, publish). Human-gated; no scripted migration.

## 2 — Service contract

New shared resolver `resolveSeo` in
`packages/service/src/shared/transformers/`, replacing `toSeoMeta`:

```ts
type TSeoResolved = {
  title: string; // page-part only; the web layout owns the "| Brand" template
  description: string;
  ogTitle: string; // defaults to title
  ogDescription: string; // defaults to description
  ogImageUrl: string; // authored → content image → settings default
};

function resolveSeo(
  authored: TRawSeo | undefined,
  content: TSeoContentDefaults, // { title, description?, imageUrl? }
  settings: TSeoSettingsDefaults, // { description, defaultOgImageUrl }
): TSeoResolved;
```

The ladder is applied **per field, once, here**. Content defaults per route:

| Route      | title default | description default    | image default    |
| ---------- | ------------- | ---------------------- | ---------------- |
| home       | `brand.name`  | `settings.description` | `defaultOgImage` |
| blog index | `heading`     | `settings.description` | `defaultOgImage` |
| post       | `post.title`  | `excerpt`              | `heroImage`      |

- Every field of `TSeoResolved` is non-optional: `title`/`description` always
  resolve (settings fields are schema-required), and `ogImageUrl` bottoms out
  at the required `defaultOgImage`.
- Each page loader (`getHomePage`, `getIndexPage`, `getPostBySlug`)
  internally awaits `getSiteSettings()` and returns `seo: TSeoResolved` on its
  view-model — the optional `seo?: TSeoMeta` fields disappear. The nested
  settings call is effectively free: service fetches go through the Next data
  cache (`revalidate: 3600` + tags), and the layout already fetches settings
  in the same request.
- If the settings fetch fails, the loader's `Result` errors. The layout
  already `notFound()`s on settings failure, so this adds no new failure mode.

## 3 — Web consumption

One shared helper `apps/web/src/metadata/to-metadata.ts`:

```ts
function toMetadata(
  seo: TSeoResolved,
  opts: {
    canonical: string;
    ogType: 'website' | 'article';
    titleAbsolute?: boolean;
  },
): Metadata;
```

Maps the resolved object to `title`, `description`, `alternates.canonical`,
`openGraph` (title/description/images/type), and `twitter`
(`summary_large_image`).

Per route:

- **Home**: `titleAbsolute: true` → `title: { absolute: seo.title }`. The
  resolved home title _is_ the brand (or an authored override), so the layout
  template must not re-append `| Brand` — this fixes the "Brand | Brand" bug.
- **Blog index**: base title from resolved seo; web appends the `– Page N`
  suffix for page ≥ 2 (presentation/i18n concern, moves to messages under
  #321). Self-canonical rule preserved: page N → `/blog/page/N`, **never**
  `/blog` (spec do-not-change rule). The hardcoded `'Blog'` title TODO dies.
- **Post detail** (`/blog/{slug}`, upcoming): `ogType: 'article'` plus
  `openGraph.publishedTime` / `authors` from the post view-model.
- **Layout**: unchanged — `title.default` / `template` (`%s | Brand`) +
  `description` from settings.
- **Dual-fetch justification (per #355 acceptance criteria):**
  `generateMetadata` reuses the _same_ loader call as the page render
  (`getIndexPage`, `getHomePage`, …); Next dedupes it via the data cache, so
  the page payload costs nothing extra. A dedicated lightweight SEO-only query
  would be a _different_ query and therefore a real additional round-trip —
  explicitly rejected.

## 4 — Testing

- `resolveSeo` unit tests own the ladder: every rung per field (authored wins;
  content fills; settings bottom out; ogTitle/ogDescription default to
  title/description).
- Per-feature transformer tests updated (home, blog index, post detail) for
  the new `seo: TSeoResolved` shape.
- Web: `toMetadata` unit tests (canonical, ogType, absolute title) and
  blog-list metadata tests (page 1 vs page N title + self-canonical).

## Rollout / PR strategy

1. **Chore PR first:** `post.mainImage → heroImage` rename (schema + typegen,
   service fragment/view-models, UI/web consumers; check whether production
   posts need a `sanity/migrate` transform — dry-run → backup → human-gated).
2. **SEO refactor: one PR.** Making `metaTitle` optional flips the generated
   types and breaks `seoFragment`'s `.notNull()`, so CMS + service + web
   cannot merge separately and stay green.
3. `SPEC.md` updated in the same PR (content model + layer contract change).

## Out of scope

- Generic page route (`/{slug}`) — adopts this contract when built.
- Sitemap, robots, RSS — unchanged (RSS keeps reading `settings.description`).
- JSON-LD structured data — separate concern.
- Translated metadata / i18n messages (#321).
