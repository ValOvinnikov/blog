---
title: Topics and tags
status: built
layers: [studio, service, web]
code:
  - packages/studio/src/schema-types/documents/blog/**
  - packages/studio/src/schema-types/documents/pages/topic/**
  - packages/studio/src/schema-types/documents/pages/tag/**
  - packages/studio/src/schema-types/documents/pages/topic-index/**
  - packages/studio/src/schema-types/documents/pages/tag-index/**
  - packages/studio/src/schema-types/documents/pages/taxonomy-index/**
  - packages/studio/src/schema-types/validation/validate-has-page/**
  - packages/studio/src/schema-types/validation/validate-unique-taxonomy-reference/**
  - packages/studio/src/structure/sections/taxonomy-section.ts
  - packages/service/src/features/pages/topic/**
  - packages/service/src/features/pages/tag/**
  - packages/service/src/features/pages/topic-index/**
  - packages/service/src/features/pages/tag-index/**
  - packages/service/src/features/entities/topics/**
  - packages/service/src/features/entities/tags/**
  - packages/service/src/shared/fragments/topic/**
  - packages/service/src/shared/fragments/tag/**
  - packages/service/src/shared/fragments/archive-page/**
  - packages/service/src/shared/transformers/topic/**
  - packages/service/src/shared/transformers/tag/**
  - apps/web/src/app/*/*/topics/**
  - apps/web/src/app/*/*/tags/**
  - apps/web/src/components/pages/topic-page/**
  - apps/web/src/components/pages/tag-page/**
  - apps/web/src/components/pages/topic-index-page/**
  - apps/web/src/components/pages/tag-index-page/**
  - apps/web/src/components/features/topic/**
  - apps/web/src/components/features/tag/**
  - apps/web/src/components/features/topic-index/**
  - apps/web/src/components/features/tag-index/**
  - apps/web/src/components/shared/topic-chip-list/**
  - apps/web/src/server/topic/**
  - apps/web/src/server/tag/**
  - apps/web/src/server/topic-index/**
  - apps/web/src/server/tag-index/**
  - apps/web/src/utils/get-topics-safely/**
  - apps/web/src/metadata/topic-metadata/**
  - apps/web/src/metadata/tag-metadata/**
  - apps/web/src/metadata/topic-index-metadata/**
  - apps/web/src/metadata/tag-index-metadata/**
epics: [1880]
---

# Topics and tags

## What it does

Posts are classified two ways: each post has exactly one **topic** (its primary subject) and up to six **tags** (keywords). Every topic and tag gets an archive page listing its posts, and two index pages list all topics and all tags. Topics also appear as a chip row on the blog index and topic pages; tags appear as chips at the foot of each post and each tag has its own RSS feed.

## Surfaces and routes

- **Public** — `/topics/{slug}` and `/tags/{slug}` (archives, paginated at `…/page/{n}`), `/topics` and `/tags` (indexes), `/tags/{slug}/rss.xml` (per-tag feed). Topics have no feed of their own.
- Chips: `TopicChipList` ("All" plus one chip per topic) above the posts on `/blog` and `/topics/{slug}`; the post article footer lists the post's tags.
- **Studio** — Taxonomy → Topic, Tag (the terms, shared across languages). Pages → Blog → Topic Index Page, Topic Page, Tag Index Page, Tag Page (per language; each label is the schema title). Each archive and index page points at its own template.
- No platform surface.

## Data

- `blog_topic`, `blog_tag` — not translated documents; `title` (required in the default language, at most 60 characters) and `description` (at most 300) are per-language arrays. A term carries no slug or SEO of its own.
- `page_topic`, `page_tag` — the [page-types](./page-types.md) fields, a `slug`, a required reference to the term they archive (`topic` / `tag`) and a template (`template_topic` / `template_tag`). The archive's URL slug, heading and SEO all live on this page document.
- `page_topicIndex`, `page_tagIndex` — one per language, built by one factory (`taxonomyIndexPage`) that differs only in its taxonomy kind. Each still carries a deprecated, read-only `taxonomyList` reference that nothing should author against.
- A term's public slug is resolved in GROQ from the archive page that references it in the request language; a term with no such page has a null slug: a topic then renders as an unlinked chip or label, and a tag is left out of the post footer entirely.
- Post counts are computed per term in GROQ over published posts in the request language.
- **Caching** — archive loaders are tagged with their page, template and term tags (`page_topic`, `template_topic`, `topic`, and the tag equivalents). Publishing a term purges `topic`/`tag`, its plural and `posts`; publishing a post precisely purges every topic and tag page of the tenant with its pagination (see [posts](./posts.md)).

## Configuration

- Editors create terms, archive pages and index pages in the Studio, and choose each archive's hero and modules through its template. Nothing is set in the platform, and nothing is plan-gated.
- Topic and Tag templates accept `module_heroBlog` as hero and `module_postList` (at most one), `module_postLatest`, `module_taxonomyList`, `module_content`, `module_faq`, `module_cta`, `module_newsletter`. The index templates accept `module_heroBlog` and `module_taxonomyList` (at most one), `module_postLatest`, `module_content`, `module_cta`, `module_newsletter`.
- Chip and breadcrumb strings are fixed catalogue keys, not [Voice](./voice.md) fields.

## Constraints and invariants

- A term cannot be published until some archive page (in any language) references it (`validateHasPage`), because its URL would otherwise 404.
- A term may back at most one archive page per language (`validateUniqueTaxonomyReference`); every term href resolves through the first matching page, so a second page would make it arbitrary.
- An index page or template whose `module_taxonomyList` lists the other kind is an error (`validateTaxonomyListReferencesMatchKind`).
- Archive modules receive an `archive` context (term id, kind, slug, name) and the page number, so `module_postList` and `module_postLatest` scope themselves to the term (see [post-modules](./post-modules.md), [taxonomy-list-module](./taxonomy-list-module.md)).
- An archive whose slug has no page in the request language 404s. A missing index page in a non-default language redirects to the site root.
- `/…/page/1` 308s to the unnumbered URL; a non-numeric page 404s.
- The topic chip row never breaks a page: a failed topics fetch logs and renders no chips.
- Breadcrumbs are Home → term, labelled with the term's localized title.
- The tag feed uses the tag's title and description (falling back to the title), lists every published post with that tag in the request language, and 404s when the tag page or post fetch fails.

## Dependencies

- Layers: `studio`, `service` (`service.pages.topic|tag|topicIndex|tagIndex.v1`, `service.entities.topics|tags.v1`), `web`.
- Features: [page-types](./page-types.md), [posts](./posts.md), [taxonomy-list-module](./taxonomy-list-module.md), [post-modules](./post-modules.md), [seo-and-feeds](./seo-and-feeds.md), [languages](./languages.md), [rendering-and-caching](./rendering-and-caching.md).
- Env vars: none of its own.

## Entry points

- `packages/studio/src/schema-types/documents/blog/topic/topic.ts`, `blog/tag/tag.ts`
- `packages/studio/src/schema-types/documents/pages/taxonomy-index/taxonomy-index-page.ts`
- `packages/service/src/shared/fragments/archive-page/archive-page-slug.ts`
- `packages/service/src/features/pages/topic/adaptor/detail-page/query.ts` (and the tag equivalent)
- `apps/web/src/components/pages/topic-page/topic-page.tsx`, `tag-page/tag-page.tsx`
- `apps/web/src/app/[tenant]/[locale]/tags/[slug]/rss.xml/route.ts`

## Tests and stories

- Studio: `validate-has-page.test.ts`, `validate-unique-taxonomy-reference.test.ts`, `validate-taxonomy-list-matches-kind.test.ts`.
- Service: `packages/service/src/features/pages/{topic,tag,topic-index,tag-index}/**/*.test.ts`, `features/entities/{topics,tags}/**/*.test.ts`, `topic.test.ts`, `tag.test.ts`, `archive-page-slug.test.ts`.
- Web: the four page tests and their `*-module-renderer.test.tsx`, `topic-chips.test.tsx`, `topic-breadcrumbs.test.tsx`, `tag-breadcrumbs.test.tsx`, the four metadata builders' tests.
- Stories: `tag-index-page.stories.tsx`, `topic-index-page.stories.tsx`.

## Related

- #1880 — decide whether a loader failure should 404 or 500.
