---
title: Reading experience
status: built
layers: [config, utils, service, ui, web]
code:
  - packages/utils/src/reading-time/**
  - packages/ui/src/components/atoms/back-to-top/**
  - apps/web/src/context/post-summary-provider/**
  - apps/web/src/components/features/post/post-article/components/post-summary-card/**
  - apps/web/src/components/features/post/post-article/components/post-article-actions/**
  - apps/web/src/components/shared/back-to-top-button/**
  - apps/web/src/components/shared/sidebar-nav/**
  - apps/web/src/components/shared/contents-rail-layout/**
  - apps/web/src/hooks/use-active-heading-id/**
  - apps/web/src/utils/extract-contents-headings/**
  - apps/web/src/testing/shared/contents-rail/**
  - apps/web/src/testing/shared/sidebar-nav/**
epics: []
---

# Reading experience

## What it does

A post page always shows the full article, with its asides inline. A post with a summary gets a **Summary** button in the author row that opens a card under it showing the summary's rich text — paragraphs, bullet and numbered lists, bold and italic. A long post also gets a "Contents" rail that tracks the heading in view, and every post shows an estimated reading time and a back-to-top button. The summary is written by an editor, or drafted by ./skim-pipeline.md when it is triggered and then published by an editor; the rail follows from the post's headings.

## Surfaces and routes

- **Public site:** `/blog/{slug}` (with the language prefix for a non-default language), composed by `BlogPostPage`, which renders `PostArticle` and then the post's own `modules[]`.
- **Post cards:** reading time also appears on post cards in the post modules ("N min"), through `toPostListItems`.
- **Studio:** no dedicated surface. The summary is the post's `postTakeaways.summary` field and asides are blocks in its body (./rich-text.md). The summary is written by an editor, or drafted by ./skim-pipeline.md when it is triggered and then published by an editor.
- **Platform:** none.

## Data

- `page_post.postTakeaways` (`summary`, restricted Portable Text of at most 8 blocks and 100 words; `generatedAt`; `model`), read as `TPostDetail.postTakeaways` with `summary` mapped to Portable Text blocks. A summary with no block that has text is treated as none (`toPostTakeaways`).
- `TPostDetail.readingTimeMinutes` comes from a GROQ word count over the top-level `block`s of `content` (`WORD_COUNT_EXPRESSION`, split on spaces) and `toReadingTimeMinutes` (200 words a minute, rounded up, at least 1). Asides, code and images are not counted.
- The contents outline is derived on the server from the body (`extractContentsHeadings`); nothing is stored.
- Cache: everything rides the post read (`getPostPage` → `service.pages.post.v1.getPost`), tagged with the post and the types it references and revalidated by the publish webhook, with the route's 86400s backstop. See ./rendering-and-caching.md.

## Configuration

- Not plan-gated and not a capability: every tenant's posts get all of it.
- Editors decide availability per post: an approved summary with text shows the Summary button; a post without one shows none.
- Look reaches it through the shared tokens (the Summary button and card, the aside styling). See ./look.md.
- Every string is fixed catalog copy, not Voice: `blogPostPage.postSummary.*`, `blogPostPage.asideKind.*`, `blogPostPage.backToTop.ariaLabel`, `blogPostPage.readingTime`, `postCard.readingTime` and `contentsRail.label`. See ./voice.md.

## Constraints and invariants

- The Summary card has a "Key takeaways" title, a "30 sec read" note and a "Read the full article" button, and renders the summary through the shared Portable Text renderer inside `Prose`; consecutive list items render as one list. It is in the server HTML, `hidden` until opened, and starts closed on every load; nothing is stored. The button is a disclosure (`aria-expanded`, `aria-controls`) and keeps focus; the card's "Read the full article · N min" closes it and moves focus to the article body. Crawlers and the canonical URL see the article.
- Asides always render inline, through `@shinefold/ui`'s `Aside`.
- The contents rail needs at least 3 non-empty H2s (`MIN_H2_HEADINGS_FOR_RAIL`) and lists H2 and H3 (H3 indented). Anchors are the blocks' `_key`s, which the Portable Text renderer sets as the heading ids. The active heading is the top-most one intersecting a band below the header (`rootMargin: -96px 0px -70% 0px`), falling back to the first; it carries `aria-current="location"`.
- On `lg` and up the rail is a sticky 220px column beside the body; below `lg` it is a sticky bar under the site header that opens a panel, which closes on a link click or when focus leaves it. With a rail, full-bleed body images fill the content column instead of breaking out.
- `BackToTopButton` shows once the page has scrolled more than one viewport height and hides while the site footer (`data-testid="site-footer"`) is in view.
- `SidebarNav` is shared with the landing section navigation (./landing-tree.md); a change to it reaches both.

## Dependencies

- Layers: `@shinefold/config` (`ASIDE_KIND`), `@shinefold/utils` (`toReadingTimeMinutes`), `@shinefold/service` (post detail projection), `@shinefold/ui` (`Aside`, `BackToTop`, `Article`, `Button`, `BookmarkToggle`'s variants), `apps/web`.
- Features: ./posts.md (the post page and its data), ./rich-text.md (asides and heading anchors), ./skim-pipeline.md (drafts the summary), ./post-modules.md (card reading time), ./rendering-and-caching.md, ./look.md, ./voice.md.
- Env: none.

## Entry points

- `apps/web/src/components/pages/blog-post-page/blog-post-page.tsx`
- `apps/web/src/components/features/post/post-article/post-article.tsx` and `post-article-variants.ts`
- `apps/web/src/context/post-summary-provider/post-summary-provider.tsx`
- `apps/web/src/components/features/post/post-article/components/post-summary-card/post-summary-card.tsx` and `post-article-actions/post-article-actions.tsx`
- `apps/web/src/components/shared/contents-rail-layout/contents-rail-layout.tsx`, `apps/web/src/components/shared/sidebar-nav/sidebar-nav.tsx`
- `apps/web/src/utils/extract-contents-headings/extract-contents-headings.ts`, `apps/web/src/hooks/use-active-heading-id/use-active-heading-id.ts`
- `packages/service/src/features/pages/post/adaptor/detail-page/transformer.ts`, `packages/service/src/shared/expressions/post/word-count.ts`

## Tests and stories

- Tests beside `back-to-top-button`, `sidebar-nav`, `contents-rail-layout`, `contents-rail`, `use-active-heading-id` and `extract-contents-headings` in `apps/web`; `blog-post-page.test.tsx`, and `post-article.test.tsx` for the composition and the Summary disclosure.
- `packages/utils/src/reading-time/to-reading-time.test.ts`; `packages/ui` `back-to-top` tests.
- Stories: `post-summary-card-view`, `sidebar-nav`, `contents-rail-layout`, `contents-rail` and `post-article` in `apps/web`; `back-to-top` in `packages/ui`.

## Related

None open.
