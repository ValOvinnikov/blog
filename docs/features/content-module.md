---
title: Content module
status: built
layers: [studio, service, ui, web]
code:
  - packages/studio/src/schema-types/modules/content/**
  - packages/service/src/features/modules/content/**
  - packages/ui/src/components/organisms/content-module/**
  - apps/web/src/modules/content/**
epics: [5016, 5028, 4987]
---

# Content module

## What it does

A section of written content placed between a page's other modules: headings, paragraphs, quotes, lists, images, code blocks and asides, in the same rich text a post body uses. It has no structured heading of its own — any headings live inside the text. Editors use it for the prose a landing, home or index page needs around its other sections.

## Surfaces and routes

- **Studio:** Modules → Explainers → Content (`module_content`). Offered in the `modules` pickers of `template_home`, `template_landing`, `template_postIndex`, `template_topic`, `template_tag`, `template_topicIndex` and `template_tagIndex`. Posts do not offer it.
- **Public site:** no route of its own; renders on the home page, landing pages, the post index, topic and tag pages and the two taxonomy indexes.
- **Platform:** none.

## Data

- **`module_content`:** `title` (Studio label), `brandVariant` (initial `PRIMARY`), `body` (`internationalizedArrayArticleText`: one `articleText` array per language), `layout` (`layout`: spacing, Narrow–Full width, dividers).
- **`articleText`:** blocks styled Normal, H2, H3, H4 or Quote (no H1); bold, italic, code, underline, strike-through, sub/superscript; `linkRef` annotations; plus `bodyImage`, `code` and `aside` blocks.
- **Service shape** (`TContentModule`): `{ brandVariant, body, layout }`, where the query picks `body` in the request language, else the default language (`getLocalizedArticleText`), and the shared post-body transformer (`toPortableTextBody`) maps those blocks.
- **Cache:** `getContent` tags `modules:content`, `module:<id>`, `link` and the eight page types. The publish webhook maps `module_content` → `modules:content` plus `module:<id>`.

## Configuration

- **Editors** write the body per language in Studio and pick the background and layout.
- **Look** reaches it through tokens (fonts, accent, radius on images and code blocks, band spacing); Voice does not reach module copy.
- **Plans:** not gated.

## Constraints and invariants

- The body must be filled in the default language.
- `body` is projected `.notNull()`: a document with no body in either the request or the default language fails the query, so the module renders nothing and `content_module.fetch_failed` is logged; the page still renders.
- No `headingBlock`, no `contentAlignment` and no `ctaButtons`: the body supplies its own headings and links. Because there is no module heading, the `Section` landmark gets no `aria-labelledby`.
- Body text is left-aligned in a column capped at the text measure (`ContentModule`'s body slot) and centred in the container; each block is also capped at the measure, except a `bodyImage` laid out `FULL_BLEED`, which skips the per-block cap but still stays within the measure-wide column. Blocks are spaced `mt-6` apart.
- Rendering goes through the shared `PortableText` component inside `@blog/ui`'s `Prose`, so headings, links, images, code blocks and asides look the same as in a post body.
- Posts deliberately do not allow `module_content`, so a post never has two places for its article prose.

## Dependencies

- Layers: `studio`, `service`, `ui` (`ContentModule`, `Prose`), `web` (`PortableText`, `Section`).
- Features: ./module-system.md, ./rich-text.md (the article-text model and its renderers), ./links.md, ./languages.md, ./design-tokens-and-surfaces.md, ./look.md, ./page-types.md, ./landing-tree.md, ./rendering-and-caching.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/modules/content/content.ts`
- `packages/studio/src/schema-types/portable-text/article-text/article-text.ts`
- `packages/service/src/features/modules/content/adaptor/query.ts`, `transformer.ts`, `loader.ts`
- `packages/ui/src/components/organisms/content-module/content-module.tsx`
- `apps/web/src/modules/content/content-module.tsx`, `content-module-view.tsx`, `content-module-view-variants.ts`
- `apps/web/src/components/shared/portable-text/config/full-bleed.ts`

## Tests and stories

- `packages/service/src/features/modules/content/adaptor/*.test.ts`
- `packages/ui/src/components/organisms/content-module/content-module.test.tsx`
- `apps/web/src/modules/content/content-module.test.tsx`, `content-module-view.test.tsx`
- Stories: `packages/ui/src/components/organisms/content-module/content-module.stories.tsx`, `apps/web/src/modules/content/content-module-view.stories.tsx`.

## Related

- #5016 — one-entry skins: #5019 (Background field lists the skin registry), #5022 (`Section` renders its skin).
- #5028 — text roles: #5042 (`Prose` chooses typography only through the registry).
- #4987 — accessible text and colour: #4989 (prose-sized headings keep their text colour), #5008 (a sideways-scrolling code block can be focused and is named), #5010 (a link's resting underline is visible on every band).
