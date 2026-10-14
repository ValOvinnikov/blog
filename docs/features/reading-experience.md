---
title: Reading experience
status: built
layers: [config, utils, service, ui, web]
code:
  - packages/config/src/constants/depth.ts
  - packages/utils/src/reading-time/**
  - packages/ui/src/components/atoms/back-to-top/**
  - apps/web/src/context/depth-provider/**
  - apps/web/src/config/depth-script.ts
  - apps/web/src/components/shared/depth-toggle/**
  - apps/web/src/components/shared/skim-panel/**
  - apps/web/src/components/shared/switch-to-read-button/**
  - apps/web/src/components/shared/deep-aside/**
  - apps/web/src/components/shared/back-to-top-button/**
  - apps/web/src/components/shared/sidebar-nav/**
  - apps/web/src/components/features/post/post-table-of-contents/**
  - apps/web/src/hooks/use-active-heading-id/**
  - apps/web/src/utils/extract-post-headings/**
  - apps/web/src/testing/shared/post-table-of-contents/**
  - apps/web/src/testing/shared/sidebar-nav/**
epics: []
---

# Reading experience

## What it does

A post page offers the reader three depths: **30s** (a short list of takeaways), **Read** (the article as written, the default) and **Deep** (the article with its asides expanded in place). The control sits above the article and only lists the depths that post supports. A long post also gets a "Contents" rail that tracks the heading in view, and every post shows an estimated reading time and a back-to-top button. **30s** appears only once the post has takeaways, which an editor writes or ./skim-pipeline.md drafts when it is triggered, and an editor then publishes; **Deep** follows from the post's asides and the rail from its headings.

## Surfaces and routes

- **Public site:** `/blog/{slug}` (with the language prefix for a non-default language), composed by `BlogPostPage`. `DepthProvider` wraps `DepthToggle`, `PostArticle` and `SkimPanel`; the post's own `modules[]` render below it, outside the provider.
- **Post cards:** reading time also appears on post cards in the post modules ("N min"), through `toPostListItems`.
- **Studio:** no dedicated surface. Takeaways are the post's `postTakeaways` field and asides are blocks in its body (./rich-text.md). The takeaways are written by an editor, or drafted by ./skim-pipeline.md when it is triggered and then published by an editor.
- **Platform:** none.

## Data

- `page_post.postTakeaways` (`takeaways[]`, `generatedAt`, `model`), read as `TPostDetail.postTakeaways`. Fewer than 3 takeaways is treated as none (`toPostTakeaways`).
- `TPostDetail.hasAsides` is true when any top-level body block is an `aside`.
- `TPostDetail.readingTimeMinutes` comes from a GROQ word count over the top-level `block`s of `content` (`WORD_COUNT_EXPRESSION`, split on spaces) and `toReadingTimeMinutes` (200 words a minute, rounded up, at least 1). Asides, code and images are not counted.
- The contents outline is derived on the server from the body (`extractPostHeadings`); nothing is stored.
- The reader's chosen depth lives only in the browser: `localStorage` key `reading-depth` (`DEPTH_STORAGE_KEY`), one value for the whole site.
- Cache: everything rides the post read (`getPostPage` → `service.pages.post.v1.getPost`), tagged with the post and the types it references and revalidated by the publish webhook, with the route's 21600s backstop. Switching depth never fetches. See ./rendering-and-caching.md.

## Configuration

- Not plan-gated and not a capability: every tenant's posts get all of it.
- Editors decide availability per post: approved takeaways (3 or more) enable **30s**, at least one aside enables **Deep**. A post with neither shows no control.
- Look reaches it through the shared tokens (the `SegmentedControl`, the skim cards, the aside styling). See ./look.md.
- Every string is fixed catalog copy, not Voice: `blogPostPage.depthToggle.*`, `blogPostPage.skimPanel.*`, `blogPostPage.asideKind.*`, `blogPostPage.backToTop.ariaLabel`, `blogPostPage.readingTime`, `postCard.readingTime` and `postContentsRail.label`. See ./voice.md.

## Constraints and invariants

- `DEPTH` is `SKIM`, `READ`, `DEEP` (`@blog/config`). Toggle order is 30s, Read, Deep; `READ` is always offered when the control renders.
- All three depths ship in the same server-rendered HTML. Visibility is CSS only, keyed off `data-depth` on the provider's wrapper through the named group `group/depth`: SKIM hides the article body and footer and shows `SkimPanel`; DEEP shows `DeepAside`. The article header stays at every depth. Crawlers and the canonical URL see the Read article.
- A stored depth is clamped to what the current post supports (`allowedDepths`), both in the inline pre-hydration script and in the provider's mount effect, so a reader is never stranded on a depth the post cannot show. The effect re-runs when `hasSkim`/`hasDeep` change on client navigation.
- The inline script stamps `data-depth` before paint so a returning 30s/Deep reader sees no flash of Read. It renders only on the hydrating render (`useSyncExternalStore` snapshot pair), never on a client-only mount. `localStorage` failures fall back to Read.
- `useDepth` throws outside a `DepthProvider`. `DeepAside` checks `useHasDepthProvider`: outside a provider (for example a content module) an aside always renders.
- `SkimPanel` stays a server component; only `SwitchToReadButton` is a client leaf. Its button returns the reader to Read.
- The contents rail needs at least 3 non-empty H2s (`MIN_H2_HEADINGS_FOR_RAIL`) and lists H2 and H3 (H3 indented). Anchors are the blocks' `_key`s, which the Portable Text renderer sets as the heading ids. The active heading is the top-most one intersecting a band below the header (`rootMargin: -96px 0px -70% 0px`), falling back to the first; it carries `aria-current="location"`.
- On `lg` and up the rail is a sticky 220px column beside the body; below `lg` it is a sticky bar under the site header that opens a panel, which closes on a link click or when focus leaves it. With a rail, full-bleed body images fill the content column instead of breaking out.
- `BackToTopButton` shows once the page has scrolled more than one viewport height and hides while the site footer (`data-testid="site-footer"`) is in view.
- `SidebarNav` is shared with the landing section navigation (./landing-tree.md); a change to it reaches both.

## Dependencies

- Layers: `@blog/config` (`DEPTH`, `ASIDE_KIND`), `@blog/utils` (`toReadingTimeMinutes`), `@blog/service` (post detail projection), `@blog/ui` (`SegmentedControl`, `Aside`, `BackToTop`, `Article`, `Button`), `apps/web`.
- Features: ./posts.md (the post page and its data), ./rich-text.md (asides and heading anchors), ./skim-pipeline.md (drafts the takeaways), ./post-modules.md (card reading time), ./rendering-and-caching.md, ./look.md, ./voice.md.
- Env: none.

## Entry points

- `apps/web/src/components/pages/blog-post-page/blog-post-page.tsx`
- `apps/web/src/components/features/post/post-article/post-article.tsx` and `post-article-variants.ts`
- `apps/web/src/context/depth-provider/depth-provider.tsx`, `apps/web/src/config/depth-script.ts`
- `apps/web/src/components/shared/depth-toggle/depth-toggle.tsx`
- `apps/web/src/components/shared/skim-panel/skim-panel.tsx`, `apps/web/src/components/shared/deep-aside/deep-aside.tsx`
- `apps/web/src/components/features/post/post-table-of-contents/post-table-of-contents.tsx`, `apps/web/src/components/shared/sidebar-nav/sidebar-nav.tsx`
- `apps/web/src/utils/extract-post-headings/extract-post-headings.ts`, `apps/web/src/hooks/use-active-heading-id/use-active-heading-id.ts`
- `packages/service/src/features/pages/post/adaptor/detail-page/transformer.ts`, `packages/service/src/shared/expressions/post/word-count.ts`

## Tests and stories

- Tests beside `depth-provider`, `depth-toggle`, `skim-panel`, `switch-to-read-button`, `deep-aside`, `back-to-top-button`, `sidebar-nav`, `post-table-of-contents`, `use-active-heading-id` and `extract-post-headings` in `apps/web`; `blog-post-page.test.tsx` and `post-article.test.tsx` for the composition.
- `packages/utils/src/reading-time/to-reading-time.test.ts`; `packages/ui` `back-to-top` and `segmented-control` tests.
- Stories: `depth-toggle`, `deep-aside`, `sidebar-nav`, `post-table-of-contents` and `post-article` in `apps/web`; `back-to-top` and `segmented-control` in `packages/ui`.

## Related

None open.
