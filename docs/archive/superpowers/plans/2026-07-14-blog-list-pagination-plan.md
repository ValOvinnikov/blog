# Blog List Pagination Implementation Plan

> **Archived — implemented.** See SPEC.md §1. Product summary (Blog surface) for current behavior.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo-specific execution model:** this repo delegates layer work to the
> scoped subagents in `.claude/agents/` (`service`, `ui`, `web`; config-layer
> tasks have no dedicated agent — the orchestrator does them inline applying
> repo conventions). Each PR phase ends with the repo's mandatory gate
> sequence: root verify → `reviewer` subagent `APPROVE` → **human-approved**
> commit → push → PR → board update. Never bundle gates.

**Spec:** `docs/archive/superpowers/specs/2026-07-14-blog-list-pagination-design.md` (committed on `feat/config-route-builder`).
**Issues:** #75 (`/blog` route), #85 (Pagination organism).

**Goal:** Ship the paginated `/blog` index (`/blog`, `/blog/page/N`) plus the site-wide route-builder it rides on.

**Architecture:** Four per-layer PRs in dependency order — `config` (route-builder + page-size constant), `service` (paginated blog query, `safeAsync` wrap, route-builder adoption), `ui` (route-agnostic `Pagination` organism), `web` (two routes sharing one composition, metadata, redirect, route-builder adoption). Each PR merges to `main` green alone.

**Tech Stack:** Next.js 16 App Router + next-intl, groqd 1.7.1, tailwind-variants, Vitest + Testing Library, Turborepo/pnpm.

## Global Constraints

- Layer contracts (SPEC §4): `ui` never imports service/sanity/fetch and never uses `'use client'`; `service` never imports React; `web` is the only place `ui` and `service` meet.
- Absolute imports via each workspace's own alias (`@blog/config`, `@blog/service/*`, `@blog/ui/*`, `@web/*`); same-directory `./` allowed; never `../`.
- TypeScript `strict`, no `any`. Server Components by default.
- No schema change → **no typegen run, no migration** anywhere in this plan.
- Service conventions: explicit projections, `.notNull()` last in chain for required fields, `T | undefined` view-models, **no faked defaults**.
- UI a11y conventions: no hardcoded copy/aria-labels — all strings arrive as props (`ariaLabel`, `previousLabel`, `nextLabel`); date formatting stays in web.
- Pagination rules (spec — do not change): self-canonical every page, never canonical-to-page-1; no `rel=next/prev`; `/blog/page/1` → `permanentRedirect` to `/blog`; out-of-range/non-canonical page param → hard 404.
- `POSTS_PER_PAGE = 9`.
- Conventional commits; commit/push/PR each need fresh explicit user approval; after each PR is created move the issue (#75, or #85 for PR 3) → Code Review on the board and verify the write stuck.

---

## PR 1 — `config`: route-builder + pagination constant

Branch: `feat/config-route-builder` (already exists, holds the spec commit).

### Task 1: `routes` builder + `POSTS_PER_PAGE` + vitest wiring for `@blog/config`

`@blog/config` has **no test setup today** (no `test` script, no vitest config) — this task adds it, because the route-builder carries the page-1-vs-N branch that must be pinned.

**Files:**

- Create: `packages/config/src/routes.ts`
- Create: `packages/config/src/routes.test.ts`
- Create: `packages/config/src/constants/pagination.ts`
- Create: `packages/config/vitest.config.ts`
- Modify: `packages/config/src/constants/index.ts` (add `export * from './pagination';`)
- Modify: `packages/config/src/index.ts` (add `export * from './routes';`)
- Modify: `packages/config/package.json` (test scripts + devDeps)

**Interfaces:**

- Produces: `routes.home(): string`, `routes.blogIndex(page?: number): string`, `routes.post(slug: string): string`, `routes.category(slug: string): string`, `routes.author(slug: string): string`, `routes.genericPage(slug: string): string`; `POSTS_PER_PAGE: 9`. All exported from `@blog/config`.

- [ ] **Step 1: Add vitest wiring**

```bash
pnpm add -D --filter @blog/config vitest @blog/vitest-config@workspace:*
```

Create `packages/config/vitest.config.ts` (node environment — the preset default; no aliases needed, tests use relative imports):

```ts
import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(preset, defineConfig({}));
```

In `packages/config/package.json` `scripts`, add (matching the other packages):

```json
"test": "vitest run --passWithNoTests",
"test:watch": "vitest"
```

- [ ] **Step 2: Write the failing test**

`packages/config/src/routes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { routes } from './routes';

describe('routes', () => {
  it('builds the home path', () => {
    expect(routes.home()).toBe('/');
  });

  it('builds page 1 of the blog index without a page segment', () => {
    expect(routes.blogIndex()).toBe('/blog');
    expect(routes.blogIndex(1)).toBe('/blog');
  });

  it('builds page N of the blog index under /blog/page/', () => {
    expect(routes.blogIndex(2)).toBe('/blog/page/2');
    expect(routes.blogIndex(10)).toBe('/blog/page/10');
  });

  it('builds post, category, author, and generic-page paths', () => {
    expect(routes.post('my-post')).toBe('/blog/my-post');
    expect(routes.category('design')).toBe('/category/design');
    expect(routes.author('jane-doe')).toBe('/author/jane-doe');
    expect(routes.genericPage('about')).toBe('/about');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @blog/config test`
Expected: FAIL — cannot resolve `./routes`.

- [ ] **Step 4: Implement**

`packages/config/src/routes.ts`:

```ts
/**
 * Single source of truth for app URL construction. Consumed by `service`
 * (href-emitting transformers) and `web` (routes, pagination `createHref`,
 * sitemap, JSON-LD) — never build these paths inline elsewhere.
 * Spec: docs/superpowers/specs/2026-07-14-blog-list-pagination-design.md.
 */
export const routes = {
  home: () => '/',
  /** Page 1 lives at /blog only; pages ≥ 2 under the static `page/` segment. */
  blogIndex: (page = 1) => (page === 1 ? '/blog' : `/blog/page/${page}`),
  post: (slug: string) => `/blog/${slug}`,
  category: (slug: string) => `/category/${slug}`,
  author: (slug: string) => `/author/${slug}`,
  genericPage: (slug: string) => `/${slug}`,
} as const;
```

`packages/config/src/constants/pagination.ts`:

```ts
/** Posts per listing page — fills the 3×3 responsive grid (spec Decisions). */
export const POSTS_PER_PAGE = 9;
```

Add `export * from './pagination';` to `packages/config/src/constants/index.ts` and `export * from './routes';` to `packages/config/src/index.ts` (keep both lists alphabetical).

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @blog/config test`
Expected: PASS (all 4 tests).

- [ ] **Step 6: Per-package checks**

Run: `pnpm --filter @blog/config type-check && pnpm --filter @blog/config lint`
Expected: both green.

### PR 1 gate block

- [ ] Root verify: `pnpm type-check && pnpm lint && pnpm test && pnpm build` — all green.
- [ ] Dispatch `reviewer` subagent over `main...HEAD` + working tree; fix blockers; repeat until `APPROVE`.
- [ ] **GATE (ask user): commit** — `feat(config): add routes builder + POSTS_PER_PAGE constant`.
- [ ] **GATE (ask user): push.**
- [ ] **GATE (ask user): open PR** — title `feat(config): route-builder as single source of URL truth`; body references #75 + the spec (do **not** close #75). After creation: #75 → Code Review on the board (verify the write stuck).
- [ ] After merge: #75 → In Progress again; pull `main`.

---

## PR 2 — `service`: paginated blog page + route-builder adoption

Branch (from fresh `main` after PR 1 merges): `feat/service-blog-pagination`.
**Delegate to the `service` subagent** (skills: `add-content-type` conventions, `testing-practices`).

### Task 2: paginated query, loader, transformer, types

**Files:**

- Modify: `packages/service/src/features/pages/blog/adaptor/query.ts`
- Modify: `packages/service/src/features/pages/blog/adaptor/types.ts`
- Modify: `packages/service/src/features/pages/blog/adaptor/transformer.ts`
- Modify: `packages/service/src/features/pages/blog/adaptor/loader.ts`
- Create: `packages/service/src/features/pages/blog/adaptor/loader.test.ts`

**Interfaces:**

- Consumes: `routes` from `@blog/config` (PR 1); existing `postCardFragment`, `toPostCard`, `runQuery`, `isr`, `makeRawPostCard`, `mockRun`.
- Produces: `getBlogPage(args?: TGetBlogPageArgs): Promise<TBlogPage>` where `TGetBlogPageArgs = { page?: number; pageSize?: number }` and `TBlogPage = { posts: TPostCard[]; currentPage: number; totalPages: number; total: number }`.

Design note (deviation from the spec's "prefer a single query", verified against groqd 1.7.1): `.slice(start, end)` takes **literal numbers** — GROQ has no `$param` slices — so the window query is a **builder function**, and the loader runs window + count as two parallel `runQuery` calls, exactly like the category detail loader (`features/pages/category/adaptor/detail/loader.ts`). `q.count(...)` exists at the root builder (`GroqBuilderRoot`).

- [ ] **Step 1: Write the failing loader test**

`packages/service/src/features/pages/blog/adaptor/loader.test.ts`:

```ts
import { makeRawPostCard } from '@blog/service/testing/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { describe, expect, it, vi } from 'vitest';

import { getBlogPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getBlogPage', () => {
  it('returns the page window with page math for a full corpus', async () => {
    // First runQuery call = window, second = count (Promise.all order).
    mockRun.mockResolvedValueOnce([
      makeRawPostCard({ _id: 'a' }),
      makeRawPostCard({ _id: 'b' }),
    ]);
    mockRun.mockResolvedValueOnce(20);

    const result = await getBlogPage({ page: 2, pageSize: 9 });

    expect(result.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(result.currentPage).toBe(2);
    expect(result.total).toBe(20);
    expect(result.totalPages).toBe(3); // ceil(20 / 9)
  });

  it('defaults to page 1 and POSTS_PER_PAGE', async () => {
    mockRun.mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);
    mockRun.mockResolvedValueOnce(1);

    const result = await getBlogPage();

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('returns totalPages 1 for an empty corpus', async () => {
    mockRun.mockResolvedValueOnce([]);
    mockRun.mockResolvedValueOnce(0);

    const result = await getBlogPage({ page: 1 });

    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1); // Math.max(1, ceil(0/9))
  });
});
```

(If `makeRawPostCard`'s actual signature differs, adapt the fixture calls — it is exported from `@blog/service/testing/fixtures`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @blog/service test -- loader.test --dir src/features/pages/blog`
(or simply `pnpm --filter @blog/service test`)
Expected: FAIL — `getBlogPage` does not accept args / count call missing.

- [ ] **Step 3: Implement**

`packages/service/src/features/pages/blog/adaptor/query.ts`:

```ts
import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

const blogPosts = q.star.filterByType('blog_post').order('publishedAt desc');

// groqd's `.slice` takes literal indices (GROQ has no $param slices), so the
// window query is a builder, not a module-level const.
export const buildBlogListQuery = (start: number, end: number) =>
  blogPosts.slice(start, end).project(postCardFragment);

export const blogPostsCountQuery = q.count(blogPosts);
```

`packages/service/src/features/pages/blog/adaptor/types.ts`:

```ts
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TBlogPage = {
  posts: TPostCard[];
  currentPage: number;
  totalPages: number;
  total: number;
};
```

`packages/service/src/features/pages/blog/adaptor/transformer.ts`:

```ts
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { buildBlogListQuery } from './query';
import type { TBlogPage } from './types';

type TRawBlogList = InferResultType<ReturnType<typeof buildBlogListQuery>>;

export function toBlogPage(
  rawPosts: TRawBlogList,
  total: number,
  currentPage: number,
  pageSize: number,
): TBlogPage {
  return {
    posts: rawPosts.map(toPostCard),
    currentPage,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    total,
  };
}
```

`packages/service/src/features/pages/blog/adaptor/loader.ts`:

```ts
import { POSTS_PER_PAGE } from '@blog/config';
import { isr, runQuery } from '@blog/service/sanity/query';

import { blogPostsCountQuery, buildBlogListQuery } from './query';
import { toBlogPage } from './transformer';
import type { TBlogPage } from './types';

export type TGetBlogPageArgs = {
  /** 1-based page number. */
  page?: number;
  pageSize?: number;
};

export async function getBlogPage({
  page = 1,
  pageSize = POSTS_PER_PAGE,
}: TGetBlogPageArgs = {}): Promise<TBlogPage> {
  const start = (page - 1) * pageSize;
  const [rawPosts, total] = await Promise.all([
    runQuery(buildBlogListQuery(start, start + pageSize), isr('posts')),
    runQuery(blogPostsCountQuery, isr('posts')),
  ]);
  return toBlogPage(rawPosts, total, page, pageSize);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @blog/service test`
Expected: PASS (new loader tests + all existing service tests).

### Task 3: `safeAsync` wrap + public exports

**Files:**

- Modify: `packages/service/src/features/pages/blog/application/service.ts`
- Modify: `packages/service/src/features/pages/blog/index.ts`
- Modify: `packages/service/src/index.ts` (export `TGetBlogPageArgs` beside `TBlogPage`)

**Interfaces:**

- Produces: `service.pages.blog.v1.getBlogPage(args?: TGetBlogPageArgs): Promise<AsyncResult<TBlogPage>>` — web must check `result.ok`.

- [ ] **Step 1: Rewrite the service wrapper** (mirrors `pages/home`):

`packages/service/src/features/pages/blog/application/service.ts`:

```ts
import {
  getBlogPage,
  type TGetBlogPageArgs,
} from '@blog/service/features/pages/blog/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createBlogService() {
  return {
    v1: {
      getBlogPage: (args?: TGetBlogPageArgs) => safeAsync(getBlogPage(args)),
    },
  };
}
```

`packages/service/src/features/pages/blog/index.ts`:

```ts
export type { TGetBlogPageArgs } from './adaptor/loader';
export type { TBlogPage } from './adaptor/types';
export { createBlogService } from './application/service';
```

In `packages/service/src/index.ts`, extend the existing line to
`export type { TBlogPage, TGetBlogPageArgs } from './features/pages/blog';`
(keeping alphabetical order within the export list).

- [ ] **Step 2: Type-check + full test run**

Run: `pnpm --filter @blog/service type-check && pnpm --filter @blog/service test`
Expected: green. (If an `application/service.test.ts` pattern exists in sibling features, add the matching ok/error wrap test the same way.)

### Task 4: route-builder adoption in existing transformers

**Files:**

- Modify: `packages/service/src/shared/transformers/to-link.ts`
- Modify: `packages/service/src/features/modules/hero/adaptor/transformer.ts`

- [ ] **Step 1: Swap the hardcoded templates**

In `to-link.ts`, add `routes` to the existing `@blog/config` import and replace the builder map values (the `Record` stays exhaustive over the generated `_type` union — that compile-time property is the point of the map, keep it):

```ts
import { routes, TLINK_TYPE, type ILink } from '@blog/config';
// …
const INTERNAL_HREF_BUILDERS: Record<
  TInternalReference['_type'],
  (slug: string) => string
> = {
  blog_post: routes.post,
  blog_category: routes.category,
  page_generic: routes.genericPage,
};
```

In the hero transformer (`primaryAction`), replace `` href: `/blog/${heroPost.slug}` `` with `href: routes.post(heroPost.slug)` (import `routes` from `@blog/config`).

- [ ] **Step 2: Verify outputs unchanged**

Run: `pnpm --filter @blog/service test && pnpm --filter @blog/service type-check && pnpm --filter @blog/service lint`
Expected: green — existing hero/link tests pin identical href output.

### PR 2 gate block

- [ ] Root verify: `pnpm type-check && pnpm lint && pnpm test && pnpm build` — all green.
- [ ] Dispatch `reviewer` subagent; fix blockers until `APPROVE`.
- [ ] **GATE (ask user): commit** — `feat(service): paginate blog page query + adopt routes builder`.
- [ ] **GATE (ask user): push.**
- [ ] **GATE (ask user): open PR** — references #75 (no close). Board: #75 → Code Review; after merge → In Progress; pull `main`.

---

## PR 3 — `ui`: `Pagination` organism

Branch (from `main`; independent of PR 1/2): `feat/ui-pagination`.
**Delegate to the `ui` subagent** (skills: `ui-library-practices`, `ui-storybook`, `testing-practices`).

### Task 5: `Pagination` organism + tests + story + barrel

**Files:**

- Create: `packages/ui/src/organisms/pagination/pagination-variants.ts`
- Create: `packages/ui/src/organisms/pagination/pagination.tsx`
- Create: `packages/ui/src/organisms/pagination/pagination.test.tsx`
- Create: `packages/ui/src/organisms/pagination/pagination.stories.tsx`
- Create: `packages/ui/src/organisms/pagination/index.ts`
- Modify: `packages/ui/src/organisms/index.ts` (barrel export)

**Interfaces:**

- Consumes: `IWithDataTestId` from `@blog/config`, `TAnchorElementType` from `@blog/config/react`, `tv` from `@blog/ui/lib/styling`.
- Produces: `Pagination` component with props `IPaginationProps { currentPage: number; totalPages: number; createHref: (page: number) => string; ariaLabel: string; previousLabel: string; nextLabel: string; linkAs?: TAnchorElementType; className?: string }` (+ `IWithDataTestId`). Renders `null` when `totalPages <= 1`.

Copy rule: **all visible/aria text arrives via props** (`ariaLabel`, `previousLabel`, `nextLabel` — required, no defaults), per the repo's no-hardcoded-copy convention. All page numbers render (no ellipsis windowing — YAGNI for this corpus size; the category page revisits if needed).

- [ ] **Step 1: Write the failing test**

`packages/ui/src/organisms/pagination/pagination.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { Pagination } from './pagination';

const createHref = (page: number) =>
  page === 1 ? '/blog' : `/blog/page/${page}`;

const baseProps = {
  createHref,
  ariaLabel: 'Blog pages',
  previousLabel: 'Previous',
  nextLabel: 'Next',
};

describe(`<${Pagination.name}/>`, () => {
  it('renders a labeled nav with a link per page and correct hrefs', () => {
    render(<Pagination {...baseProps} currentPage={2} totalPages={3} />);

    expect(
      screen.getByRole('navigation', { name: 'Blog pages' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'href',
      '/blog/page/2',
    );
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      '/blog/page/3',
    );
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination {...baseProps} currentPage={2} totalPages={3} />);

    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '1' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('hides previous on the first page and next on the last page', () => {
    const { rerender } = render(
      <Pagination {...baseProps} currentPage={1} totalPages={3} />,
    );
    expect(
      screen.queryByRole('link', { name: 'Previous' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/blog/page/2',
    );

    rerender(<Pagination {...baseProps} currentPage={3} totalPages={3} />);
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/blog/page/2',
    );
    expect(
      screen.queryByRole('link', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when there is a single page', () => {
    const { container } = render(
      <Pagination {...baseProps} currentPage={1} totalPages={1} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders links via linkAs when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );

    render(
      <Pagination
        {...baseProps}
        currentPage={2}
        totalPages={3}
        linkAs={CustomLink}
      />,
    );

    // 3 page links + prev + next
    expect(screen.getAllByTestId('custom-link')).toHaveLength(5);
  });

  it('forwards data-testid', () => {
    render(
      <Pagination
        {...baseProps}
        currentPage={1}
        totalPages={2}
        dataTestId="blog-pagination"
      />,
    );
    expect(screen.getByTestId('blog-pagination')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @blog/ui test -- pagination`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement variants + component**

`packages/ui/src/organisms/pagination/pagination-variants.ts` (align token classes with existing organisms — `posts-section-variants.ts` is the reference; structure below, exact tokens per `ui-library-practices`):

```ts
import { tv } from '@blog/ui/lib/styling';

export const paginationVariants = tv({
  slots: {
    root: 'mt-8 flex items-center justify-center gap-2',
    list: 'm-0 flex list-none items-center gap-1 p-0',
    item: '',
    link: [
      'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2',
      'font-mono text-label text-subtle',
      'transition-colors',
    ],
  },
  variants: {
    current: {
      true: { link: 'text-inherit underline underline-offset-4' },
    },
  },
});
```

`packages/ui/src/organisms/pagination/pagination.tsx`:

```tsx
import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import type { ElementType } from 'react';

import { paginationVariants } from './pagination-variants';

export interface IPaginationProps extends IWithDataTestId {
  /** 1-based current page. */
  currentPage: number;
  totalPages: number;
  /** Builds the href for a page number — URL scheme stays in the app. */
  createHref: (page: number) => string;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  /** Component links render as — pass the app router's Link for client-side navigation. */
  linkAs?: TAnchorElementType;
  className?: string;
}

const s = paginationVariants();

/**
 * Pagination — prev/next + numbered links for paginated listings. Route-
 * agnostic (`createHref`) and polymorphic (`linkAs`), mirroring PostsSection.
 * Renders nothing when there is a single page.
 *
 * @example
 * <Pagination
 *   currentPage={2}
 *   totalPages={5}
 *   createHref={routes.blogIndex}
 *   ariaLabel="Blog pages"
 *   previousLabel="Previous"
 *   nextLabel="Next"
 *   linkAs={Link}
 * />
 */
export const Pagination = ({
  currentPage,
  totalPages,
  createHref,
  ariaLabel,
  previousLabel,
  nextLabel,
  linkAs,
  className,
  dataTestId,
}: IPaginationProps) => {
  if (totalPages <= 1) return null;

  const Component = (linkAs ?? 'a') as ElementType;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label={ariaLabel}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      {currentPage > 1 && (
        <Component href={createHref(currentPage - 1)} className={s.link()}>
          {previousLabel}
        </Component>
      )}
      <ul className={s.list()}>
        {pages.map((page) => (
          <li key={page} className={s.item()}>
            <Component
              href={createHref(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={s.link({ current: page === currentPage })}
            >
              {page}
            </Component>
          </li>
        ))}
      </ul>
      {currentPage < totalPages && (
        <Component href={createHref(currentPage + 1)} className={s.link()}>
          {nextLabel}
        </Component>
      )}
    </nav>
  );
};
```

`packages/ui/src/organisms/pagination/index.ts`:

```ts
export type { IPaginationProps } from './pagination';
export { Pagination } from './pagination';
```

In `packages/ui/src/organisms/index.ts`, add (alphabetical — after `./hero`):

```ts
export type { IPaginationProps } from './pagination';
export { Pagination } from './pagination';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @blog/ui test -- pagination`
Expected: PASS (6 tests).

- [ ] **Step 5: Story** (`ui-storybook` conventions — mirror `posts-section.stories.tsx` structure):

`packages/ui/src/organisms/pagination/pagination.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';

import { Pagination } from './pagination';

const createHref = (page: number) =>
  page === 1 ? '/blog' : `/blog/page/${page}`;

const meta = {
  title: 'Organisms/Pagination',
  component: Pagination,
  args: {
    createHref,
    ariaLabel: 'Blog pages',
    previousLabel: 'Previous',
    nextLabel: 'Next',
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddlePage: Story = {
  args: { currentPage: 3, totalPages: 5 },
};

export const FirstPage: Story = {
  args: { currentPage: 1, totalPages: 5 },
};

export const LastPage: Story = {
  args: { currentPage: 5, totalPages: 5 },
};
```

- [ ] **Step 6: Per-package checks**

Run: `pnpm --filter @blog/ui type-check && pnpm --filter @blog/ui lint && pnpm --filter @blog/ui test`
Expected: green. Optionally `pnpm --filter @blog/ui storybook:build` to confirm the story compiles.

### PR 3 gate block

- [ ] Root verify: `pnpm type-check && pnpm lint && pnpm test && pnpm build`.
- [ ] `reviewer` subagent until `APPROVE`.
- [ ] **GATE (ask user): commit** — `feat(ui): Pagination organism`.
- [ ] **GATE (ask user): push.**
- [ ] **GATE (ask user): open PR** — body: `Closes #85`, references #75. Board: **#85** → Code Review (fetch its item ID first — not yet in the memory table; append it there). After merge, #85 auto-closes → verify board shows Done.

---

## PR 4 — `web`: `/blog` + `/blog/page/[page]` routes

Branch (from `main` **after PRs 1–3 merge**): `feat/web-blog-list-route`.
**Delegate to the `web` subagent** (skills: `seo-and-metadata`, `testing-practices`).

### Task 6: page-param parsing util

**Files:**

- Create: `apps/web/src/utils/parse-page-param/parse-page-param.ts`
- Create: `apps/web/src/utils/parse-page-param/parse-page-param.test.ts`

**Interfaces:**

- Produces: `parsePageParam(raw: string): number | null` — `null` for anything that is not a canonical positive integer (rejects `0`, `02`, `1.5`, `-1`, `abc`, ` 2`, `1e2`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { parsePageParam } from './parse-page-param';

describe('parsePageParam', () => {
  it('parses canonical positive integers', () => {
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('2')).toBe(2);
    expect(parsePageParam('10')).toBe(10);
  });

  it('rejects non-canonical or non-numeric values', () => {
    for (const raw of ['0', '02', '-1', '1.5', 'abc', '', ' 2', '1e2', '2 ']) {
      expect(parsePageParam(raw)).toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter web test -- parse-page-param`. Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
const CANONICAL_POSITIVE_INT = /^[1-9]\d*$/;

/**
 * Parses a pagination path segment. Only the canonical decimal form is
 * accepted — `02`, `1.5`, `1e2` etc. return null so the route can hard-404
 * instead of serving duplicate URLs for the same page.
 */
export function parsePageParam(raw: string): number | null {
  if (!CANONICAL_POSITIVE_INT.test(raw)) return null;
  return Number(raw);
}
```

- [ ] **Step 4: Run to verify it passes** — same command. Expected: PASS.

### Task 7: `BlogPageTemplate` + shared `BlogListPage` composition

**Files:**

- Create: `apps/web/src/components/blog-page-template/blog-page-template-variants.ts`
- Create: `apps/web/src/components/blog-page-template/blog-page-template.tsx`
- Create: `apps/web/src/components/blog-page-template/blog-page-template.test.tsx`
- Create: `apps/web/src/components/blog-list-page/blog-list-page.tsx`

**Interfaces:**

- Consumes: `service.pages.blog.v1.getBlogPage({ page })` → `AsyncResult<TBlogPage>` (PR 2); `PostsSection`, `Pagination` from `@blog/ui` (PR 3); `routes`, `POSTS_PER_PAGE` n/a here; `Link` from `@web/i18n/navigation`; `formatDate` from `@web/utils/format-date`.
- Produces: `BlogPageTemplate({ heading, posts, pagination? })` (pure layout, `<main>` only — Header/Footer owned by `layout.tsx`, matching `HomePageTemplate`); `BlogListPage({ page, locale })` async Server Component used by both routes — **calls `notFound()` when `page > totalPages` or the fetch fails**.

- [ ] **Step 1: Write the failing template test**

`apps/web/src/components/blog-page-template/blog-page-template.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BlogPageTemplate } from './blog-page-template';

describe(`<${BlogPageTemplate.name}/>`, () => {
  it('renders the heading as the page h1 with posts and pagination slots', () => {
    render(
      <BlogPageTemplate
        heading="Blog"
        posts={<div data-testid="posts-slot" />}
        pagination={<div data-testid="pagination-slot" />}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(screen.getByRole('main')).toBeVisible();
    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-slot')).toBeInTheDocument();
  });

  it('renders without a pagination slot', () => {
    render(
      <BlogPageTemplate
        heading="Blog"
        posts={<div data-testid="posts-slot" />}
      />,
    );

    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter web test -- blog-page-template`. Expected: FAIL.

- [ ] **Step 3: Implement template**

`blog-page-template-variants.ts` (mirrors `home-page-template-variants.ts` tokens):

```ts
import { tv } from 'tailwind-variants';

export const blogPageTemplateVariants = tv({
  slots: {
    root: ['bg-bg mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    heading: 'mb-6',
  },
});
```

`blog-page-template.tsx`:

```tsx
import type { ReactNode } from 'react';

import { blogPageTemplateVariants } from './blog-page-template-variants';

export interface IBlogPageTemplateProps {
  heading: string;
  posts: ReactNode;
  pagination?: ReactNode;
}

const s = blogPageTemplateVariants();

/**
 * BlogPageTemplate — the blog index's page-level shell (h1 + posts +
 * pagination). `Header`/`Footer` stay owned by `layout.tsx`, matching
 * `HomePageTemplate`.
 */
export const BlogPageTemplate = ({
  heading,
  posts,
  pagination,
}: IBlogPageTemplateProps) => (
  <main className={s.root()}>
    <h1 className={s.heading()}>{heading}</h1>
    {posts}
    {pagination}
  </main>
);
```

- [ ] **Step 4: Run to verify it passes** — same command. Expected: PASS.

- [ ] **Step 5: Implement the shared composition** (no test — it is a thin fetch-and-map Server Component in the `PostListModule` mold; the pieces it wires are tested in their own layers):

`apps/web/src/components/blog-list-page/blog-list-page.tsx`:

```tsx
import { routes } from '@blog/config';
import { service } from '@blog/service';
import { Pagination, PostsSection } from '@blog/ui';
import { BlogPageTemplate } from '@web/components/blog-page-template/blog-page-template';
import { Link } from '@web/i18n/navigation';
import { formatDate } from '@web/utils/format-date';
import { notFound } from 'next/navigation';

export interface IBlogListPageProps {
  /** 1-based, already validated as a canonical positive integer. */
  page: number;
  locale: string;
}

/**
 * BlogListPage — shared composition for `/blog` (page 1) and
 * `/blog/page/[page]` (pages ≥ 2): fetches one page window via the blog
 * service and renders it through the pure ui organisms.
 */
export async function BlogListPage({ page, locale }: IBlogListPageProps) {
  const result = await service.pages.blog.v1.getBlogPage({ page });

  if (!result.ok) {
    console.error(`Error to fetch blog page: ${result.error}`);
    notFound();
  }

  const { posts, currentPage, totalPages } = result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page > totalPages) notFound();

  const items = posts.map((post) => ({
    id: post.id,
    href: routes.post(post.slug),
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    formattedDate: formatDate(post.publishedAt, locale),
    categories: post.categories,
  }));

  return (
    <BlogPageTemplate
      heading="Blog"
      posts={
        <PostsSection
          posts={items}
          title="All posts"
          titleId="blog-posts-title"
          linkAs={Link}
        />
      }
      pagination={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          createHref={routes.blogIndex}
          ariaLabel="Blog pages"
          previousLabel="Previous"
          nextLabel="Next"
          linkAs={Link}
        />
      }
    />
  );
}
```

### Task 8: routes + metadata + redirect + `post-list-module` adoption

**Files:**

- Create: `apps/web/src/app/[locale]/blog/page.tsx`
- Create: `apps/web/src/app/[locale]/blog/page/[page]/page.tsx`
- Create: `apps/web/src/components/blog-list-page/blog-list-metadata.ts`
- Modify: `apps/web/src/modules/post-list/post-list-module.tsx` (adopt `routes.post`)
- Modify: `SPEC.md` (§1 surfaces table: Blog row → ✅)

**Interfaces:**

- Consumes: `BlogListPage`, `parsePageParam` (Tasks 6–7); `permanentRedirect` from `@web/i18n/navigation`; `setRequestLocale` from `next-intl/server`; `ILocalizedParams` from `@blog/config`.

- [ ] **Step 1: Shared metadata builder**

`apps/web/src/components/blog-list-page/blog-list-metadata.ts`:

```ts
import { routes } from '@blog/config';
import { service } from '@blog/service';
import type { Metadata } from 'next';

/**
 * Metadata for a blog list page. Every page self-canonicalizes — page 2+
 * must NEVER canonical to /blog (spec do-not-change rule). No rel=next/prev.
 */
export async function buildBlogListMetadata(page: number): Promise<Metadata> {
  const settingsResult = await service.global.siteSettings.v1.getSiteSettings();
  const description = settingsResult.ok ? settingsResult.data.description : '';

  return {
    title: page === 1 ? 'Blog' : `Blog – Page ${page}`,
    description,
    alternates: { canonical: routes.blogIndex(page) },
  };
}
```

- [ ] **Step 2: Page-1 route**

`apps/web/src/app/[locale]/blog/page.tsx`:

```tsx
import type { ILocalizedParams } from '@blog/config';
import { BlogListPage } from '@web/components/blog-list-page/blog-list-page';
import { buildBlogListMetadata } from '@web/components/blog-list-page/blog-list-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams>;
};

export function generateMetadata(): Promise<Metadata> {
  return buildBlogListMetadata(1);
}

export default async function BlogIndexPage({ params }: TProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BlogListPage page={1} locale={locale} />;
}
```

- [ ] **Step 3: Page-N route**

`apps/web/src/app/[locale]/blog/page/[page]/page.tsx`:

```tsx
import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { BlogListPage } from '@web/components/blog-list-page/blog-list-page';
import { buildBlogListMetadata } from '@web/components/blog-list-page/blog-list-metadata';
import { permanentRedirect } from '@web/i18n/navigation';
import { parsePageParam } from '@web/utils/parse-page-param/parse-page-param';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { page: string }>;
};

// Pages beyond the build-time list still render on demand via ISR
// (dynamicParams defaults to true); correctness rides on the explicit
// range check in BlogListPage, not on this list.
export async function generateStaticParams() {
  const result = await service.pages.blog.v1.getBlogPage({ page: 1 });
  if (!result.ok) return [];

  return Array.from(
    { length: Math.max(0, result.data.totalPages - 1) },
    (_, i) => ({
      page: String(i + 2),
    }),
  );
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (page === null || page < 2) return {};
  return buildBlogListMetadata(page);
}

export default async function BlogListNumberedPage({ params }: TProps) {
  const { locale, page: rawPage } = await params;
  setRequestLocale(locale);

  const page = parsePageParam(rawPage);

  // Non-canonical / non-numeric → hard 404 (never a soft-404).
  if (page === null) notFound();

  // Page 1 has exactly one URL: /blog. 308 — SEO-equivalent to a 301.
  if (page === 1) {
    permanentRedirect({ href: routes.blogIndex(1), locale });
  }

  return <BlogListPage page={page} locale={locale} />;
}
```

**Verify the next-intl `permanentRedirect` signature via the `use-context7` skill before finalizing** — the object form `{ href, locale }` is the next-intl v4 API; if this repo's version differs, adapt (worst case fall back to `next/navigation`'s `permanentRedirect(routes.blogIndex(1))`, which is locale-safe here because `localePrefix: 'never'`).

- [ ] **Step 4: Adopt `routes.post` in `post-list-module.tsx`**

Replace `` href: `/blog/${post.slug}` `` with `href: routes.post(post.slug)`; add `routes` to the imports from `@blog/config`.

- [ ] **Step 5: Update `SPEC.md`** §1 surfaces table — Blog row: `| Blog | `/blog`(+`/blog/page/N`) | ✅ Built — paginated (#75) |`. (Spec-sync rule: same PR.)

- [ ] **Step 6: Verify the routes end-to-end**

Run: `pnpm --filter web test && pnpm --filter web type-check && pnpm --filter web lint`
Expected: green.

Run: `pnpm --filter web build` (root `pnpm build` in the gate block covers turbo env)
Expected: build succeeds; the build output lists `/blog` as static and `/blog/page/[page]` with the generated params (or none, single-page corpus).

Then drive it (the `verify` habit): `pnpm --filter web dev`, check `http://localhost:3000/blog` renders the seeded posts, `/blog/page/1` redirects to `/blog` (308), `/blog/page/2` 404s if out of range, `/blog/page/abc` and `/blog/page/02` 404.

### PR 4 gate block

- [ ] Root verify: `pnpm type-check && pnpm lint && pnpm test && pnpm build` — all green.
- [ ] `reviewer` subagent until `APPROVE`.
- [ ] **GATE (ask user): commit** — `feat(web): paginated /blog index + /blog/page/N routes`.
- [ ] **GATE (ask user): push.**
- [ ] **GATE (ask user): open PR** — body: `Closes #75`, references #85/spec. Board: #75 → Code Review; after merge verify #75 shows Done.

---

## Self-review notes (already applied)

- Spec coverage: route map rows for `/blog` + `/blog/page/N` (Tasks 6–8), route-builder + adoption in all three scattered sites (Tasks 1, 4, 8), `safeAsync` consistency (Task 3), self-canonical metadata + 308 redirect + hard 404 (Task 8), RWD inherited via `PostsSection` (no work), per-layer PR gates (gate blocks). Sitemap/JSON-LD/#91/#327/#328 are other tickets by design.
- Deviations from spec, both justified inline: two parallel queries instead of one composite (groqd `.slice` takes literals; category-loader precedent), `ariaLabel` required + `previousLabel`/`nextLabel` props (repo's no-hardcoded-copy rule).
- Type consistency: `TGetBlogPageArgs`/`TBlogPage` names match across Tasks 2/3/7; `routes.blogIndex` signature `(page?: number) => string` matches `createHref: (page: number) => string`.
