# Post taxonomy — dedicated category + tags system

> **Archived — implemented.** See SPEC.md §6. Content model for current behavior.

- **Status:** Design (approved in brainstorm; pending spec review)
- **Date:** 2026-07-22
- **Epic:** #674
- **Builds on:** #627 (Article compound; moved categories to the header
  eyebrow and freed the `TagList` molecule)

## Problem

A post's `categories` field (a required array of `blog_category` references)
currently does double duty: the post's **section** (navigation/archive) _and_
its **topics**. That conflation produced the "category shown twice" redundancy
#627 had to resolve. We want two purpose-built axes:

- **Category** — the post's _section_. Curated, finite. Drives the eyebrow
  kicker, `/category/*` archive, breadcrumbs.
- **Tags** — granular _topics_. Drive `/tag/*` pages, related-posts, a chip
  list at the end of the article, and per-tag feeds.

## Decisions

| Question                  | Decision                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Tag discovery depth       | **Full** — chip list + `/tag/*` archive + related-posts + per-tag RSS + sitemap                                 |
| Category cardinality      | Bounded array, **min 1, max 4**; **primary = `categories[0]`** (drives eyebrow/breadcrumb/canonical)            |
| Tag model                 | **Reference `blog_tag` document** (not free-text strings)                                                       |
| `blog_tag` fields         | `title` (req), `slug` (req), `description` (opt), `seo` override (opt)                                          |
| Tag cardinality on a post | **min 0, max 6** (raise later; additive)                                                                        |
| Related-posts             | **Shared-tags, ranked** — top 3 by shared-tag count, newest tiebreak, fallback to same-primary-category recents |
| Tag chip placement        | New **`Article.Footer`** compound slot owns the `TagList`                                                       |
| Migration                 | **None** — clean-dataset policy (datasets recreated 2026-07-12); all changes additive                           |

## Content model — `cms` + `config`

### New `blog_tag` document

```
title       string   required, ≤60 chars
slug        slug      required, generated from title
description text      optional, ≤300 chars  → archive intro + meta description
seo         object    optional              → reuse the shared SEO object
                                              (same schema post/category use via
                                               the resolve-seo transformer)
```

- Named export `tagSchema` (per repo convention: `{localName}Schema`, never
  `export default defineType`).
- Mirrors `blog_category` in shape and desk placement.

### `post` document changes

- `categories`: add `max: 4` to the existing `min: 1` validation. Author order
  is meaningful — `categories[0]` is the primary section.
- **New** `tags`: `array` of references to `blog_tag`, `min 0, max 6`, optional.

### Hero interaction

`HERO_FIELD_MODE.POST_CATEGORY` already reads `heroPost.categories[0].title`
(`packages/service/src/features/modules/hero/adaptor/transformer.ts`) — the
primary-category rule matches it, so no Hero change is needed.

### `config`

- `routes.tag(slug, page = 1)` builder mirroring `routes.category` (page 1 →
  `/tag/<slug>`; page N → `/tag/<slug>/page/<n>`).
- `blog_tag` `_type` stored-value constant following the existing category
  `_type` constant pattern (UPPERCASE key/value, `as const`, in `@blog/config`).

### Migration

None. Datasets were recreated clean on 2026-07-12; `tags` is purely additive,
and the `categories` `max: 4` constraint is satisfied by re-seeding. State this
explicitly in the cms PR.

## `service`

- **`tag` feature**, mirroring the `category` feature's role-based slice layout
  (post-#345 naming — `adaptor/detail-page/`, `adaptor/detail-page-params/`):
  - **detail-page adaptor** — fetch a tag by slug plus its paginated published
    posts → powers `/tag/<slug>`.
  - **list loader** — all tag slugs (for sitemap + feed generation).
- **Related-posts query** — input: the current post's tag `_id`s. Return up to
  3 _other_ published posts, ranked by count of shared tags (GROQ intersection),
  newest `publishedAt` as tiebreak. When fewer than 3 qualify, fill from recent
  published posts in the post's **primary category** (`categories[0]`),
  excluding the current post and any already chosen.
- Post-detail projection adds `tags` (`_id`, `title`, `slug.current`) alongside
  `categories`. Every groqd field's nullability explicit (`.notNull()` /
  `.nullable(true)`); view-models expose `T | undefined` where optional.

## `ui` — `packages/ui`

- **Repurpose `TagList`** (orphaned after #627 moved categories to the eyebrow)
  to render real tags as a chip list of `{ label, href }` with a polymorphic
  `linkAs`. No hardcoded anchors; classes via a co-located `*-variants.ts`.
- **New `Article.Footer` compound part** — renders the `TagList` (and is the
  home for any future end-of-article furniture). Added to the Article compound's
  `mapCompoundSlots` parts so it composes context-free like `Article.Header` /
  `Article.Body`. Rendered after `Article.Body`.
- Tag archive pages + related-posts reuse the existing `PostsSection`,
  `PostGrid`, and `Pagination` organisms — no new list primitives.
- Co-located tests + Storybook stories for the repurposed `TagList` and
  `Article.Footer` (both required per `ui-library-practices` / `ui-storybook`).

## `web` + SEO — `apps/web`

- **Routes** (mirror the category routes exactly):
  - `/tag/[slug]/page.tsx`
  - `/tag/[slug]/page/[page]/page.tsx`
  - Each with `generateMetadata` (canonical, OG, Twitter — using the tag
    `description`/`seo`) and ISR `next: { revalidate, tags }`.
- **Post page** (`blog-post-page.tsx`): pass `tags` into `Article.Footer`'s
  `TagList` (`linkAs={SmartLink}`, `href = routes.tag(slug)`), and render a
  "Related" `PostsSection` from the related-posts query.
- **Feeds & sitemap**:
  - `sitemap.ts` includes every tag archive URL.
  - Per-tag RSS at `/tag/[slug]/rss.xml/route.ts`, mirroring the existing feed
    route. Main feed unchanged.
  - Post `BlogPosting` JSON-LD gains `keywords` from the post's tag titles.

## Curation guidelines (ships in the spec / studio help text)

- **Category = section**: 1–4 per post, from a small curated set; the first is
  primary. **Tags = topics**: granular, freely reused across sections.
- A tag must not duplicate a category name — they are different axes.
- Keep the tag vocabulary controlled: prefer reusing an existing `blog_tag` over
  minting a near-duplicate (reference documents make this natural).

## Decomposition — epic #674 → one sub-issue per layer

Dependency order **config → cms → service → ui → web**. Each is a per-layer PR
that merges to `main` green on its own (all changes are additive), so they split
cleanly. Only the final (web) PR carries `Closes #674`; earlier layer PRs
reference it without a closing keyword.

1. **config** (`layer:config`, `tooling`): `routes.tag` builder + `blog_tag`
   `_type` constant.
2. **cms** (`layer:cms`): `blog_tag` schema (`title`/`slug`/`description`/`seo`),
   `post` `tags` field + `categories` `max: 4`, desk placement, `pnpm typegen`
   (commit regenerated types). No migration.
3. **service** (`layer:service`): `tag` feature (detail-page + list), the
   related-posts query, post-detail `tags` projection. Co-located tests.
4. **ui** (`layer:ui`): repurpose `TagList` for tags, add `Article.Footer`,
   tests + stories.
5. **web** (`layer:web`): `/tag/*` routes + metadata, post-page tag chips +
   related-posts section, sitemap + per-tag RSS, JSON-LD `keywords`.
   `Closes #674`.

## Out of scope / future (YAGNI for now)

- Tag `color`/`accent` theming and `featured`/`order` fields (no consumer yet).
- An "all tags" index page / tag cloud.
- Tag-following, tag-based email digests, or tag merge tooling.
