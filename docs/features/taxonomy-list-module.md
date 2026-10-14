---
title: Taxonomy List module
status: built
layers: [config, studio, service, ui, web]
code:
  - apps/web/src/modules/taxonomy-list/**
  - packages/studio/src/schema-types/modules/taxonomy-list/**
  - packages/studio/src/schema-types/validation/validate-taxonomy-list-matches-kind/**
  - packages/service/src/features/modules/taxonomy-list/**
  - packages/ui/src/components/molecules/taxonomy-card/**
epics: []
---

# Taxonomy List module

## What it does

The Taxonomy List shows a browsable grid of topics or tags, each card carrying the term's name, description, post count and, optionally, links to its two newest posts. It is the main content of the Topics and Tags index pages, and editors can also place it on the home page, landing pages, archive pages and under posts so readers can explore by subject.

## Surfaces and routes

- **Studio** — Modules → Posts → Taxonomy List (`module_taxonomyList`).
- **Where it is allowed** — every template that lists modules (`template_home`, `template_landing`, `template_postIndex`, `template_topic`, `template_tag`, `template_topicIndex`, `template_tagIndex`) and `page_post.modules[]`. The two index templates allow it at most once.
- **Public site** — `/topics` and `/tags`, plus any page that places it. Each card links to the term's archive (`/topics/[slug]` or `/tags/[slug]`) and each latest-post link to `/blog/[slug]`.

## Data

- **`module_taxonomyList`** — `title`, `brandVariant`, required `headingBlock`, `taxonomy` (`TOPICS` or `TAGS`, optional), `sortOrder` (`ALPHABETICAL` default, or `MOST_POSTS`), `limit` (integer ≥ 1; empty shows every term), `showLatestPosts` (default on), `contentAlignment` (Left/Center), `layout` (`wideLayout`).
- **Entries** — every `blog_topic` or `blog_tag` with its localized title and description, its archive page slug in the request language, a post count, and its two newest posts. Counts and latest posts include only published posts in the request language.
- `page_topicIndex` and `page_tagIndex` still hold a read-only, deprecated `taxonomyList` reference that nothing renders.
- **Caching** — `modules:taxonomyList`, `module:<id>`, `topics`, `tags`, `posts`; fallback revalidate 3600s.

## Configuration

- Editors choose the taxonomy, sort, limit and the latest-posts toggle per module document. No plan or capability gate.
- Voice: the empty state is the tenant-editable `topicsEmpty` or `tagsEmpty` message ([voice](./voice.md)). The post-count, "latest" label and list labels are fixed strings in the `taxonomyListModule.topics` / `.tags` catalogue.
- Look: card style, radius and density restyle the cards ([look](./look.md)).

## Constraints and invariants

- A module cannot see the page that holds it, so `taxonomy` is always visible and never required, and nothing infers it from the page at read time. An unset taxonomy yields zero entries and the topics empty state; the page still answers 200.
- The Studio rejects a topic index template or page whose Taxonomy List lists tags, and the reverse, reporting on the offending Modules entry (`validateTaxonomyListReferencesMatchKind`; on the `page_topicIndex`/`page_tagIndex` document it also checks the deprecated `taxonomyList` field).
- Sorting: alphabetical by title in the query; Most Posts sorts by count, then title. The limit applies after sorting.
- A term with no archive page in the request language is dropped from the grid.
- A failed fetch answers 404 (`notFound()`), unlike most modules, which render nothing.
- The view composes `TaxonomyCard` directly rather than the post `MediaCardItem`; `TaxonomyCard.Posts` renders only when latest posts are on and the term has any.

## Dependencies

- Layers: `config` (`TAXONOMY_KIND`, `TAXONOMY_SORT`, routes), `studio`, `service`, `ui` (`TaxonomyCard`, `CardGrid`), `web`.
- Features: [module-system](./module-system.md), [topics-and-tags](./topics-and-tags.md), [page-types](./page-types.md), [post-modules](./post-modules.md), [languages](./languages.md), [voice](./voice.md), [rendering-and-caching](./rendering-and-caching.md).
- Env: none of its own.

## Entry points

- `apps/web/src/modules/taxonomy-list/taxonomy-list-module.tsx`, `taxonomy-list-module-view.tsx`
- `packages/studio/src/schema-types/modules/taxonomy-list/taxonomy-list.ts`
- `packages/studio/src/schema-types/documents/templates/taxonomy-index/taxonomy-index-template.ts`
- `packages/studio/src/schema-types/validation/validate-taxonomy-list-matches-kind/validate-taxonomy-list-matches-kind.ts`
- `packages/service/src/features/modules/taxonomy-list/adaptor/query.ts`, `transformer.ts`
- `packages/ui/src/components/molecules/taxonomy-card/taxonomy-card.tsx`

## Tests and stories

- Web: `taxonomy-list-module.test.tsx`, `taxonomy-list-module-view.test.tsx`, and the index page renderer tests (`topic-index-module-renderer.test.tsx`, `tag-index-module-renderer.test.tsx`).
- Service: `features/modules/taxonomy-list/**/*.test.ts`.
- Studio: `validate-taxonomy-list-matches-kind.test.ts`. UI: `taxonomy-card.test.tsx`.
- Stories: `taxonomy-list-module-view.stories.tsx`, `packages/ui/src/components/molecules/taxonomy-card/taxonomy-card.stories.tsx`.

## Related

No open epic or issue changes this module.
