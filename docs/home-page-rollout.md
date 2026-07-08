# Home Page Rollout

This document is the durable reference for rolling out the Home page only. It
keeps the Home slice separate from the later blog list, post detail, category,
feeds, deployment, and Phase 4 page-builder work.

## Scope

The Home page is the root route rendered by `apps/web/src/app/[locale]/page.tsx`.
It should ship as one vertical slice in dependency order:

```txt
cms -> typegen -> service -> ui -> web -> QA
```

The slice includes:

- A dedicated `homePage` singleton document in Sanity Studio.
- A typed `service.pages.home.v1.getHomePage()` data shape.
- Existing `@blog/ui` Home components aligned to the design reference.
- Web composition and metadata for the localized Home route.

The slice excludes:

- Post detail implementation.
- Blog list and category pages.
- Generic page-builder modules.
- `page.template` rendering.
- RSS, sitemap, revalidation, deploys, and PR automation.

## Progress Handoff

Last updated: 2026-07-07.

Implemented:

- Added the dedicated `homePage` singleton schema.
- Added managed `link` documents for reusable internal and external actions.
- Organized Studio into Pages, Blog, and Settings groups.
- Regenerated Sanity types after the Home and Link schema changes.
- Updated the Home service query, transformer, loader, and tests.
- Updated the localized Home route to consume the route-ready Home service
  contract.
- Aligned existing `@blog/ui` Hero, PostGrid, PostCard, Header, Footer, Button,
  NavLink, ThemeToggle, and compound component behavior for the Home slice.
- Fixed the moved web stylesheet Tailwind source path in `apps/web/index.css`
  so `@blog/ui` classes are emitted by the web build.
- Updated the roadmap and design-reference markdown files to keep the current
  rollout scoped to Home only.

Important decisions:

- `featuredPost` is optional in Studio. It uses a custom warning so editors are
  nudged to choose one, but publishing is not blocked.
- The service query must keep `featuredPost` nullable after dereferencing. When
  the field is empty, Sanity returns `null`, and the parser should accept that.
- If `featuredPost` is empty, the service falls back to the newest post where
  `featured == true`.
- `secondaryAction` is a reference to a managed `link` document. Links are shown
  in the CMS Settings section so editors can review the available link list.
- Post detail remains powered by the `post` document. It does not need a special
  page document for this Home rollout.

Verified after the latest fixes:

```txt
pnpm --filter cms typegen
pnpm --filter @blog/service test
pnpm --filter @blog/service type-check
pnpm --filter cms type-check
pnpm --filter cms lint
pnpm --filter web type-check
pnpm --filter web lint
```

Earlier in the rollout, the root `pnpm type-check`, `pnpm lint`, and
`pnpm test` gates also passed after the main implementation. Re-run the root
checks after the next visual fixes.

Known open items:

- The Home page still needs visual QA and fixes for the issues currently visible
  in the browser.
- Restart the web dev server after the Tailwind source path fix so generated CSS
  is rebuilt.
- `pnpm build` is still failing in `web` after successful compile/type-check
  while collecting page data. The observed error is a generated Next chunk lookup
  mismatch: `./621.js` is requested while the artifact exists under
  `.next/server/chunks/621.js`. Treat this as a separate build-artifact issue
  unless new evidence links it to the Home changes.
- Sub-issues for GitHub issue #74 have not been filed yet. The proposed rollout
  order is documented below and should be converted into board work only after
  the Home page visual pass is stable.

Suggested next-chat start:

1. Read this handoff section first.
2. Inspect the current Home page visually.
3. Fix the remaining visible Home page issues.
4. Re-run focused `web` and `ui` checks.
5. Re-run root quality gates before asking for commit approval.

## CMS Model

Home is a dedicated singleton, not an instance of the generic `page` document.
Generic pages remain for later standalone pages such as About. Post detail is
powered by the `post` document and should not get its own `page` definition.

The Home hero is a hybrid: it can derive content from a selected post, while
allowing editorial overrides only when the homepage needs different framing.

### `homePage`

Required fields:

- `title`: internal/editorial title.
- `featuredPost`: optional reference to `post`.
- `heroEyebrowMode`: `postCategory` or `custom`.
- `heroTitleMode`: `postTitle` or `custom`.
- `heroSubtitleMode`: `postExcerpt` or `custom`.
- `heroImageMode`: `postImage`, `custom`, or `none`.
- `latestPostsTitle`: short label for the latest posts section.
- `latestPostsLimit`: number of latest posts to render.

Conditional fields:

- `heroEyebrow`: required only when `heroEyebrowMode` is `custom`.
- `heroTitle`: required only when `heroTitleMode` is `custom`.
- `heroSubtitle`: required only when `heroSubtitleMode` is `custom`.
- `heroImage`: used only when `heroImageMode` is `custom`.

Actions:

- `primaryActionLabel`: optional, defaults to `Read more`; href is always the
  selected hero post route.
- `secondaryAction`: optional reference to a managed `link` document.

### `link`

Links are managed documents so editors can see and reuse the list of available
links in Studio. A link contains:

- `label`: visible link text.
- `linkType`: `internal` or `external`.
- `internalReference`: required for internal links; can point to `post`,
  `category`, or generic `page`.
- `url`: required for external/manual links; accepts relative paths such as
  `/blog` or full `http(s)` URLs.

SEO:

- `seo`: uses the existing shared SEO object.

Fallback behavior:

- If `featuredPost` is set, use it.
- If `featuredPost` is not set, use the newest post where `featured == true`.
- If no hero post exists, render the custom Home hero copy if available and omit
  the primary action.
- Latest posts are ordered by `publishedAt desc`, limited by `latestPostsLimit`,
  and exclude the selected hero post.

## Studio Organization

Sanity Studio should group content by authoring job:

- Pages
  - Home Page singleton, document id `homePage`.
  - Generic Pages list, schema type `page`.
- Blog
  - Posts.
  - Categories.
  - Authors.
- Settings
  - Site Settings singleton, document id `siteSettings`.
  - Links list, schema type `link`.

This prevents editors from creating a generic `/home` page for the root route
and makes the difference between special routes and generic pages visible.

## Service Contract

`service.pages.home.v1.getHomePage()` should return a route-ready object:

```ts
type THomePage = {
  hero: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    image?: {
      src: string;
      alt: string;
    };
    primaryAction?: {
      label: string;
      href: string;
    };
    secondaryAction?: {
      label: string;
      href: string;
    };
  };
  latestPostsTitle: string;
  latestPosts: TPostCard[];
  seo: TSeoMeta | undefined;
};
```

All Sanity/GROQ logic stays in `@blog/service`. `apps/web` formats locale-aware
dates and passes plain props to `@blog/ui`.

## UI Rollout Plan

Use the existing UI package structure and avoid duplicate Home-only components
when a current component can be aligned:

1. `PostGrid`: fixed responsive columns, `1 -> 2 -> 3`.
2. `PostCard`: compact border card for latest posts, no shadow, reduced motion
   support for lift effects.
3. `Hero`: optional media slot must not reserve space when absent; image layout
   becomes a two-column split only at `lg`.
4. `Header` and `Footer`: wrap instead of clipping, use semantic tokens, keep
   global layout ownership in `apps/web`.

`@blog/ui` remains pure and prop-driven. `next/link`, `next/image`, service
calls, and route-specific section labels stay in `apps/web`.

## Web Integration Plan

The localized Home route should:

1. Fetch `service.pages.home.v1.getHomePage()`.
2. Fetch site settings only for route metadata fallback when needed.
3. Render `Hero` from the returned hero object.
4. Render `Hero.Media` only when `hero.image` exists.
5. Render latest posts with a visible section label.
6. Generate metadata from Home SEO with site settings fallback.
7. Avoid console debug logs.

## Verification

Run, in order:

```txt
pnpm typegen
pnpm --filter @blog/service test
pnpm --filter @blog/ui test
pnpm type-check
pnpm lint
pnpm test
```

Manual responsive QA should cover `375px`, `768px`, `1024px`, and `1280px` in
light and dark modes.
