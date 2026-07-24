# Blog list page with pagination — design

> **Archived — implemented.** See SPEC.md §1. Product summary (Blog surface) for current behavior.

- **Issues:** #75 (P3b: `/blog` route + Pagination), #85 (P3b: Pagination organism)
- **Date:** 2026-07-14
- **Layers:** `config → service → ui → web` (dependency order). No schema change → **no migration**.

## Site-wide routing system (context for this and future routes)

Decided in the 2026-07-14 routing brainstorm; this feature implements the
`/blog` rows and establishes the conventions the rest adopt.

```
/                          home                              built
/blog                      post index, page 1                this feature (#75)
/blog/page/N               post index, page N ≥ 2            this feature (#75)
/blog/[slug]               post detail                       #76
/category/[slug]           category, page 1                  #91
/category/[slug]/page/N    category pagination               #91 (convention noted there)
/author/[slug]             author profile + posts            #327 (service layer already built)
/[slug]                    generic pages                     #285 (+ #328 RESERVED_SLUGS guard)
/sitemap.xml /robots.txt /rss.xml                            #92
```

- Next's route priority (**static › dynamic › catch-all**) makes the tree safe:
  every static section segment (`blog`, `category`, `author`, `page/`) beats
  the dynamic siblings, including the root generic `/[slug]`.
- **Single route-builder in `@blog/config`** (`routes.post(slug)`,
  `routes.blogIndex(page?)`, `routes.category(slug)`, `routes.author(slug)`, …)
  — the one source of URL truth. Today URL knowledge is scattered across
  `service/shared/transformers/to-link.ts`, the hero transformer, and
  `post-list-module.tsx`; all adopt the builder (each refactor lands in its own
  layer's PR). Web's pagination `createHref`, the sitemap (#92), and JSON-LD
  (#94) consume it too.
- **Pagination convention is system-wide:** `/x/page/N`, self-canonical,
  `page/1` → permanent redirect to the base, out-of-range → hard 404. Category
  pages adopt it in #91 (comment posted there).
- **Reserved slugs (#328):** the root `/[slug]` is shadowed by every static
  segment, so `RESERVED_SLUGS` in `@blog/config` + cms slug validation prevent
  editors creating unreachable pages (`blog`, `category`, `author`, `api`, …).

## Goal

Ship the `/blog` index: a paginated, responsive list of published posts,
reusing the existing `PostsSection` organism and adding a new `Pagination`
organism. Path-based pagination (`/blog`, `/blog/page/N`) for clean,
self-canonical URLs.

## Non-goals

- Post detail route (#76) — separate ticket.
- Category-page reuse of `Pagination` / paginated query (#91) — this design
  makes both reusable, but wiring them into the category route is out of scope
  (convention comment posted on #91).
- Author profile route (#327) and `RESERVED_SLUGS` guard (#328) — filed from
  this brainstorm, built separately.
- Filtering / search / sort controls.

## Context (current state)

- **service** `features/pages/blog` already exists but fetches **all** posts
  (`blogListQuery` = `blog_post` ordered `publishedAt desc`, projected through
  `postCardFragment`). `createBlogService` returns `getBlogPage` **raw** —
  inconsistent with `home`, which wraps in `safeAsync` (Result).
- **ui** has `PostsSection` (the reusable labeled post grid, polymorphic
  `linkAs`, responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`),
  `PostCard`, `Header`, `Footer`. No `Pagination` organism yet.
- **web** routes are locale-nested under `app/[locale]/`
  (`localePrefix: 'never'`, single `en` locale → URLs are unprefixed).
  `Header`/`Footer` are owned by `[locale]/layout.tsx` and wrap all children.
  The `PostListModule` shows the canonical composition: fetch service → map to
  `IPostCardData` (`href: '/blog/${slug}'`, `formattedDate: formatDate(...)`)
  → render `PostsSection linkAs={Link}`. No `/blog` route exists yet.

## Design

### Layer 0 — `config` (`packages/config/src/routes.ts`)

- **Route-builder module** — typed functions returning app paths, `as const`
  where applicable:
  ```ts
  export const routes = {
    home: () => '/',
    blogIndex: (page = 1) => (page === 1 ? '/blog' : `/blog/page/${page}`),
    post: (slug: string) => `/blog/${slug}`,
    category: (slug: string) => `/category/${slug}`,
    author: (slug: string) => `/author/${slug}`,
  };
  ```
  (Category pagination and generic pages extend this in #91/#285.) Lives in
  `@blog/config` so both `service` (href-emitting transformers) and `web`
  consume one source of URL truth. Unit test the page-1-vs-N branch.

### Layer 1 — `service` (`packages/service/src/features/pages/blog`)

- **Query** — replace the fetch-all `blogListQuery` with a paginated shape:
  - order `blog_post` by `publishedAt desc`;
  - a **window** projection using a GROQ slice `[$start...$end]` projected
    through `postCardFragment`;
  - a **total** via `count(*[_type == "blog_post"])`.
  - Prefer a single query returning `{ posts, total }` (a projected object over
    the ordered set) so one round-trip covers both. Use groqd's explicit
    projection + `.notNull()` on required fields per service conventions; no
    faked defaults.
- **Loader** — `getBlogPage({ page, pageSize })` computes `start`/`end`
  (`start = (page - 1) * pageSize`, `end = start + pageSize`), runs the query
  under `isr('posts')`, and returns:
  ```ts
  export type TBlogPage = {
    posts: TPostCard[];
    currentPage: number;
    totalPages: number; // Math.max(1, Math.ceil(total / pageSize))
    total: number;
  };
  ```
  `pageSize` has a default constant (see Decisions); `page` is 1-based.
- **Service wrapper** — wrap in `safeAsync` for Result consistency:
  ```ts
  v1: {
    getBlogPage: (args) => safeAsync(getBlogPage(args));
  }
  ```
- **Route-builder adoption** — replace the hardcoded URL templates in
  `shared/transformers/to-link.ts` (`/blog/${slug}`, `/category/${slug}`) and
  the hero transformer (`/blog/${heroPost.slug}`) with `routes.*` from
  `@blog/config`. Mechanical; existing tests pin the output.
- **Tests** — transformer/loader with sparse fixtures: full page, partial last
  page, empty corpus (`totalPages === 1`, `posts === []`), page math.

### Layer 2 — `ui` (`packages/ui/src/organisms/pagination`)

Pure, prop-driven organism. **No `'use client'`, no Sanity imports.**

- **Props:**
  ```ts
  interface IPaginationProps {
    currentPage: number;
    totalPages: number;
    createHref: (page: number) => string; // URL scheme lives in web, not ui
    linkAs?: TAnchorElementType; // defaults to <a>, web passes Link
    ariaLabel?: string; // no hardcoded aria-label
    className?: string;
  }
  ```
  Rationale for `createHref` over #85's `basePath`: the `/blog/page/N` scheme
  is app-routing knowledge and must stay out of `ui` (web passes
  `routes.blogIndex` from the `@blog/config` route-builder). The organism stays
  route-agnostic and mirrors `PostsSection`'s polymorphic `linkAs`.
- **Render:** `<nav aria-label={ariaLabel}>` containing prev link, page-number
  links, next link. Prev hidden on page 1; next hidden on last page. Active
  page marked with `aria-current="page"`. Each link built via
  `createHref(n)` and rendered through `linkAs`.
- **Files:** `pagination.tsx`, `pagination-variants.ts` (`tv`),
  `pagination.test.tsx`; export from the organisms barrel.
- **Tests:** correct hrefs per page, prev hidden on page 1, next hidden on last
  page, `aria-current` on the active page, renders `null`/nothing meaningful
  when `totalPages <= 1`.

### Layer 3 — `web` (`apps/web/src/app/[locale]/blog`)

- **Route map** — the full `app/[locale]/blog/` tree and how the three routes
  coexist (post detail `[slug]` is #76, listed here only to show the layout it
  must not collide with):

  ```
  app/[locale]/blog/
    page.tsx                  → /blog          list, page 1        (this PR)
    page/[page]/page.tsx      → /blog/page/N   list, pages ≥ 2      (this PR)
    [slug]/page.tsx           → /blog/{slug}   post detail          (#76, later)
  ```

  Next.js route priority is **static › dynamic `[x]` › catch-all** (verified
  against `sorted-routes.ts`), so the static `page/` segment always wins over
  `[slug]`: `/blog/page/2` resolves to pagination, `/blog/my-post` to the post
  route. No catch-all (`[...]`/`[[...]]`) is used — it would inherit the slug
  collision or force one file to discriminate pagination-vs-slug, with no
  consolidation gain (page 1 sits at a different level regardless). See
  Decisions.

- **`/blog` — `blog/page.tsx`:** list page 1.
- **`/blog/page/N` — `blog/page/[page]/page.tsx`:** pages ≥ 2.
  - `generateStaticParams` enumerates `2…totalPages` at build.
  - **Keep `dynamicParams = true`** (the default): a page that appears later as
    the corpus grows (e.g. page 4) renders on-demand via ISR without a rebuild.
    Correctness therefore rides on the explicit range check below, not on the
    pre-generated list.
  - A `page` param that is non-numeric, has a leading zero / non-canonical form,
    `< 2` (except `1`, see below), or `> totalPages` → `notFound()` (hard 404 —
    never a soft-404 with an empty 200, never a redirect to the last page).
  - **`/blog/page/1` → permanent redirect to `/blog`.** Use Next's
    `permanentRedirect('/blog')` (emits **308**, permanent — SEO-equivalent to a
    301; the App Router does not emit a literal 301) so page 1 has exactly one
    URL and no duplicate exists.
- Both list routes delegate to a shared **`BlogPageTemplate`**
  (`@web/components/blog-page-template`) that renders the `<main>` only —
  `Header`/`Footer` come from the layout, matching `HomePageTemplate`.
- **Data flow:** fetch `service.pages.blog.v1.getBlogPage({ page })`; on
  `!result.ok` → `notFound()` (log the error, per existing routes). Map
  `posts` → `IPostCardData` (`href: routes.post(slug)`,
  `formattedDate: formatDate(post.publishedAt, locale)`). Render
  `<h1>Blog</h1>` + `PostsSection linkAs={Link}` + `Pagination linkAs={Link}
createHref={routes.blogIndex} ariaLabel=...`.
- **Route-builder adoption:** `post-list-module.tsx`'s hardcoded
  `/blog/${post.slug}` also switches to `routes.post(slug)` in this PR.
- **Metadata:** `generateMetadata` per page — page 1 title `"Blog"`, canonical
  `/blog`; page N title `"Blog – Page N"`, canonical `/blog/page/N`. All pages
  indexable. Description falls back to site settings, like the home route.
- **SEO / pagination best practices:**
  - **Self-canonical, never canonical-to-page-1.** Each page canonicals to
    **itself** (`/blog/page/2` → `/blog/page/2`). Do **not** point page 2+ at
    `/blog` — that de-indexes deep pages and can orphan posts only reachable via
    pagination. This is a do-not-change rule.
  - **No `rel="next"`/`rel="prev"`** — deprecated by Google (2019), marginal
    value elsewhere; rely on crawlable anchor links + the sitemap instead.
  - **Discovery must not depend on pagination.** Every post is enumerated in the
    sitemap and reachable via category pages independently, so deep pages are a
    UX convenience, not the sole crawl path. Sitemap enumeration of posts is
    owned by **#92** (separate ticket) — this route does not substitute for it.
- **RWD:** inherited from `PostsSection`'s responsive grid
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) — no grid changes.
- **Tests:** template/route renders posts; pagination boundaries (page 1 has no
  prev, last page has no next); metadata canonical is **self** per page (page N
  → `/blog/page/N`, not `/blog`); `/blog/page/1` → permanent redirect to
  `/blog`; out-of-range page → not found.

## Decisions

- **URL scheme:** path-based `/blog` + `/blog/page/N` (chosen for SEO / clean
  URLs). Each page self-canonicalizes (not canonical-to-page-1). The static
  `page/` segment is required: posts live at `/blog/[slug]` (#76), so a bare
  `/blog/2` would collide with the slug route — namespacing pagination under
  `page/` is the standard disambiguator (WordPress/Ghost convention).
- **Segment is singular (`page`, not `pages`):** reads as "page N", matches the
  universal blog convention, and avoids confusion with the generic site-`pages`
  concept (#285).
- **No catch-all route (`[...]`/`[[...]]`):** the pagination shape is fixed (one
  known extra segment), so a static `page/` + single `[page]` is the idiomatic
  fit. A catch-all would inherit the `/blog/[slug]` collision or tangle
  pagination and post-slug handling into one file, and yields no consolidation
  (page 1 lives at a different route level). Catch-alls are for arbitrary-depth
  paths, which this is not.
- **Page 1 has one URL:** only `/blog`; `/blog/page/1` permanently redirects
  (308 via `permanentRedirect`) to it.
- **No `rel=next/prev`; self-canonical per page; out-of-range → hard 404.**
- **Page size:** `POSTS_PER_PAGE = 9` (fills the 3×3 responsive grid; viewport-
  **independent** so static generation and canonicals stay stable). Defined as
  a constant so it is easy to tune.
- **Reuse `PostsSection`** rather than a bespoke grid; RWD comes with it.
- **URL scheme stays out of `ui`** via `createHref`; the `Pagination` organism
  is route-agnostic. The URL truth itself lives in the `@blog/config`
  route-builder (`routes.blogIndex`), which `web` passes as `createHref`.

## Delivery — four separate per-layer PRs (required)

Per `CLAUDE.md` ("Prefer per-layer PRs") and the `open-pull-request` skill, this
feature **ships as four separate PRs**, one per layer, in dependency order.
This is not optional here: the green-independence precondition is satisfied
(verified 2026-07-14 — nothing outside `features/pages/blog/` consumes
`getBlogPage`/`blogListQuery`; the only external reference is the `TBlogPage`
type re-export in `service/index.ts`), so each layer merges to `main` green on
its own and no partial merge breaks the build.

1. **`config` PR** — `routes.ts` route-builder + unit tests. Green alone:
   purely additive, no consumer yet.
2. **`service` PR** — paginated blog query (slice + count) + `safeAsync` wrap +
   extended `TBlogPage` + tests; adopt `routes.*` in `to-link.ts` + hero
   transformer. Green alone: no external consumer of the changed signature;
   href outputs unchanged (tests pin them).
3. **`ui` PR** — `Pagination` organism + variants + tests + barrel export.
   Green alone: purely additive.
4. **`web` PR** — `/blog` + `/blog/page/[page]` routes, `BlogPageTemplate`,
   metadata, tests; adopt `routes.*` in `post-list-module`. Green alone once
   PRs 1–3 have merged. Updates `SPEC.md` §1 surfaces table (spec-sync rule).

Each PR runs the full gate sequence independently (reviewer `APPROVE` → ask
commit → ask push → ask PR → board → Code Review). `service` pagination and the
`Pagination` organism are both reused later by the category page (#91).

## Acceptance (rolls up #75 + #85)

- `/blog` renders paginated real content; `/blog/page/N` reachable and
  statically generated; out-of-range → hard 404; `/blog/page/1` → permanent
  redirect to `/blog`.
- `Pagination` is prop-driven and tested; no `'use client'`, no Sanity.
- Responsive across breakpoints (inherited grid).
- Per-page metadata with **self** canonical (never canonical-to-page-1); no
  `rel=next/prev`.
