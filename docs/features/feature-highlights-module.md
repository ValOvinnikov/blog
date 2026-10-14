---
title: Feature Highlights module
status: built
layers: [config, studio, service, ui, web]
code:
  - packages/studio/src/schema-types/modules/feature-highlights/**
  - packages/studio/src/schema-types/objects/feature-highlight/**
  - packages/service/src/features/modules/feature-highlights/**
  - apps/web/src/modules/feature-highlights/**
  - apps/web/src/testing/modules/feature-highlights/**
epics: [5028, 5016]
---

# Feature Highlights module

## What it does

A short story told in two to six rows, each pairing an image with a heading, a sentence or two of formatted text and an optional action. On wide screens the rows alternate sides, so the image swaps from left to right down the section; on phones every image sits above its text. It suits product screenshots and illustrations that each make one point.

## Surfaces and routes

- **Studio:** Modules → Explainers → Feature Highlights (`module_featureHighlights`). Offered in the `modules` pickers of `template_home` and `template_landing`. Rows are inline `featureHighlight` objects, not separate documents, so there is no Blocks entry.
- **Public site:** no route of its own; renders on the home page and landing pages.
- **Platform:** none.

## Data

- **`module_featureHighlights`:** `title` (Studio label), `brandVariant` (initial `PRIMARY`), `headingBlock` (`moduleHeadingBlock`), `highlights` (array of `featureHighlight`), `ctaButtons` (see ./cta-module.md), `mediaOrder` (`MEDIA_ORDER`: `FIRST` initial, `LAST`; required), `contentAlignment` (Left/Center, initial Left), `layout` (`wideLayout`: spacing, Wide/Full width, dividers).
- **`featureHighlight`:** `heading` (per-language one-line text), `body` (per-language `listedText`: paragraphs, bullet/numbered lists, bold, italic, sub/superscript, `linkRef`), `image` (`localizedImageWithAlt`), `action` (`ctaSecondaryButton`: a `link` reference plus `appearance`, variant fixed to `SECONDARY`).
- **Service shape** (`TFeatureHighlightsModule`): `highlights` as `{ id, heading, body, image, action }`, keyed by the row's `_key`; text in the request language, else the default language; an `action` without a resolvable link becomes `undefined`.
- **Cache:** `getFeatureHighlightsModule` tags `modules:featureHighlights`, `module:<id>`, `link`, `homePage`, `page_landing`. The publish webhook maps `module_featureHighlights` → `modules:featureHighlights`.

## Configuration

- **Editors** author every row inline on the module in Studio. Heading, body and image alt are per language.
- **Look** reaches the module through tokens (media radius, fonts, band spacing, accent); Voice does not reach row copy.
- **Plans:** not gated.

## Constraints and invariants

- `highlights` is `required()`, `min(2)` and `max(6)`, each its own rule chain.
- Every row needs a default-language heading, a default-language body and an image with an asset.
- Each row's `heading`, `body` and `image` are projected `.notNull()`: a row missing any of them in both the request and the default language fails the module's query, so the module renders nothing and `feature_highlights_module.fetch_failed` is logged; the page still renders.
- `mediaOrder` sets the first row's image side from `lg` up — `FIRST` puts it at the start, `LAST` at the end — and each following row flips. Below `lg` the image always comes before its text, whatever `mediaOrder` says.
- Images render in a 4:3 frame from `lg` up; below `lg` the frame is capped at `min(20rem, 40svh)` tall.
- `contentAlignment` aligns the module heading, supporting text and actions only; row text is always start-aligned.
- Row headings are `h3` under the module's `h2`. A row's action renders through `ActionGroup` as a single secondary action (ghost button, or a text link when `INLINE`).

## Dependencies

- Layers: `config` (`MEDIA_ORDER`, `CONTENT_ALIGNMENT`), `studio`, `service`, `ui` (`Heading`, `MediaFrame`, `Prose`), `web`.
- Features: ./module-system.md, ./cta-module.md (actions), ./links.md, ./rich-text.md, ./languages.md, ./design-tokens-and-surfaces.md, ./look.md, ./page-types.md, ./landing-tree.md, ./rendering-and-caching.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/modules/feature-highlights/feature-highlights.ts`
- `packages/studio/src/schema-types/objects/feature-highlight/feature-highlight.ts`
- `packages/service/src/features/modules/feature-highlights/adaptor/query.ts`, `transformer.ts`, `loader.ts`
- `apps/web/src/modules/feature-highlights/feature-highlights-module.tsx`, `feature-highlights-module-view.tsx`
- `apps/web/src/modules/feature-highlights/components/feature-highlight-row/feature-highlight-row.tsx`

## Tests and stories

- `packages/service/src/features/modules/feature-highlights/adaptor/query.test.ts`, `transformer.test.ts` (the loader has no test)
- `apps/web/src/modules/feature-highlights/feature-highlights-module.test.tsx`, `feature-highlights-module-view.test.tsx`, `components/feature-highlight-row/feature-highlight-row.test.tsx`
- Stories: `apps/web/src/modules/feature-highlights/feature-highlights-module-view.stories.tsx`.
- Fixtures: `apps/web/src/testing/modules/feature-highlights/fixtures.ts`.

## Related

- #5028 — text roles: #5039 (the row title moves to ITEM_TITLE).
- #5016 — one-entry skins: #5019 (Background field lists the skin registry), #5022 (`Section` renders its skin).
