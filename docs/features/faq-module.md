---
title: FAQ module
status: built
layers: [config, studio, service, ui, web]
code:
  - packages/studio/src/schema-types/modules/faq/**
  - packages/studio/src/schema-types/documents/blocks/faq/**
  - packages/service/src/features/modules/faq/**
  - packages/service/src/shared/fragments/faq/**
  - packages/service/src/shared/adaptors/faq-questions/**
  - packages/service/src/shared/transformers/faq/**
  - packages/service/src/testing/shared/faq-page-dataset.ts
  - packages/ui/src/components/organisms/accordion/**
  - apps/web/src/modules/faq/**
  - apps/web/src/components/features/faq-page-schema/**
  - apps/web/src/utils/build-faq-page-schema/**
  - apps/web/src/testing/modules/faq/**
epics: [4987, 5028, 5016]
---

# FAQ module

## What it does

A section of the questions a visitor asks before getting in touch, each a disclosure row that opens to its answer. Questions are reusable documents: an editor writes each question and answer once as an FAQ Item and picks two to twenty of them, in reading order, for each FAQ module. Every page that carries FAQ modules also publishes them to search engines as one `FAQPage` structured-data block.

## Surfaces and routes

- **Studio:** Modules → Explainers → FAQ (`module_faq`); Blocks → FAQs → FAQ Item (`block_faq`). The module is offered in the `modules` pickers of `template_home`, `template_landing`, `template_topic` and `template_tag`.
- **Public site:** no route of its own; renders on the home page, landing pages, topic pages and tag pages. Those four page types also emit the `FAQPage` JSON-LD.
- **Platform:** none.

## Data

- **`block_faq`:** `title` (Studio label), `question` (per-language one-line text), `answer` (per-language `listedText`: paragraphs, bullet/numbered lists, bold, italic, sub/superscript, `linkRef`).
- **`module_faq`:** `title`, `brandVariant` (initial `PRIMARY`), `headingBlock` (`moduleHeadingBlock`), `questions` (references to `block_faq`), `ctaButtons` (see ./cta-module.md), `contentAlignment` (Left/Center, initial Left), `layout` (`layout`: spacing, Narrow–Full width, dividers).
- **Service shape** (`TFaqModule`): `questions` as `{ id, question, answer }` in authored order, with `question` and `answer` in the request language, else the default language; an action whose `link` document resolves without a label or href is dropped, but an action whose `link` document does not resolve (deleted or never published) fails the module's query, so the module renders nothing and `faq_module.fetch_failed` is logged.
- **Structured data:** the home, landing, topic and tag loaders call `getPageFaqs(page.modules)`, which loads every FAQ module on the page in one query and returns `faqs: { id, question, answer }[]` with answers flattened to plain text.
- **Cache:** `getFaqModule` tags `modules:faq`, `module:<id>`, `block_faq`, `link`, `homePage`, `page_landing`, `page_topic`, `page_tag`; `getFaqQuestions` tags `modules:faq`, `block_faq`, `link`. The publish webhook maps `module_faq` → `modules:faq` and `block_faq` → `block_faq`.

## Configuration

- **Editors** write FAQ Items under Blocks → FAQs and assemble them in FAQ modules. Question and answer are per language.
- **Look** reaches the module through tokens (fonts, band spacing, accent); Voice does not reach FAQ copy.
- **Plans:** not gated.

## Constraints and invariants

- `questions` is `required()`, `unique()`, `min(2)` and `max(20)`, each its own rule chain with its own message. The view renders whatever it is handed, with no empty-list guard.
- An FAQ Item must have a question and an answer in the default language.
- Each question's `question` and `answer` are projected `.notNull()`: a question missing both its request-language and default-language value fails the module's query, so the module renders nothing and `faq_module.fetch_failed` is logged; the page still renders.
- The disclosure is `@blog/ui`'s `Accordion` on Base UI: every row starts closed, any number may be open, and a closed panel stays in the DOM (`hiddenUntilFound`) so find-in-page still matches answer text.
- The questions sit in a column capped at `max-w-post`; `contentAlignment` aligns the heading, the column and the actions together (Center centres the column).
- The `FAQPage` JSON-LD covers every FAQ module on the page, deduplicated by `block_faq` id, skipping any question whose question or plain-text answer is empty; with no questions it renders nothing. One page never emits two `FAQPage` blocks.

## Dependencies

- Layers: `studio`, `service`, `ui` (`Accordion`), `web`; `config` for `portableTextToPlainText` and `CONTENT_ALIGNMENT`.
- Features: ./module-system.md, ./cta-module.md (actions), ./links.md, ./rich-text.md, ./languages.md, ./seo-and-feeds.md (JSON-LD), ./page-types.md, ./landing-tree.md, ./topics-and-tags.md, ./design-tokens-and-surfaces.md, ./rendering-and-caching.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/modules/faq/faq.ts`, `packages/studio/src/schema-types/documents/blocks/faq/faq.ts`
- `packages/service/src/features/modules/faq/adaptor/query.ts`, `transformer.ts`, `loader.ts`
- `packages/service/src/shared/fragments/faq/block-faq.ts`
- `packages/service/src/shared/adaptors/faq-questions/page-faqs.ts`, `packages/service/src/shared/transformers/faq/resolve-faqs.ts`
- `packages/ui/src/components/organisms/accordion/accordion.tsx`
- `apps/web/src/modules/faq/faq-module.tsx`, `faq-module-view.tsx`
- `apps/web/src/components/features/faq-page-schema/faq-page-schema.tsx`, `apps/web/src/utils/build-faq-page-schema/build-faq-page-schema.ts`

## Tests and stories

- `packages/service/src/features/modules/faq/adaptor/*.test.ts`, `packages/service/src/shared/adaptors/faq-questions/*.test.ts`, `packages/service/src/shared/transformers/faq/resolve-faqs.test.ts`
- `packages/ui/src/components/organisms/accordion/accordion.test.tsx`
- `apps/web/src/modules/faq/faq-module.test.tsx`, `apps/web/src/components/features/faq-page-schema/faq-page-schema.test.tsx`, `apps/web/src/utils/build-faq-page-schema/build-faq-page-schema.test.ts`
- Stories: `apps/web/src/modules/faq/faq-module-view.stories.tsx`, `packages/ui/src/components/organisms/accordion/accordion.stories.tsx`.
- Fixtures: `apps/web/src/testing/modules/faq/fixtures.ts`, `packages/service/src/testing/shared/faq-page-dataset.ts`.

## Related

- #4987 — accessible text and colour: #5011 (answers space their paragraphs and lists).
- #5028 — text roles: #5032 (the question takes ITEM_TITLE), #5034 (the answer takes the card-body role).
- #5016 — one-entry skins: the Background field lists the skin registry (#5019) and `Section` renders its skin (#5022).
