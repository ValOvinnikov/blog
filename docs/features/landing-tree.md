---
title: Landing tree
status: built
layers: [config, studio, service, web]
code:
  - packages/config/src/constants/landing-page.ts
  - packages/config/src/constants/reserved-slug.ts
  - packages/config/src/constants/redirect.ts
  - packages/studio/src/schema-types/documents/pages/landing/**
  - packages/studio/src/schema-types/documents/redirect/**
  - packages/studio/src/schema-types/inputs/landing-section-navigation-field/**
  - packages/studio/src/schema-types/inputs/landing-slug-url-preview/**
  - packages/studio/src/schema-types/inputs/automatic-redirect-notice-input/**
  - packages/studio/src/schema-types/queries/landing-parent-chain/**
  - packages/studio/src/schema-types/queries/published-page-at-path/**
  - packages/studio/src/schema-types/validation/validate-landing-*/**
  - packages/studio/src/schema-types/validation/validate-redirect-*/**
  - packages/studio/src/schema-types/validation/validate-setting-matches-default-language/**
  - packages/studio/src/structure/page-tree/**
  - packages/studio/src/document-actions/*-landing-redirects/**
  - packages/service/src/features/pages/landing/**
  - packages/service/src/shared/expressions/landing-page/**
  - apps/web/src/app/*/*/*slug*/page.tsx
  - apps/web/src/components/pages/landing-page/**
  - apps/web/src/components/features/landing/**
  - apps/web/src/server/landing/**
  - apps/web/src/utils/redirect-moved-landing-page/**
  - apps/web/src/metadata/landing-page-metadata/**
epics: []
---

# Landing tree

## What it does

Landing pages are the site's free-form pages, and they nest: an editor puts a page under a parent to build sections such as `/modules/faq`. A section can show its own sidebar navigation and breadcrumbs while the header and footer stay the site's main navigation. When an editor moves or renames a published Landing page, the Studio adds a redirect from the old address so existing links keep working; editors can also add redirects by hand.

## Surfaces and routes

- **Public** — `[tenant]/[locale]/[...slug]` renders every Landing page at its full path. Home is not part of the tree; top-level pages sit directly under `/`.
- **Studio** — Pages → Landing is a page tree: each page with children opens as "Page" plus a drag-orderable "Section pages" list (`@sanity/orderable-document-list`). Redirects live under Settings → Redirect.
- Moving a page (slug or parent) and publishing it runs the wrapped Publish action, which writes the redirect before the publish.

## Data

- `page_landing` — the [page-types](./page-types.md) fields plus `parent` (optional reference to another Landing page in the same language), `slug` (one segment), `orderRank`, `sectionNavigation` (boolean, default off), `sectionNavigationTitle` (shown only when section navigation is on), `showSectionNavigation` (boolean, default on) and the `template_landing` reference.
- `redirect` — `language` (required), `source` and `destination` (site paths), `isPrefix` ("Include Sub-pages"), `status` (`PERMANENT` default, or `TEMPORARY`), an editor-only `description`, and a read-only `isAutomatic`.
- The path is computed in GROQ (`LANDING_PAGE_PATH_EXPRESSION`) by joining the parent chain's slugs; `PAGE_PATH_EXPRESSION` is the variant used where page types mix (sitemap, translation map). Section navigation is computed from the page's ancestor chain (`LANDING_PAGE_SECTION_CHAIN_EXPRESSION`).
- **Caching** — the page loader is tagged `page_landing` and `template_landing`; the redirect loader fetches every redirect for the language, tagged `redirect`. Publishing either purges its tags and falls back to a whole-layout path purge (see [rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors create, nest, reorder and redirect pages in the Studio. Nothing is set in the platform, and the tree is not plan-gated.
- "Section navigation" is a per-page setting, never a module. Its control appears only on a page that has children; "Show section navigation on this page" appears only on a page inside a section. Both warn when they differ from the default-language version.
- The sidebar heading is `sectionNavigationTitle`, or the fixed catalogue string `sectionNavigation.label` when empty. It is not a [Voice](./voice.md) field.

## Constraints and invariants

- Depth is at most `LANDING_PAGE_MAX_DEPTH` (3, counting the page itself), shared by the Studio validator and the service path expression.
- A parent must be in the same language and cannot be the page itself or one of its descendants; the depth check counts the page's own subtree.
- A slug is one segment (no `/`), unique among pages with the same parent and language. Only top-level slugs are checked against `RESERVED_SLUGS`, so `/help/blog` is allowed.
- A page whose chain is broken (a missing, unpublished or slugless ancestor, or one past the depth bound) has no path and is not routable.
- Section navigation: the section root is the nearest ancestor-or-self with `sectionNavigation` on, so a nested parent can run its own branch. The sidebar lists the root and its direct children in drag order, marks the current page (or the child whose branch contains it) and links back to the enclosing section. Breadcrumbs follow the parent chain. Labels are each page's public heading, never its internal `title`. `showSectionNavigation: false` hides the sidebar and the section breadcrumb trail on that page only; the breadcrumb bar still shows, as Home → this page.
- Without section navigation, the breadcrumb is Home → this page.
- **Redirects cover Landing paths only.** When a Landing path finds no page, the site looks up redirects for that language: an exact source first, then the longest prefix redirect, carrying the rest of the path. Permanent answers 308, Temporary 307; otherwise the page 404s. A destination that is not a same-origin path is ignored.
- A published page at the source always wins over a redirect (the Studio warns). A destination with no published page in that language is an error, as are a duplicate source, a redirect chain in either direction, a destination equal to the source, and `/` as a source.
- On publishing a moved page, the Studio creates an automatic Permanent redirect from the old path (a prefix redirect when the page has descendants), rebases redirects that pointed under the old path, and deletes redirects whose source is now a live page or that would loop. If that write fails, the publish is cancelled with a "Not published" toast.

## Dependencies

- Layers: `config` (depth, reserved slugs, redirect status), `studio`, `service` (`service.pages.landing.v1`), `web`.
- Features: [page-types](./page-types.md), [section-pages-module](./section-pages-module.md) (cards for a page's children), [languages](./languages.md), [seo-and-feeds](./seo-and-feeds.md) (sitemap entries, metadata), [navigation](./navigation.md), [links](./links.md), [errors-and-404](./errors-and-404.md).
- Env vars: none of its own.

## Entry points

- `packages/studio/src/schema-types/documents/pages/landing/landing.ts`
- `packages/studio/src/schema-types/documents/redirect/redirect.ts`
- `packages/studio/src/structure/page-tree/page-tree.ts`
- `packages/studio/src/document-actions/with-landing-redirects/with-landing-redirects.ts`, `apply-landing-redirects/`, `plan-landing-redirects/`
- `packages/service/src/features/pages/landing/adaptor/detail-page/` (path match, section navigation) and `adaptor/redirect/`
- `packages/service/src/shared/expressions/landing-page/landing-page-path.ts`
- `apps/web/src/components/pages/landing-page/landing-page.tsx`
- `apps/web/src/components/features/landing/section-navigation/section-navigation.tsx`
- `apps/web/src/utils/redirect-moved-landing-page/redirect-moved-landing-page.ts`

## Tests and stories

- Studio: `validate-landing-parent`, `validate-landing-slug`, `validate-landing-slug-unique-among-siblings`, `validate-redirect-chain`, `validate-redirect-page`, `validate-setting-matches-default-language`, `is-inside-section`, `landing-parent-chain`, `page-tree`, `plan-landing-redirects` and `apply-landing-redirects` tests beside their sources.
- Service: `packages/service/src/features/pages/landing/**/*.test.ts`, `landing-page-path.test.ts`.
- Web: `landing-page.test.tsx`, `landing-module-renderer.test.tsx`, `landing-breadcrumbs.test.tsx`, `section-navigation.test.tsx`, `redirect-moved-landing-page.test.ts`, `build-landing-page-metadata.test.ts`.
- Stories: `landing-page-layout.stories.tsx`, `section-navigation.stories.tsx`.

## Related

- #2798 — site templates; the Docs type (#4969) seeds `/guides` with section navigation and three pages.
