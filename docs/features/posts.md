---
title: Posts
status: built
layers: [studio, service, ui, web, db]
code:
  - packages/studio/src/schema-types/documents/pages/post/**
  - packages/service/src/features/pages/post/**
  - packages/service/src/features/entities/posts/**
  - packages/service/src/shared/expressions/post/**
  - packages/service/src/shared/fragments/post/**
  - packages/service/src/shared/transformers/post/**
  - packages/service/src/shared/localization/published-posts-in-locale/**
  - apps/web/src/app/*/*/blog/*/page.tsx
  - apps/web/src/components/pages/blog-post-page/**
  - apps/web/src/components/features/post/**
  - apps/web/src/server/post/**
  - apps/web/src/metadata/post-metadata/**
  - apps/web/src/utils/build-blog-posting-schema/**
  - apps/web/src/utils/build-post-publish-paths/**
  - apps/web/src/server/revalidate/derive-revalidate-paths/**
epics: [2682, 1880]
---

# Posts

## What it does

A post is an article written in the Studio: a heading and lead, an optional hero image, a rich-text body, an author, one topic, up to six tags and a publish date. Each post renders at `/blog/{slug}` with a byline, reading time, share and bookmark actions, a table of contents for longer pieces, tag chips, and any modules the editor adds below the article. Posts with a future publish date stay hidden everywhere until that date passes.

## Surfaces and routes

- **Public** — `/blog/{slug}` (`BlogPostPage`). Posts also feed the listing modules on every other page, the site and tag RSS feeds, the sitemap, and the [bookmarks](./bookmarks.md) page.
- **Studio** — Pages → Blog → Post Page, listed by language. Each post is a translated document; translations of one post are linked through `translation.metadata`.
- No platform surface.

## Data

- `page_post` fields: `language`, `title` (internal), `slug`, `headingBlock` (the public title is `heading`, the lead/excerpt is `supportingText`), `contentAlignment`, `heroImage` (`imageWithAlt`, optional), `content` (`articleText`, required), `featured` (boolean), `author` (→ `person`, required), `topic` (→ `blog_topic`, required), `tags` (→ `blog_tag`, at most 6, unique), `modules` (references), `publishedAt` (required datetime), `postTakeaways` (optional) and `seo`.
- A post has no template. Its `modules[]` accepts `module_postRelated` (at most one), `module_postLatest`, `module_taxonomyList`, `module_cta` and `module_newsletter`.
- Derived in GROQ or the transformer: reading time from a word count of the body's text blocks, `hasAsides` when the body contains an aside block, and `translations` for the language switcher.
- `postTakeaways` is the 30-second skim; fewer than three takeaways is treated as none (see [skim-pipeline](./skim-pipeline.md)).
- Neon: `bookmarks` rows reference posts by Sanity id; deleting or unpublishing a post removes them through the revalidation webhook.
- **Caching** — the detail loader is tagged `page_post` plus the tags of every type it dereferences (`author`, `topic`, `tag`, `link` and the page types a link can target). Publishing a post purges `page_post`, `posts`, `author`, `topic` and `tag`, then purges resolved paths precisely: the post, the home page, the blog index and its pages, and every topic and tag page of the tenant with their pagination, in every live language. The precise purge needs the post to be currently published; when it is deleted, unpublished or dated in the future, the lookup finds nothing and the webhook purges the whole layout instead, so publishing a scheduled post purges the whole layout. Routes declare `revalidate = 21600` as a backstop.

## Configuration

- Editors write, schedule, feature and translate posts in the Studio. Posts are not plan-gated.
- `featured` feeds the "newest featured" source of `module_heroBlog` and `module_postFeatured` (see [heroes](./heroes.md), [post-modules](./post-modules.md)).
- Bookmark buttons appear only when the tenant has the bookmarks capability (see [plans-and-entitlements](./plans-and-entitlements.md)).
- Fixed article strings (reading time, aside labels, depth toggle) are catalogue keys, not [Voice](./voice.md) fields.

## Constraints and invariants

- **Publish filter** — every post query applies `publishedAt <= now()` (`PUBLISHED_POST_FILTER`) and, for listings, the request language (`publishedPostsInLocale`). A scheduled post is absent from listings, feeds and the sitemap, and its URL 404s. Nothing purges the cache when the date passes; the post appears as cached fetches (3600s) and routes (21600s) expire.
- A slug is unique within its language; the same slug may be reused across languages. A post that does not exist in the request language 404s, with no fallback to another language.
- A post's topic is its single primary classification; its breadcrumb is Home → topic → post (the topic step is dropped when the topic has no page in that language). Tags with no page in that language are left out of the footer chips.
- The post's title comes from `headingBlock.heading` everywhere it appears (article, cards, metadata, JSON-LD); `title` is never shown.
- The body renders with a table-of-contents rail only when it has enough `h2` headings (`MIN_H2_HEADINGS_FOR_RAIL`).
- The skim/read/deep toggle shows only when the post has takeaways or asides (see [reading-experience](./reading-experience.md)).
- A renamed slug does not purge the page at the old URL; it expires through the route backstop.
- The detail page fetches the post once (`getPostPage`, `React.cache`) and every part (article, breadcrumbs, JSON-LD) reads the same cached result.

## Dependencies

- Layers: `studio`, `service` (`service.pages.post.v1`, `service.entities.posts.v1`), `ui` (`Article`, `Prose`), `web`, `db` (bookmark cleanup).
- Features: [page-types](./page-types.md), [people](./people.md), [topics-and-tags](./topics-and-tags.md), [rich-text](./rich-text.md), [reading-experience](./reading-experience.md), [skim-pipeline](./skim-pipeline.md), [post-modules](./post-modules.md), [bookmarks](./bookmarks.md), [seo-and-feeds](./seo-and-feeds.md), [rendering-and-caching](./rendering-and-caching.md), [languages](./languages.md).
- Env vars: none of its own; the webhook needs `SANITY_REVALIDATE_SECRET` (see [rendering-and-caching](./rendering-and-caching.md)).

## Entry points

- `packages/studio/src/schema-types/documents/pages/post/post.ts`
- `packages/service/src/features/pages/post/adaptor/detail-page/query.ts`, `transformer.ts`
- `packages/service/src/shared/expressions/post/published-post.ts`
- `packages/service/src/shared/fragments/post/post.ts`, `transformers/post/to-post-card.ts`
- `apps/web/src/components/pages/blog-post-page/blog-post-page.tsx`
- `apps/web/src/components/features/post/post-article/post-article.tsx`
- `apps/web/src/server/revalidate/derive-revalidate-paths/derive-revalidate-paths.ts`, `apps/web/src/utils/build-post-publish-paths/build-post-publish-paths.ts`

## Tests and stories

- Service: `packages/service/src/features/pages/post/**/*.test.ts`, `features/entities/posts/**/*.test.ts`, `post-count.test.ts`, `word-count.test.ts`, `published-posts-in-locale.test.ts`, `post-link.test.ts`, `to-post-card.test.ts`.
- Web: `blog-post-page.test.tsx`, `blog-post-module-renderer.test.tsx`, `post-article.test.tsx`, `post-breadcrumbs.test.tsx`, `post-table-of-contents.test.tsx`, `blog-posting-schema.test.tsx`, `bookmark-button-gate.test.tsx`, `get-post-page.test.ts`, `build-post-metadata.test.ts`, `build-post-publish-paths.test.ts`, `derive-revalidate-paths.test.ts`.
- Stories: `post-article.stories.tsx`, `post-table-of-contents.stories.tsx`.

## Related

- #2682 — verify the tenant-scoped path purge against a real running site.
- #1880 — decide whether a loader failure should 404 or 500.
- #3600 — coverage for link targets reached through a post's author.
