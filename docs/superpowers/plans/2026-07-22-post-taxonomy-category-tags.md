# Post Taxonomy (Category + Tags) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. In THIS repo each Task is one per-layer **sub-issue of epic #674**, delegated to the matching scoped subagent (`config`/`cms`/`service`/`ui`/`web`) per `develop-feature`, and shipped as its own per-layer PR under milestone **M3 — Post taxonomy**.

**Goal:** Split the post's overloaded `categories` array into a bounded **category** axis (section) and a new **tags** axis (topics) backed by a `blog_tag` reference document, with full tag discovery — `/tag/*` archives, shared-tag ranked related-posts, per-tag RSS, sitemap, and JSON-LD keywords.

**Architecture:** Additive, layered, no migration. New `blog_tag` document + a `tags` reference array on `post` (and a `max: 4` cap on `categories`). Each layer mirrors the existing **category** implementation as its template (`category` schema → `blog_tag`, `routes.category` → `routes.tag`, `categoryFragment` → `tagFragment`, the `pages/category` service feature → `pages/tag`, the `/category/*` routes → `/tag/*`). The `Article` compound (shipped in #627) gains an `Article.Footer` part that renders the already-generic `TagList` molecule.

**Tech Stack:** Sanity v6 schema + typegen, groqd (`q.fragmentForType`), Next.js 16 App Router (Server Components, ISR), `@blog/ui` (tailwind-variants, `mapCompoundSlots` compounds), Turborepo/pnpm, Vitest + Testing Library, Storybook.

## Global Constraints

- Layer contracts hold: `@blog/ui` pure (no `service`/`sanity`/`fetch`/`'use client'`); `@blog/service` is the only Sanity importer, no React; `apps/web` is the only place `ui` + `service` meet. Graph stays acyclic.
- TypeScript `strict`, no `any`. Server Components by default; `'use client'` only at leaf boundaries in `apps/web`.
- Every groqd projected field ends in `.notNull()` or `.nullable(true)`.
- No raw Tailwind class strings in JSX — classes live in co-located `*-variants.ts` via `tv()`; slot values are always arrays of strings.
- Key/value enum consts are UPPERCASE key === UPPERCASE value, `as const`, in `@blog/config`.
- After any schema change: `pnpm typegen`, commit regenerated `packages/config/src/sanity/generated/` (never hand-edit).
- **No migration** — datasets recreated clean 2026-07-12; all changes additive. Re-seed any post that would violate `categories` `max: 4`.
- Absolute imports via per-workspace aliases; when a workspace consumes a new dep, add its alias to that workspace's `tsconfig` + `vitest.config.ts`.
- Conventional commits, lowercase subject, one concern per PR. Verify from root: `pnpm type-check`, `pnpm lint`, `pnpm test`.
- Only the final (web) PR carries `Closes #674`; earlier layer PRs reference `#674` without a closing keyword. Every sub-issue is assigned to milestone **M3 — Post taxonomy** with its `layer:*` label.

**Dependency order (do not reverse):** config → cms → service → ui → web. ui and web both depend on service; config and cms are independent of each other but both precede service.

---

### Task 1: `config` — `routes.tag` URL builder

**Sub-issue:** `feat(config): add routes.tag URL builder for /tag archives` · labels `layer:config` · milestone M3 · Part of #674
**Owner:** `config` subagent.

**Files:**

- Modify: `packages/config/src/routes.ts`
- Test: `packages/config/src/routes.test.ts` (create if absent; otherwise extend)

**Interfaces:**

- Produces: `routes.tag(slug: string, page?: number) => string` — page 1 → `/tag/<slug>`, page ≥ 2 → `/tag/<slug>/page/<page>`. Consumed by `service` (Task 3 tag transformer hrefs) and `web` (Task 5 routes/sitemap/JSON-LD).

**Notes:** Mirror the existing `category` builder exactly (`routes.ts:12-14`). Document type names in this repo are string literals (`'blog_category'`), so there is **no** `_type` constant to add — the config change is only the route builder.

- [ ] **Step 1: Write the failing test** in `routes.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { routes } from './routes';

describe('routes.tag', () => {
  it('links page 1 to the bare /tag/<slug>', () => {
    expect(routes.tag('typescript')).toBe('/tag/typescript');
  });
  it('links page >= 2 under the static page/ segment', () => {
    expect(routes.tag('typescript', 2)).toBe('/tag/typescript/page/2');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails** — `pnpm --filter @blog/config test routes` → FAIL (`routes.tag is not a function`).

- [ ] **Step 3: Add the builder** to `routes.ts`, immediately after `category`:

```ts
  /** Page 1 lives at /tag/{slug} only; pages ≥ 2 under the static `page/` segment. */
  tag: (slug: string, page = 1) =>
    page === 1 ? `/tag/${slug}` : `/tag/${slug}/page/${page}`,
```

- [ ] **Step 4: Run tests** — `pnpm --filter @blog/config test routes` → PASS.
- [ ] **Step 5: Verify + commit** — `pnpm --filter @blog/config type-check && pnpm --filter @blog/config lint`; then `git commit -m "feat(config): add routes.tag URL builder for /tag archives"`.

---

### Task 2: `cms` — `blog_tag` document + post `tags` field + `categories` cap

**Sub-issue:** `feat(cms): add blog_tag document and post tags field` · labels `layer:cms` · milestone M3 · Part of #674
**Owner:** `cms` subagent. Applies `cms-schema-practices`.

**Files:**

- Create: `apps/cms/src/schema-types/documents/blog/tag.ts`
- Modify: `apps/cms/src/schema-types/documents/blog/post.ts` (the `categories` field; add a new `tags` field)
- Modify: the schema registry that lists document types (wherever `categorySchema` is registered — mirror its registration) and the desk/structure config (mirror the category singleton/list placement)
- Modify (generated, via typegen — do not hand-edit): `packages/config/src/sanity/generated/{schema.json,types.ts}`

**Interfaces:**

- Produces: a `blog_tag` document type with fields `title` (string, required, ≤60), `slug` (slug, required, from title), `description` (text, optional, ≤300), `seo` (the **same object type the `post` document uses for its `seo` field** — read `post.ts`, reuse that exact object type, optional). Post gains `tags: reference[] → blog_tag` (min 0, max 6). `categories` gains `.max(4)`. Typegen regenerates `Blog_tag`, and `Post.tags`/`Post.categories` types consumed by `service` (Task 3).

- [ ] **Step 1: Create `tag.ts`** mirroring `category.ts` (`apps/cms/src/schema-types/documents/blog/category.ts`), named export `tagSchema`:

```ts
import { Tag } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const tagSchema = defineType({
  name: 'blog_tag',
  title: 'Tag',
  type: 'document',
  icon: Tag,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Topic label shown on tag chips and the tag archive page.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL path segment for the tag page — auto-generated from title.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description:
        'Brief topic summary — shown on the tag archive page and used as its meta description.',
      validation: (rule) => rule.max(300),
    }),
    // seo: reuse the SAME object type post.ts uses for its `seo` field.
    // Read apps/cms/src/schema-types/documents/blog/post.ts, copy that field
    // definition verbatim (same `type`), title "SEO", left optional.
  ],
});
```

- [ ] **Step 2: Add the `seo` field** by reading `post.ts`'s `seo` field and appending the identical `defineField({ name: 'seo', type: <same object type>, ... })` (optional) to `tagSchema.fields`. Do not invent a new SEO shape.

- [ ] **Step 3: Register `tagSchema`** in the schema registry next to `categorySchema`, and place it in the desk structure mirroring the category document's placement.

- [ ] **Step 4: Edit `post.ts` `categories`** — add `.max(4)` to its existing `min(1)` container validation (keep author-order = primary). Then add the `tags` field right after `categories`:

```ts
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      description: 'Topics for discovery — power /tag pages, related posts, and the article footer chips.',
      of: [{ type: 'reference', to: [{ type: 'blog_tag' }] }],
      validation: (rule) => rule.max(6),
    }),
```

- [ ] **Step 5: Regenerate types** — run `pnpm typegen` (orchestrator runs this inline, not `verify-runner`). Re-run until the diff is minimal. Confirm `Blog_tag`, `Post.tags`, and unchanged `Post.categories` appear in `packages/config/src/sanity/generated/types.ts`.

- [ ] **Step 6: Verify + commit** — `pnpm --filter cms type-check && pnpm --filter cms lint`; commit the schema files **and** the regenerated types together: `git commit -m "feat(cms): add blog_tag document and post tags field"`. State in the PR body: additive change, no migration (clean-dataset policy); re-seed any post exceeding 4 categories.

---

### Task 3: `service` — `tag` feature, `tags` projection, related-posts query

**Sub-issue:** `feat(service): tag feature, post tags projection, related-posts query` · labels `layer:service` · milestone M3 · Part of #674
**Owner:** `service` subagent. Applies `add-content-type`, `testing-practices`. Uses the post-#345 role-based slice naming (`adaptor/detail-page/`, `adaptor/detail-page-params/`).

**Files:**

- Create: `packages/service/src/shared/fragments/tag.ts`
- Create: `packages/service/src/features/pages/tag/` — mirror `packages/service/src/features/pages/category/` wholesale (adaptor `detail-page/` + `detail-page-params/`, `application/service.ts`, `index.ts`, co-located tests).
- Modify: `packages/service/src/shared/fragments/post.ts` (add `tags` to the post-detail projection)
- Modify: the post feature's detail-page transformer/types + view-model (add `tags`, add `relatedPosts`)
- Modify: `packages/service/src/index.ts` (re-export the tag service + new types)
- Test: co-located `*.test.ts` for the tag fragment, tag service, post `tags` projection, and the related-posts query.

**Interfaces:**

- Consumes: `routes.tag` (Task 1); generated `Blog_tag`, `Post.tags` (Task 2).
- Produces:
  - `tagFragment` — `{ _id: string; title: string; slug: string }` (title `.notNull()`, slug `sub.field('slug.current').notNull()`), mirroring `categoryFragment`.
  - Tag service on `service.pages.tag.v1` mirroring `service.pages.category.v1`: `getTagPage(slug, page?) => TTagPage | undefined` (tag + its paginated published posts) and `getAllTagSlugs() => string[]` (naming to match the category feature's equivalents exactly — read `pages/category/index.ts` and mirror method names).
  - Post-detail view-model gains `tags: { id: string; title: string; slug: string }[]` and `relatedPosts: TPostCardViewModel[]` (reuse the existing post-card view-model type the `PostsSection`/`PostGrid` already consume).
  - `getRelatedPosts` behaviour: up to 3 other **published** posts, ranked by shared-tag count desc, `publishedAt` desc tiebreak; fill from recent published posts in the post's primary category (`categories[0]`) when fewer than 3 qualify; always exclude the current post and de-dupe.

- [ ] **Step 1: `tagFragment` — test first.** Create `tag.test.ts` asserting the fragment projects `_id`, `title` (non-null), `slug` from `slug.current`. Run → fail.

- [ ] **Step 2: Implement `tagFragment`** in `shared/fragments/tag.ts`, mirroring `categoryFragment`:

```ts
import { q } from '@blog/service/sanity/query';

export const tagFragment = q.fragmentForType<'blog_tag'>().project((sub) => ({
  _id: true,
  title: sub.field('title').notNull(),
  slug: sub.field('slug.current').notNull(),
}));
```

Run test → pass.

- [ ] **Step 3: Tag feature — mirror the category feature.** Copy `pages/category/` to `pages/tag/`, replacing `category`→`tag`, `blog_category`→`blog_tag`, `categoryFragment`→`tagFragment`, `routes.category`→`routes.tag`. Keep the `detail-page`/`detail-page-params` slice names. Port its tests the same way. Run the ported tests → pass. Every projected field keeps explicit `.notNull()`/`.nullable(true)`.

- [ ] **Step 4: Post projection — add `tags`.** In `shared/fragments/post.ts` post-detail projection, add `tags: sub.field('tags[]->').project(() => tagFragment)` (mirror how `categories` is projected). Update the post-detail transformer + view-model type to expose `tags: { id; title; slug }[]`. Extend the post-detail test to assert tags flow through. Run → pass.

- [ ] **Step 5: Related-posts — test first.** Add a test feeding a fixture post with tags + sibling posts (some sharing tags, some only sharing the primary category) and assert: ≤3 returned, ranked by shared-tag count then recency, current post excluded, category fallback fills the remainder. Run → fail.

- [ ] **Step 6: Implement `getRelatedPosts`** in the post feature (new adaptor slice, e.g. `adaptor/related/`), projecting the post-card view-model. GROQ ranks by `count((tags[]->_id)[@ in $tagIds])` desc, `publishedAt` desc, `_id != $currentId`, `!(_id in path("drafts.**"))`; a second query pulls recent posts in `categories[0]` to backfill to 3. Wire it into the post service and the detail view-model (`relatedPosts`). Run → pass.

- [ ] **Step 7: Re-export + verify + commit.** Add tag service + new types to `src/index.ts` (add any new `@blog/*` alias to `tsconfig`/`vitest.config.ts` if a new dep is consumed — none expected here). `pnpm --filter @blog/service type-check && lint && test`. Commit: `git commit -m "feat(service): add tag feature, post tags projection, and related-posts query"`.

---

### Task 4: `ui` — `Article.Footer` renders the tag chip list

**Sub-issue:** `feat(ui): Article.Footer tag chip list` · labels `layer:ui` · milestone M3 · Part of #674
**Owner:** `ui` subagent. Applies `ui-library-practices`, `ui-storybook`, `testing-practices`.

**Files:**

- Create: `packages/ui/src/organisms/article/components/footer/article-footer.tsx`
- Create: `packages/ui/src/organisms/article/components/footer/article-footer-variants.ts`
- Modify: `packages/ui/src/organisms/article/article.tsx` (register `Footer` in `ArticleParts`, render `slots.Footer` after `slots.Body`)
- Modify: `packages/ui/src/organisms/article/index.ts` (export `IArticleFooterProps`, `IArticleFooterTag`)
- Test/story: `article-footer` co-located `*.test.tsx` + Storybook story; extend `article.test.tsx`/`article.stories.tsx` to cover the composed `Article.Footer`.

**Interfaces:**

- Consumes: nothing from service (pure). Reuses the existing generic `TagList` molecule (`packages/ui/src/molecules/tag-list`, props `tags: (string | {label, href})[]`, `linkAs`) — **no change to `TagList` needed**.
- Produces: `Article.Footer` compound part.
  - `IArticleFooterTag = { label: string; href: string }`
  - `IArticleFooterProps` = `Omit<ComponentPropsWithoutRef<'footer'>, 'children'> & IWithDataTestId & { tags: IArticleFooterTag[]; linkAs?: TAnchorElementType }`
  - Renders nothing when `tags` is empty; otherwise a `<footer>` wrapping `<TagList tags={tags} linkAs={linkAs} />`. Consumed by `web` (Task 5).

- [ ] **Step 1: Test first.** In `article-footer.test.tsx`, assert: (a) renders each tag as a link with the right `href`/text via `getByRole('link', { name })`; (b) renders `null` for `tags={[]}`; (c) forwards `dataTestId`. Run → fail.

- [ ] **Step 2: Variants + component.**

`article-footer-variants.ts`:

```ts
import { tv } from '@blog/ui/lib/styling';

export const articleFooterVariants = tv({
  slots: { root: ['mt-8 border-t border-border pt-6'] },
});
```

`article-footer.tsx`:

```ts
import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { TagList } from '@blog/ui/molecules/tag-list';
import type { ComponentPropsWithoutRef } from 'react';

import { articleFooterVariants } from './article-footer-variants';

export interface IArticleFooterTag {
  label: string;
  href: string;
}

export interface IArticleFooterProps
  extends Omit<ComponentPropsWithoutRef<'footer'>, 'children'>, IWithDataTestId {
  /** Post tags, rendered as a chip list of links. Empty ⇒ renders nothing. */
  tags: IArticleFooterTag[];
  /** Component the tag links render as — pass the app router's Link. */
  linkAs?: TAnchorElementType;
}

/** Article.Footer — end-of-article furniture; renders the post's tag chips. */
export const ArticleFooter = ({
  tags,
  linkAs,
  className,
  dataTestId,
  ...rest
}: IArticleFooterProps) => {
  if (tags.length === 0) return null;
  const s = articleFooterVariants();
  return (
    <footer className={s.root({ class: className })} data-testid={dataTestId} {...rest}>
      <TagList tags={tags} linkAs={linkAs} />
    </footer>
  );
};
```

- [ ] **Step 3: Register in the compound.** In `article.tsx`, add `Footer: ArticleFooter` to `ArticleParts` and render `{slots.Footer}` after `{slots.Body}` (before `unmatched`). Export the new types from `article/index.ts`.

- [ ] **Step 4: Run tests** — `pnpm --filter @blog/ui test article` → PASS. Add/extend the Storybook story showing `Article.Footer` with a few tags.

- [ ] **Step 5: Verify + commit** — `pnpm --filter @blog/ui type-check && lint && test`; `git commit -m "feat(ui): add Article.Footer tag chip list"`.

---

### Task 5: `web` — `/tag/*` routes, post-page tags + related-posts, feeds, sitemap

**Sub-issue:** `feat(web): /tag routes, related posts, tag feeds and sitemap` · labels `layer:web` · milestone M3 · **Closes #674**
**Owner:** `web` subagent. Applies `seo-and-metadata`, `web-storybook`, `testing-practices`.

**Files:**

- Create: `apps/web/src/app/[locale]/tag/[slug]/page.tsx`, `.../tag/[slug]/page/[page]/page.tsx` (mirror the `/category/*` route files)
- Create: `apps/web/src/app/[locale]/tag/[slug]/rss.xml/route.ts` (mirror the existing RSS route)
- Create: a `tag-page` composition component under `apps/web/src/components/pages/` (mirror `category-page`)
- Modify: `apps/web/src/components/pages/blog-post-page/blog-post-page.tsx` (add `Article.Footer` with mapped tags; add a "Related" `PostsSection`)
- Modify: `sitemap.ts` (add tag archive URLs); the JSON-LD builder `apps/web/src/utils/build-blog-posting-schema.ts` (add `keywords` from tags)
- Test: co-located tests for the tag page, the post-page tag/related additions, sitemap, and the RSS route.

**Interfaces:**

- Consumes: `service.pages.tag.v1` + post-detail `tags`/`relatedPosts` (Task 3); `routes.tag` (Task 1); `Article.Footer` (Task 4); existing `SmartLink`, `PostsSection`.

- [ ] **Step 1: Tag routes — test first, then mirror category.** Add a test that the tag page renders a tag's posts and paginates (mirror the category page test). Create the `tag-page` component + the two route files by copying the `/category/*` equivalents and swapping `category`→`tag`, `routes.category`→`routes.tag`, `getCategoryPage`→`getTagPage`. Each `generateMetadata` derives canonical/OG/meta-description from the tag `description`/`seo`. ISR `next: { revalidate, tags }`. Run → pass.

- [ ] **Step 2: Post page — tags footer + related.** In `blog-post-page.tsx` add, inside `<Article>` after `<Article.Body>`:

```tsx
<Article.Footer
  tags={post.tags.map((tag) => ({
    label: tag.title,
    href: routes.tag(tag.slug),
  }))}
  linkAs={SmartLink}
/>
```

and after `</Article>` a related-posts section when `post.relatedPosts.length > 0`:

```tsx
{
  post.relatedPosts.length > 0 && (
    <PostsSection
      heading="Related posts"
      posts={post.relatedPosts} /* + existing PostsSection props */
    />
  );
}
```

Extend `blog-post-page.test.tsx` to assert tag chips render with `routes.tag` hrefs and the related section renders when present / is absent when empty. Run → pass.

- [ ] **Step 3: Feeds + sitemap + JSON-LD.** Add tag archive URLs to `sitemap.ts` (from `getAllTagSlugs`); create the per-tag `rss.xml/route.ts` mirroring the existing feed; add `keywords: post.tags.map((t) => t.title)` to the `BlogPosting` schema. Add/extend tests for sitemap tag entries and the RSS route. Run → pass.

- [ ] **Step 4: Verify + commit.** `pnpm type-check && pnpm lint && pnpm test` (full — this is the integrating layer). Commit: `git commit -m "feat(web): add /tag routes, related posts, tag feeds and sitemap"`. PR body: `Closes #674`, and updates `SPEC.md` (content model + routes) and `README.md` §CI if any workflow/feed check changes.

---

## Self-Review

**Spec coverage** — every spec section maps to a task: `blog_tag` doc + fields → Task 2; `categories max 4`/primary → Task 2 (+ consumed everywhere); `routes.tag`/`_type` (no constant, literals) → Task 1; tag feature + related-posts + `tags` projection → Task 3; `TagList` repurpose + `Article.Footer` → Task 4; `/tag/*` routes, post-page chips + related section, per-tag RSS, sitemap, JSON-LD keywords, curation note → Task 5; no-migration → Task 2 PR body. Hero `POST_CATEGORY` needs no change (primary = `categories[0]`, already read) — noted, no task required.

**Placeholder scan** — the only deferred lookups are "reuse the exact `seo` object type from `post.ts`" (Task 2) and "match the category feature's exact method names" (Task 3); both name the precise template file to copy from rather than leaving behaviour undefined, which is the intended pattern for mirroring in this codebase.

**Type consistency** — `tagFragment` shape `{ _id; title; slug }` (Task 3) matches the `tags: { id; title; slug }[]` view-model and the `Article.Footer` `{ label; href }` mapping done in web (Task 5) via `label: tag.title, href: routes.tag(tag.slug)`. `routes.tag(slug, page?)` signature is identical across Tasks 1/3/5. `relatedPosts` reuses the existing post-card view-model consumed by `PostsSection`.

## Execution Handoff — this repo's delivery gates

Each Task = one per-layer sub-issue under epic #674 / milestone M3, delivered through `develop-feature`'s gate sequence (In Progress → work → `verify-runner` → `reviewer` (+`a11y-reviewer` for Task 4/5, +`seo-auditor` for Task 5) → commit → **ask push** → **ask PR** → Code Review → `ci-watcher`). Dependency order config → cms → service → ui → web; a downstream task starts only after its upstream layer's PR merges (so its generated types / service API / ui exports are on `main`).
