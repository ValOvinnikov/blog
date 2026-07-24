# Single category per post — Implementation Plan

> **Execution model:** this repo's own layer-agent dispatch (`develop-feature`
> skill), not generic `subagent-driven-development`/`executing-plans` — each
> task below is dispatched wholesale to its scoped subagent
> (`cms`/`service`/`ui`/`web`) in dependency order, and reviewed as one diff
> per `code-review-practices`. This is `CLAUDE.md`'s mandated delegation
> model for this repo and takes precedence over the generic per-step
> subagent flow.

**Goal:** Narrow the post's `categories` (required array, max 4) to a single
required `category` reference, migrate existing content, and update every
consumer across cms/service/ui/web.

**Architecture:** One breaking schema change propagated through the four
layers that already touch the post's categories. Lands as a **single combined
PR** — the schema rename changes the generated type shape, so splitting into
per-layer PRs would red `type-check` on `main` the moment cms merges alone
(the `CLAUDE.md` "partial merge breaks the build" carve-out).

**Tech Stack:** Sanity Studio v6 (schema + `sanity/migrate`), groqd (GROQ
query builder), Next.js 16 App Router, Vitest.

## Global Constraints

- Field name: `categories` → `category` (approved; the name overlap with
  `TCategoryPage.category` is a different, unrelated type/module).
- Migration selection rule: `category = categories[0]`, fully automatic, no
  manual editorial review.
- `PostMeta`'s `categories` prop is removed entirely (ui layer). `Article
.Header`'s category eyebrow is kept, simplified from an array to a single
  optional `category` object.
- Migration transform + idempotency tests land in **#264**, not filed
  separately.
- `tags` is untouched throughout.
- Out of scope (do not touch): `CategoryChipList`, `sitemap.ts`,
  `topics-page.tsx`, `get-categories-safely.ts`,
  `service.entities.categories.v1.getCategories()` — these list the category
  _taxonomy_, unrelated to a post's own field.
- Spec: `docs/superpowers/specs/2026-07-24-single-category-per-post-design.md`.

---

### Task 1: cms — schema + migration

**Files:**

- Modify: `apps/cms/src/schema-types/documents/blog/post.ts:58-70`
- Create: `apps/cms/migrations/<timestamp>-categories-to-single-category/index.ts`
  (via `pnpm --filter cms migrate:new "categories to single category"`, which
  generates the timestamp prefix)
- Regenerate: `packages/config/src/sanity/generated/schema.json`,
  `packages/config/src/sanity/generated/types.ts` (via `pnpm typegen`, run by
  the orchestrator inline, never by the `cms` agent or committed by hand)

**Interfaces:**

- Produces: schema field `category` (single required reference to
  `blog_category`, replacing the `categories` array) — every downstream layer
  in Task 2 reads `raw.category` (singular, dereferenced) instead of
  `raw.categories[]`.

- [ ] **Step 1: Change the schema field**

Replace the `categories` field definition:

```ts
// apps/cms/src/schema-types/documents/blog/post.ts:58-70
defineField({
  name: 'categories',
  title: 'Categories',
  type: 'array',
  description: 'Topic categories used for filtering and navigation.',
  of: [
    defineArrayMember({
      type: 'reference',
      to: [{ type: categorySchema.name }],
    }),
  ],
  validation: (rule) => rule.required().max(4),
}),
```

with:

```ts
defineField({
  name: 'category',
  title: 'Category',
  type: 'reference',
  description: 'The post’s primary topic classification.',
  to: [{ type: categorySchema.name }],
  validation: (rule) => rule.required(),
}),
```

- [ ] **Step 2: Scaffold the migration**

Run: `pnpm --filter cms migrate:new "categories to single category"`

Expected: creates
`apps/cms/migrations/<YYYYMMDDTHHmm>-categories-to-single-category/index.ts`
from the template and tracks it in `apps/cms/migrations/.current`.

- [ ] **Step 3: Write the transform**

Replace the scaffolded template body with:

```ts
// apps/cms/migrations/<timestamp>-categories-to-single-category/index.ts
import { at, defineMigration, setIfMissing, unset } from 'sanity/migrate';

export default defineMigration({
  title: 'Move post categories[0] to a single category reference',
  documentTypes: ['blog_post'],
  migrate: {
    document(doc) {
      const categories = doc.categories as
        { _ref: string; _type: string; _key: string }[] | undefined;

      if (!categories) return undefined; // already migrated — idempotent no-op

      const [first] = categories;

      return [
        at('category', setIfMissing({ _type: 'reference', _ref: first?._ref })),
        at('categories', unset()),
      ];
    },
  },
});
```

- [ ] **Step 4: Extract the transform for testing**

Move the pure transform logic into an exported helper so #264 can unit-test
it without a live dataset connection, following the pattern
`navItemToLink`/`buildHomePageModules` already established for other
migrations:

```ts
// apps/cms/migrations/<timestamp>-categories-to-single-category/transform.ts
export type TLegacyCategoryRef = { _ref: string; _type: string; _key: string };
export type TLegacyPostDoc = { categories?: TLegacyCategoryRef[] };

export function categoriesToSingleCategory(
  doc: TLegacyPostDoc,
): { _type: 'reference'; _ref: string } | undefined {
  const [first] = doc.categories ?? [];
  return first ? { _type: 'reference', _ref: first._ref } : undefined;
}
```

Update `index.ts`'s `document()` handler to call `categoriesToSingleCategory(doc)`
for the `category` value instead of inlining `first?._ref`.

- [ ] **Step 5: Run typegen (orchestrator, inline — not this agent, not verify-runner)**

Run: `pnpm typegen`
Expected: `packages/config/src/sanity/generated/types.ts` now has
`category: ...` (singular) on the post document type, `categories` is gone.
Re-run if the diff isn't minimal (typegen can be non-deterministic).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/schema-types/documents/blog/post.ts \
  apps/cms/migrations \
  packages/config/src/sanity/generated
git commit -m "feat(cms): narrow post categories to a single required category (#809)"
```

---

### Task 2: service — queries, transformers, view-models

**Files:**

- Modify: `packages/service/src/shared/fragments/post.ts:28-32,55-59`
- Modify: `packages/service/src/shared/fragments/archive-post-card.ts:22-26`
- Modify: `packages/service/src/shared/transformers/to-post-card.ts:16-20,33,45-53,67`
- Modify: `packages/service/src/shared/transformers/to-archive-post-card.ts:19,30`
- Modify: `packages/service/src/features/pages/post/adaptor/detail/types.ts:18,22`
- Modify: `packages/service/src/features/pages/post/adaptor/detail/transformer.ts:58`
- Modify: `packages/service/src/features/pages/post/adaptor/detail/loader.ts:17-20`
- Modify: `packages/service/src/features/pages/post/adaptor/related/query.ts:53`
- Modify: `packages/service/src/features/pages/category/adaptor/detail-page/posts.query.ts:7-10`
- Modify: `packages/service/src/features/modules/hero/adaptor/transformer.ts:53`
- Test: co-located `*.test.ts` next to each modified transformer/loader

**Interfaces:**

- Consumes: `category` field from Task 1's regenerated
  `packages/config/src/sanity/generated/types.ts` (singular reference).
- Produces: `TPostCardCategory` (unchanged shape, now singular) exposed as
  `TPostCard.category: TPostCardCategory` and `TPostDetail.category:
TCategory` — Task 3 (ui) and Task 4 (web) read `post.category` (no `[0]`,
  no `.map()`).

- [ ] **Step 1: Update the post fragments**

`packages/service/src/shared/fragments/post.ts` — in both
`postCardFragment` and `postDetailFragment`, replace:

```ts
categories: sub
  .field('categories[]')
  .deref()
  .project(categoryFragment)
  .notNull(),
```

with:

```ts
category: sub.field('category').deref().project(categoryFragment).notNull(),
```

- [ ] **Step 2: Update the archive-post-card fragment**

`packages/service/src/shared/fragments/archive-post-card.ts` — same
replacement (array field → singular `category` field, drop `[]`).

- [ ] **Step 3: Update `to-post-card.ts`**

```ts
// packages/service/src/shared/transformers/to-post-card.ts
export type TPostCard = {
  // ...unchanged fields...
  category: TPostCardCategory; // was: categories: TPostCardCategory[]
};

export function toPostCardCategory(
  raw: TRawPostCard['category'], // was: TRawPostCard['categories'][number]
): TPostCardCategory {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
  };
}

export function toPostCard(raw: TRawPostCard): TPostCard {
  return {
    // ...unchanged fields...
    category: toPostCardCategory(raw.category), // was: raw.categories.map(toPostCardCategory)
  };
}
```

- [ ] **Step 4: Update `to-archive-post-card.ts`**

```ts
// packages/service/src/shared/transformers/to-archive-post-card.ts
export type TArchivePostCard = {
  // ...unchanged fields...
  category: TPostCardCategory; // was: categories: TPostCardCategory[]
};

export function toArchivePostCard(raw: TRawArchivePostCard): TArchivePostCard {
  return {
    // ...unchanged fields...
    category: toPostCardCategory(raw.category), // was: raw.categories.map(toPostCardCategory)
  };
}
```

- [ ] **Step 5: Update post-detail `types.ts` and `transformer.ts`**

```ts
// packages/service/src/features/pages/post/adaptor/detail/types.ts:18,22
export type TPostDetail = Omit<TPostCard, 'author' | 'category'> & {
  // ...unchanged fields...
  category: TCategory; // was: categories: TCategory[]
  // ...
};
```

```ts
// packages/service/src/features/pages/post/adaptor/detail/transformer.ts:58
category: toCategory(raw.category), // was: categories: raw.categories.map(toCategory)
```

- [ ] **Step 6: Update `detail/loader.ts`**

```ts
// packages/service/src/features/pages/post/adaptor/detail/loader.ts
export async function getPost(slug: string): Promise<TPostDetail | null> {
  const raw = await runQuery(postDetailQuery, {
    parameters: { slug },
    ...isr('post'),
  });
  if (!raw) return null;

  const tagIds = (raw.tags ?? []).map((tag) => tag._id);
  const [settings, relatedPosts] = await Promise.all([
    getSiteSettings(),
    getRelatedPosts(raw._id, tagIds, raw.category._id),
  ]);

  return toPostDetail(raw, settings, relatedPosts);
}
```

Remove the old comment about the `?.` guard — `category` is a required
reference now, so `raw.category._id` needs no optional chaining (this is a
genuine behavior tightening, not just a style change: a post can no longer
exist with zero categories).

- [ ] **Step 7: Update the related-posts query**

`packages/service/src/features/pages/post/adaptor/related/query.ts:53`:

```ts
export const relatedByCategoryQuery = q
  .parameters<TRelatedByCategoryParams>()
  .star.filterByType('blog_post')
  .filterRaw('_id != $currentId && category._ref == $categoryId')
  .order('publishedAt desc')
  .slice(0, RELATED_POSTS_CATEGORY_CANDIDATE_LIMIT)
  .project(postCardFragment);
```

(was: `'_id != $currentId && $categoryId in categories[]->_id'`)

- [ ] **Step 8: Update the category-page posts query**

`packages/service/src/features/pages/category/adaptor/detail-page/posts.query.ts`:

```ts
const categoryPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterBy('category->slug.current == $slug');
```

(was: `.filterRaw('$slug in categories[]->slug.current')` — this becomes a
simple equality now, so it no longer needs `filterRaw`; update the comment
above it that explains why `filterRaw` was needed, since that reason no
longer applies — `filterBy` supports direct equality comparisons.)

- [ ] **Step 9: Update the hero module transformer**

`packages/service/src/features/modules/hero/adaptor/transformer.ts:53`:

```ts
heroPost?.category?.title, // was: heroPost?.categories[0]?.title
```

- [ ] **Step 10: Update/extend co-located tests**

For every transformer touched in Steps 3–5 and 9, update its `*.test.ts` to
build fixtures with a singular `category`/`raw.category` object instead of a
`categories` array, and assert `result.category` (not `result.categories[0]`
or `.categories` array equality). Follow the existing fixture-building
pattern already in each test file — do not introduce a new fixture style.

- [ ] **Step 11: Verify**

Run: `pnpm --filter service type-check && pnpm --filter service lint && pnpm --filter service test`
Expected: all green.

- [ ] **Step 12: Commit**

```bash
git add packages/service
git commit -m "feat(service): consume single post category (#809)"
```

---

### Task 3: ui — PostMeta, Article.Header, PostsSection

**Files:**

- Modify: `packages/ui/src/molecules/post-meta/post-meta.tsx`
- Modify: `packages/ui/src/organisms/article/components/header/article-header.tsx`
- Modify: `packages/ui/src/organisms/posts-section/posts-section.tsx`
- Test/Stories: co-located `*.test.tsx`/`*.stories.tsx` for all three

**Interfaces:**

- Consumes: nothing from Task 2 directly (ui stays prop-driven, no service
  import) — but its prop shapes must match what Task 4 (web) will pass:
  `Article.Header`'s `category?: IArticleHeaderCategory` (singular),
  `PostsSection`'s `IPostCardData.category: IPostCardCategoryData`
  (singular).
- Produces: `IArticleHeaderProps.category?: IArticleHeaderCategory`,
  `IPostCardData.category: IPostCardCategoryData` — Task 4 constructs these
  shapes.

- [ ] **Step 1: Remove `categories` from `PostMeta`**

`packages/ui/src/molecules/post-meta/post-meta.tsx` — delete the
`categories`/`linkAs` category-rendering concern entirely:

```ts
export interface IPostMetaProps extends IWithDataTestId {
  author: {
    name: string;
    imageUrl?: string;
    href?: string;
  };
  publishedAt: string;
  formattedDate: string;
  readingTimeMinutes?: number;
  share?: ReactNode;
  className?: string;
}
```

Remove the `categories` prop, its JSDoc, the `linkAs` prop (it existed only
to render category links — `PostMeta` has no other link-rendering need,
confirm this before deleting; if `linkAs` truly has no other consumer, delete
it and the now-unused `LinkComponent`/`ElementType` import), and the
`{categories && categories.length > 0 && (...)}` block (lines ~77-89) along
with the now-unused `Fragment` import if nothing else in the file uses it.

- [ ] **Step 2: Simplify `Article.Header`'s category prop**

`packages/ui/src/organisms/article/components/header/article-header.tsx`:

```ts
export interface IArticleHeaderProps
  extends Omit<ComponentPropsWithoutRef<'header'>, 'title'>, IWithDataTestId {
  /** Post's category, rendered as an eyebrow link above the title. Omit to render no eyebrow. */
  category?: IArticleHeaderCategory;
  linkAs?: TAnchorElementType;
  title: string;
  lead?: string;
  meta?: Omit<IPostMetaProps, 'className' | 'dataTestId'>;
  coverMedia?: ReactNode;
}
```

```tsx
export const ArticleHeader = ({
  category,
  linkAs,
  title,
  lead,
  meta,
  coverMedia,
  className,
  dataTestId,
  ...rest
}: IArticleHeaderProps) => {
  const s = articleHeaderVariants();

  return (
    <header
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {category && (
        <div className={s.categories()}>
          <Eyebrow href={category.href} linkAs={linkAs}>
            {category.label}
          </Eyebrow>
        </div>
      )}
      {/* ...rest unchanged... */}
```

Remove the now-unused `Fragment`/`MetaSeparator` import if nothing else in
this file uses them (check: `MetaSeparator` is still used inside `PostMeta`
itself, but confirm whether `article-header.tsx` imports it separately for
the removed multi-category separator — if so, drop that import here).

- [ ] **Step 3: Simplify `PostsSection`'s category shape**

`packages/ui/src/organisms/posts-section/posts-section.tsx`:

```ts
export interface IPostCardData {
  id: string;
  href: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  formattedDate: string;
  readingTime?: string;
  category: IPostCardCategoryData; // was: categories: IPostCardCategoryData[]
}
```

```tsx
<PostCard.Meta
  dateValue={post.publishedAt}
  dateLabel={post.formattedDate}
  readingTime={post.readingTime}
  category={post.category.title} // was: post.categories[0]?.title ?? ''
/>
```

- [ ] **Step 4: Update stories and tests**

Update every `*.stories.tsx`/`*.test.tsx` fixture for `PostMeta`,
`ArticleHeader`, and `PostsSection` to match the new singular shapes — drop
multi-category story variants (e.g. "with two categories") since that state
is no longer reachable, keep a single-category and a no-category story where
one already exists.

- [ ] **Step 5: Verify**

Run: `pnpm --filter ui type-check && pnpm --filter ui lint && pnpm --filter ui test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): drop PostMeta categories, singularize Article.Header + PostsSection category (#809)"
```

---

### Task 4: web — page composition

**Files:**

- Modify: `apps/web/src/components/pages/blog-post-page/blog-post-page.tsx:40-101`
- Modify: `apps/web/src/utils/to-post-list-items.ts:19,44,53`
- Test: co-located `*.test.tsx` for `blog-post-page` and `to-post-list-items`

**Interfaces:**

- Consumes: `post.category` (singular, from Task 2's `TPostDetail`),
  `Article.Header`'s `category` prop and `PostsSection`'s
  `IPostCardData.category` (singular, from Task 3).

- [ ] **Step 1: Update `blog-post-page.tsx`**

```tsx
const {
  title,
  excerpt,
  category,
  tags,
  body,
  relatedPosts,
  heroImageSanity,
  heroImageAlt,
  publishedAt,
  author,
  readingTimeMinutes,
} = post;

// ...

return (
  <main className={s.root()}>
    {schema && <JsonLd schema={schema} />}

    <Article>
      <Article.Header
        category={{
          label: category.title,
          href: routes.category(category.slug),
        }}
        linkAs={SmartLink}
        title={title}
        lead={excerpt}
        meta={{
          author: { ...author, href: routes.author(author.slug) },
          publishedAt,
          formattedDate: format.dateTime(new Date(publishedAt), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          readingTimeMinutes,
          share: <PostShare url={url} title={title} links={shareLinks} />,
        }}
        coverMedia={
          heroImageSanity ? (
            <SanityImage
              image={heroImageSanity}
              width={1200}
              height={675}
              sizes="(min-width: 1024px) 800px, 100vw"
              alt={heroImageAlt}
              className={s.coverImage()}
            />
          ) : undefined
        }
      />
```

Remove `const primaryCategory = categories[0]` and the
`categories.slice(1).map(...)` block passed to `meta.categories` (that prop
no longer exists on `PostMeta` after Task 3).

- [ ] **Step 2: Update `to-post-list-items.ts`**

```ts
type TPostListItemSource = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: TPostCardCategory; // was: categories: TPostCardCategory[]
  readingTimeMinutes?: number;
};

export const toPostListItems = async (
  posts: readonly TPostListItemSource[],
): Promise<IPostCardData[]> => {
  const format = await getFormatter();

  return posts.map((post) => ({
    id: post.id,
    href: routes.post(post.slug),
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    formattedDate: format.dateTime(new Date(post.publishedAt), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    readingTime:
      post.readingTimeMinutes === undefined
        ? undefined
        : `${post.readingTimeMinutes} min`,
    category: post.category, // was: categories: post.categories
  }));
};
```

- [ ] **Step 3: Update tests**

Update `blog-post-page.test.tsx` and `to-post-list-items.test.ts` fixtures
from a `categories` array to a singular `category` object, and update
assertions accordingly (no more "renders overflow categories in the meta
strip" test case — that behavior no longer exists; keep/adjust the "renders
the category eyebrow" case).

- [ ] **Step 4: Verify**

Run: `pnpm type-check && pnpm lint && pnpm test` (full integration pass —
this task's changes are the last layer, so run the multi-layer sequence, not
just `--filter web`).
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): compose single post category in blog-post-page (#809)"
```

---

## Self-Review

**Spec coverage:** Schema (Task 1) ✓, migration (Task 1) ✓, service (Task 2)
✓ including both queries and both transformers plus the hero module and
related-posts filter, ui (Task 3) including the explicit PostMeta-removal
decision ✓, web (Task 4) ✓, PR-structure note (single combined PR, header) ✓,
migration tests deferred to #264 (noted in constraints, not duplicated as a
task here) ✓, follow-up breadcrumbs ticket (out of scope, filed separately,
not a task here) ✓.

**Placeholder scan:** No TBD/TODO; every step shows real before/after code
or an exact command.

**Type consistency:** `TPostCardCategory` (unchanged shape) flows through
`TPostCard.category` → `IPostCardData.category` →
`IPostCardCategoryData`/`IArticleHeaderCategory` consistently as singular
across Tasks 2–4; `TCategory` (post-detail's richer shape, `id`/`title`/
`slug`/`description`) stays distinct from `TPostCardCategory` (`id`/`title`/
`slug`), matching the existing pre-change type split — not introduced by this
plan.
