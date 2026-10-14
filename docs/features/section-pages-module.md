---
title: Section Pages module
status: built
layers: [studio, service, ui, web]
code:
  - apps/web/src/modules/section-pages/**
  - packages/studio/src/schema-types/modules/section-pages/**
  - packages/service/src/features/modules/section-pages/**
epics: []
---

# Section Pages module

## What it does

Section Pages turns a landing page into a hub for the pages nested under it. Placed on a landing template, it shows one card per direct child of the page being viewed, in the order the editor dragged them in the Studio, each with the child's heading, its supporting line as a summary, its sharing image, and a link. On a page with no children it renders nothing, so one landing template can serve both hub and leaf pages.

## Surfaces and routes

- **Studio** — Modules → Explainers → Section Pages (`module_sectionPages`). Allowed only in `template_landing.modules[]`. Children are ordered by dragging them in the landing page tree.
- **Public site** — landing pages (`/[...slug]`, rendered by the landing page route). Each card links to `/<parent path>/<child slug>`.
- No platform surface.

## Data

- **`module_sectionPages`** — `title`, `brandVariant`, optional `headingBlock` (the only module whose heading is optional), `contentAlignment` (Left/Center), `layout` (`wideLayout`). There is no list of pages to author: the children are derived.
- **Children** — `page_landing` documents whose `parent` is the current page and whose `language` is the request language, ordered by `orderRank`. Each card reads the child's `slug`, its `headingBlock` heading (title) and supporting text (summary), and `seo.openGraph.ogImage` (image).
- **Context** — the landing renderer passes `landingPage { id, path }`; the module uses `id` to find children and `path` to build their links.
- **Caching** — the module query is tagged `modules:sectionPages` + `module:<id>`; the children query `page_landing`, so publishing any landing page refreshes every Section Pages grid. Fallback revalidate 3600s.

## Configuration

- Editors add the module to a landing template and choose its background, heading, alignment and layout. Which cards appear follows the landing page tree, not the module.
- No plan or capability gate; no Voice strings.
- Look: card style, radius and density restyle the cards ([look](./look.md)).

## Constraints and invariants

- Renders nothing when the page has no children in the request language, when the fetch fails (logged), or when it is placed without landing-page context (logs `section_pages_module.missing_landing_page_context`).
- Grid columns follow the card count through `toModuleGridColumns`.
- With a heading, the section is labelled by it and card titles are `h3`; without one, the section has no `aria-labelledby` and card titles are `h2`.
- A card without an image keeps a minimum height so a title-only card still reads as a card.
- Card summaries are the child's page heading supporting text, never its SEO description.
- The module and its children are fetched in parallel; the service never reads the parent page.

## Dependencies

- Layers: `studio`, `service`, `ui` (`MediaCard`, `CardGrid`), `web` (`SanityImage`, `SmartLink`, `ModuleHeading`, `Section`).
- Features: [module-system](./module-system.md), [landing-tree](./landing-tree.md), [page-types](./page-types.md), [seo-and-feeds](./seo-and-feeds.md) (the sharing image), [languages](./languages.md), [rendering-and-caching](./rendering-and-caching.md).
- Env: none of its own.

## Entry points

- `apps/web/src/modules/section-pages/section-pages-module.tsx`, `section-pages-module-view.tsx`
- `apps/web/src/components/pages/landing-page/landing-module-renderer.tsx` — passes `landingPage` context
- `packages/studio/src/schema-types/modules/section-pages/section-pages.ts`
- `packages/service/src/features/modules/section-pages/application/get-section-pages-module.ts`
- `packages/service/src/features/modules/section-pages/adaptor/pages/query.ts`, `transformer.ts`

## Tests and stories

- Web: `section-pages-module.test.tsx`, `section-pages-module-view.test.tsx`, `landing-module-renderer.test.tsx`.
- Service: `features/modules/section-pages/**/*.test.ts`.
- Stories: `apps/web/src/modules/section-pages/section-pages-module-view.stories.tsx`.

## Related

No open epic or issue changes this module.
