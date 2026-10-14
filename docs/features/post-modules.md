---
title: Post modules
status: built
layers: [config, studio, service, ui, web]
code:
  - apps/web/src/modules/post-*/**
  - apps/web/src/utils/to-post-list-items/**
  - apps/web/src/utils/render-post-card-image/**
  - apps/web/src/utils/render-post-lead-image/**
  - packages/studio/src/schema-types/modules/post-*/**
  - packages/studio/src/schema-types/validation/validate-newest-featured-has-candidate/**
  - packages/service/src/features/modules/post-*/**
  - packages/service/src/shared/adaptors/post-list-page-size/**
epics: [1919, 3245, 4456]
---

# Post modules

## What it does

Four modules put posts on a page as cards. **Latest Posts** shows the newest posts. **Featured Posts** spotlights up to three posts, pinned by hand or the newest marked Featured, with the first shown larger as the lead. **Post List** is the paginated archive of a blog index, topic or tag page. **Related Reading** sits under a post and picks other posts that share its tags or topic. Every list shows only published posts in the reader's language.

## Surfaces and routes

- **Studio** — Modules → Posts: Latest Posts (`module_postLatest`), Featured Posts (`module_postFeatured`), Post List (`module_postList`), Related Reading (`module_postRelated`).
- **Where each is allowed** — Latest Posts: every template and posts. Featured Posts: `template_home`, `template_landing`, `template_postIndex`. Post List: `template_postIndex`, `template_topic`, `template_tag`, at most once each. Related Reading: `page_post.modules[]` only, at most once.
- **Public site** — Post List drives `/blog`, `/blog/page/[page]`, `/topics/[slug]`, `/topics/[slug]/page/[page]`, `/tags/[slug]` and `/tags/[slug]/page/[page]`. The others render wherever a template places them; Related Reading renders on `/blog/[slug]`.

## Data

- **Shared fields** — `title`, `brandVariant`, required `headingBlock`, `showImages` (default on), `contentAlignment` (Left/Center), `layout` (`wideLayout`: spacing, Wide/Full width, dividers).
- **Latest Posts** — `limit` (required, 1–12), `displayMode` (Grid/Carousel).
- **Featured Posts** — `postSource` (`PINNED` default, or `NEWEST_FEATURED`), `posts` (pinned, published only, unique, 1–3, in display order), `limit` (Newest featured only, 1–3, default 3), `displayMode`.
- **Post List** — `pageSize` (required, 1–24). Always a grid.
- **Related Reading** — `limit` (required, 1–6, default 3). Always a grid.
- **Post cards** — `postCardFragment` via `toPostCard`; web turns them into `MediaCardItem` data with `toPostListItems`, adding a card image (or the larger lead image for the first Featured post) only when `showImages` is on.
- **Caching** — module query `modules:<kind>` + `module:<id>`; post queries `posts`, `author`, `topic` (+ `tag` for Post List and Related Reading). Fallback revalidate 3600s.

## Configuration

- Editors place and configure the modules in the Studio. No plan or capability gate.
- Voice: the Post List's empty state is the tenant-editable `blogListEmpty`, `topicEmpty` or `tagEmpty` message ([voice](./voice.md)). Pagination labels come from the fixed `pagination` and page catalogues.
- Look: card style, radius and density restyle the cards ([look](./look.md)).

## Constraints and invariants

- Lists read `publishedPostsInLocale`: `page_post` in the request language with `publishedAt` in the past, newest first. A pinned Featured post resolves to its translation in the request language and drops out when it has none.
- Latest Posts, Featured Posts and Related Reading render nothing when they have no posts or their fetch fails. Post List renders its empty state when there are no posts, and answers 404 when its fetch fails or the requested page is past the last one.
- Post List scope comes from page context, never from the module: on a topic or tag page it lists posts referencing that term (`references($termId)`); on the blog index it lists every post. Its pagination links build from `routes.blogIndex`, `routes.topic(slug, page)` or `routes.tag(slug, page)`.
- Paginated routes' static params read the `pageSize` of the first Post List on the page's template.
- Related Reading needs the post's id from page context, and logs `post_related_module.missing_post_context` and renders nothing without it. It ranks posts sharing a tag with the current post by shared-tag count then recency (candidate pool capped at 24), then backfills from the same topic (pool of twice the limit). The current post is never included. Columns follow `toModuleGridColumns`.
- Featured Posts in Grid: the lead renders split and larger; one remaining post renders split beside it, two render in a two-column grid. In Carousel every post is an equal card.
- Studio: Newest featured cannot publish while no published post is marked Featured (both Featured Posts and Blog Hero). A Latest Posts carousel with a limit under four warns, because a wide screen shows four per row.

## Dependencies

- Layers: `config` (`POST_SOURCE`, `DISPLAY_MODE`, routes), `studio`, `service`, `ui` (`CardGrid`, `MediaCard`, `Pagination`), `web` (`MediaCardItem`, `CardCarousel`, `ModuleHeading`, `Section`).
- Features: [module-system](./module-system.md), [posts](./posts.md), [topics-and-tags](./topics-and-tags.md), [page-types](./page-types.md), [heroes](./heroes.md) (shares the Featured flag and source), [languages](./languages.md), [seo-and-feeds](./seo-and-feeds.md), [rendering-and-caching](./rendering-and-caching.md), [voice](./voice.md).
- Env: none of its own.

## Entry points

- `apps/web/src/modules/post-list/post-list-module.tsx` — archive scope, pagination, empty state
- `apps/web/src/modules/post-featured/post-featured-module-view.tsx` — lead/tail layout
- `apps/web/src/modules/post-latest/post-latest-module.tsx`, `post-related/post-related-module.tsx`
- `apps/web/src/utils/to-post-list-items/to-post-list-items.ts`
- `packages/studio/src/schema-types/modules/post-featured/post-featured.ts` (and `post-latest`, `post-list`, `post-related`)
- `packages/service/src/features/modules/post-list/adaptor/posts.query.ts`
- `packages/service/src/features/modules/post-featured/adaptor/query.ts`
- `packages/service/src/features/modules/post-related/adaptor/posts/loader.ts`, `transformer.ts`
- `packages/service/src/shared/adaptors/post-list-page-size/pagination-params.ts`

## Tests and stories

- Web: `post-*-module.test.tsx`, `post-*-module-view.test.tsx`, `to-post-list-items.test.ts`, `render-post-card-image.test.tsx`, `render-post-lead-image.test.tsx`.
- Service: `features/modules/post-*/**/*.test.ts` (the related-reading and list queries run against groq-js datasets, including language scoping), `shared/adaptors/post-list-page-size/*.test.ts`.
- Studio: `validate-newest-featured-has-candidate.test.ts`.
- Stories: `post-latest-module-view.stories.tsx`, `post-featured-module-view.stories.tsx`, `post-list-module-view.stories.tsx`, `post-related-module-view.stories.tsx`; UI `card-grid`, `media-card` and `pagination` stories.

## Related

- #1919 — epic: module and page-type portfolio. #3245 adds image shape and card alignment to the four post modules.
- #4456 — the content alignment help text names the carousel on Latest Posts.
