# Single category per post — design spec

**Epic:** #809 (follow-up to closed #674, which introduced the current
`categories` + `tags` two-axis system but kept `categories` multi-value)

## Problem

`apps/cms/src/schema-types/documents/blog/post.ts`'s `categories` field
(required array, max 4, references `blog_category` documents) is redundant
with `tags` (optional array, max 6) — both are structurally the same shape
(array of references to a taxonomy document type), differentiated only by
convention and cap. `categories` should become the post's single primary
classification; `tags` already fully owns the multi-value/freeform discovery
case.

Every consumer of the plural `categories` shape already treats it as
effectively single-valued in practice: `categories[0]` is the eyebrow link on
the post page, the hero module's eyebrow fallback, and the card badge in
`PostsSection`. The only place the array is genuinely iterated is
`PostMeta`'s "overflow" categories (`categories.slice(1)`) — which, once every
post has exactly one category, is always empty.

## Decisions

1. **Field name:** `categories` → `category` (single required `reference`).
   `TCategoryPage.category` (the category-page view-model, an unrelated
   concept — the category document being _displayed_ on `/category/[slug]`,
   not a post's own field) uses the same word in a different, unrelated
   module; scoped types make this a non-issue.
2. **Migration selection rule:** automatic — `category = categories[0]` for
   every existing post, no manual editorial review. This codifies what the
   codebase already treats as the de facto primary category everywhere it
   only shows one.
3. **PostMeta cleanup:** remove `categories`/`IPostMetaProps.categories` and
   its rendering block entirely from `packages/ui`'s `PostMeta` — it only
   ever received the now-impossible overflow.
4. **Article.Header keeps its category eyebrow** (simplified from an array to
   a single optional `category` object) — until a follow-up ticket replaces
   it with real breadcrumbs. That follow-up is filed separately, out of this
   epic's scope.

## Schema (cms)

`post.ts`: `categories` (array, max 4, required) → `category` (single
`type: 'reference'`, `to: [{ type: categorySchema.name }]`,
`validation: rule => rule.required()`). `tags` untouched.

## Migration (cms)

New migration via `pnpm --filter cms migrate:new "categories-to-single-category"`
(timestamp-prefixed folder, `defineMigration`/`migrate.document` handler
per `apps/cms/migrations/README.md`). Transform: `category = categories[0]`,
unset `categories`. Idempotent — a document with no `categories` field is a
no-op. Dry-run → backup → human-gated run, same as every other migration in
this repo. Transform + idempotency tests land in **#264** (already has a
checklist line reserved for this migration, added when #809 was filed).

## Service layer (`packages/service`)

Every place a `categories` array/query touches the _post_ shape becomes
singular:

- Fragments — `packages/service/src/shared/fragments/post.ts`,
  `archive-post-card.ts`: `categories[]{...}` → `category->{...}`.
- Transformers — `to-post-card.ts`, `to-archive-post-card.ts`, post-detail
  `transformer.ts`: `TPostCardCategory[]` → single `TPostCardCategory`; drop
  the `.map()`.
- `features/pages/post/adaptor/detail/loader.ts`:
  `primaryCategoryId = raw.categories[0]?._id` → `raw.category._id` (required
  field now, no optional chaining needed).
- `features/pages/post/adaptor/related/query.ts`:
  `'$categoryId in categories[]->_id'` → `category._ref == $categoryId`.
- `features/pages/category/adaptor/detail-page/posts.query.ts`:
  `'$slug in categories[]->slug.current'` → `category->slug.current == $slug`.
- `features/modules/hero/adaptor/transformer.ts`:
  `heroPost?.categories[0]?.title` → `heroPost?.category?.title`.

**Out of scope** (lists the category _taxonomy_, unrelated to a post's own
field): `service.entities.categories.v1.getCategories()` and the
category-page/topics-page GROQ paths.

## UI layer (`packages/ui`)

- `PostMeta`/`IPostMetaProps` (`molecules/post-meta/post-meta.tsx`): remove
  `categories` and its rendering block.
- `Article.Header`/`IArticleHeaderProps`
  (`organisms/article/components/header/article-header.tsx`): simplify
  `categories?: IArticleHeaderCategory[]` → single optional
  `category?: IArticleHeaderCategory`; still renders as the eyebrow above the
  title.
- `PostsSection`/`IPostCardData` (`organisms/posts-section/posts-section.tsx`):
  `categories: IPostCardCategoryData[]` → single `category`; drop the
  `post.categories[0]?.title` indexing.

**Out of scope:** `CategoryChipList` (renders the full category taxonomy for
nav, unrelated to a post's field).

## Web layer (`apps/web`)

- `components/pages/blog-post-page/blog-post-page.tsx`: drop
  `primaryCategory = categories[0]` and the `categories.slice(1)` PostMeta
  plumbing — `category` passes straight through to `Article.Header`.
- `utils/to-post-list-items.ts`: copies `post.category` singular instead of
  the array.

**Out of scope:** `sitemap.ts`, `topics-page.tsx`, `get-categories-safely.ts`
— taxonomy listing, unaffected.

## PR structure

**Single combined PR, not per-layer PRs.** Renaming `categories` → `category`
in the schema changes the generated type shape; if cms merged to `main` alone,
`pnpm type-check` on `service` (and everything downstream) reds immediately —
this is exactly the "partial merge breaks the build" carve-out in
`CLAUDE.md`'s "Prefer per-layer PRs" section. Ticket structure still gets one
epic + one sub-issue per layer (cms/service/ui/web) per this repo's ticketing
convention, but they land as one PR closing all four sub-issues + the epic.

## Out of scope (follow-up ticket, filed separately)

Replace `Article.Header`'s category-eyebrow pattern with real breadcrumbs;
drop the singular `category` eyebrow prop then.
