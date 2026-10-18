---
title: Feature List module
status: built
layers: [config, studio, service, ui, web]
code:
  - packages/studio/src/schema-types/modules/feature-list/**
  - packages/studio/src/schema-types/documents/blocks/feature/**
  - packages/service/src/features/modules/feature-list/**
  - apps/web/src/modules/feature-list/**
  - apps/web/src/testing/modules/feature-list/**
epics: [5016, 5028, 4987]
---

# Feature List module

## What it does

A grid or carousel of feature cards that summarises a set of capabilities or offerings. Each card is a reusable Feature Card document with a heading, supporting text, an icon or image, and an optional link; an editor picks two to eight cards per module, in display order, and chooses the image crop, grid or carousel, and how the heading and the card contents align. In Studio the module is titled **Features**.

## Surfaces and routes

- **Studio:** Modules → Explainers → Features (`module_featureList`); Blocks → Cards → Feature Card (`block_feature`). The module is offered in the `modules` pickers of `template_home` and `template_landing`.
- **Public site:** no route of its own; renders on the home page and landing pages.
- **Platform:** none.

## Data

- **`block_feature`:** `title` (Studio label), `headingBlock` (`moduleHeadingBlock`: per-language `heading`, required in the default language, and `supportingText`), `icon` (one of `FEATURE_ICONS`, a 31-name subset of `ICONS`), `image` (`localizedImageWithAlt`), `link` (reference to a `link` document).
- **`module_featureList`:** `title`, `brandVariant` (initial `PRIMARY`), `headingBlock`, `features` (references to `block_feature`), `ctaButtons` (see ./cta-module.md), `imageShape` (`CARD_IMAGE_SHAPE`: `WIDE` initial, `SQUARE`, `CIRCLE`, `ICON`; required — Team offers only `CIRCLE` and `SQUARE`), `displayMode` (`GRID` initial, `CAROUSEL`), `contentAlignment` (Left/Center, initial Left), `cardAlignment` (Left/Center, initial Left), `layout` (`wideLayout`: spacing, Wide/Full width, dividers).
- **Service shape** (`TFeatureListModule`): `items` as `{ id, headingBlock, sanityImage, icon, link }`; `displayMode` coalesces to `GRID`; card links resolve through the `link` document (an unresolvable link becomes `undefined`); an action whose `link` document resolves without a label or href is dropped, but an action whose `link` document does not resolve (deleted or never published) fails the module's query, so the module renders nothing and `feature_list_module.fetch_failed` is logged.
- **Cache:** `getFeatureList` tags `modules:featureList`, `module:<id>`, `block_feature`, `link`, `homePage`, `page_landing`. The publish webhook maps `module_featureList` → `modules:featureList` and `block_feature` → `block_feature`.

## Configuration

- **Editors** write Feature Cards under Blocks → Cards and assemble them in Features modules.
- **Look** reaches the cards through tokens: card style (`ACCENT_BAR` or `OUTLINED`), radius, card padding and gap from density, fonts, accent. Voice does not reach card copy; the carousel's region and previous/next labels are fixed catalog strings (`carousel` namespace).
- **Plans:** not gated.

## Constraints and invariants

- A Feature Card needs an icon or an image (a document-level error on both fields), so every card has a visual.
- `features` is `required()`, `unique()`, `min(2)` and `max(8)`, each its own rule chain. The service models it nullable anyway and returns an empty `items` list when the array is absent or holds fewer than two cards; the view renders whatever it gets, with no empty-list guard.
- Icon versus image is decided per card at render time: an image wins over an icon. `imageShape` only describes how images are cropped; there is no show-images switch.
- When any card in the module has an image, every card takes the image shape, and an icon-only card fills a media slot of that size with the brand tint, icon centred, so headings line up. With Circle the slot is a tinted circle the size of the image circles, left with Left card alignment and centred with Center. When no card has an image, cards render the icon tile alone.
- With Icon, every card's media is the small rounded icon tile (48px): an image is cropped into it, an icon sits on its tint, and the tile follows card alignment. Headings line up without a panel.
- Grid columns come from the card count, not from an authored field: 2→2, 3→3, 4→4, 5→3, 6→3, 7→4, 8→4 (`toModuleGridColumns`, shared with other card modules). The carousel ignores the rule.
- `cardAlignment` stores uppercase `CONTENT_ALIGNMENT` values; the view maps them to `MediaCard`'s lowercase `left`/`center`. `contentAlignment` aligns the heading and actions, and a carousel that does not overflow lines up the same way.
- A card with a link is interactive: the heading becomes a stretched link to the resolved `href`. Card headings are `h3` under the module's `h2`.
- `FeatureListCarousel` is the module's `'use client'` leaf; the grid is server-rendered.

## Dependencies

- Layers: `config` (`FEATURE_ICONS`, `CARD_IMAGE_SHAPE`, `DISPLAY_MODE`, `CONTENT_ALIGNMENT`), `studio`, `service`, `ui` (`MediaCard`, `CardGrid`, `Icon`, `Carousel`), `web`.
- Features: ./module-system.md, ./links.md, ./cta-module.md (actions), ./look.md, ./design-tokens-and-surfaces.md, ./languages.md, ./page-types.md, ./landing-tree.md, ./rendering-and-caching.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/modules/feature-list/feature-list.ts`, `packages/studio/src/schema-types/documents/blocks/feature/feature.ts`
- `packages/service/src/features/modules/feature-list/adaptor/query.ts`, `transformer.ts`, `loader.ts`
- `apps/web/src/modules/feature-list/feature-list-module.tsx`, `feature-list-module-view.tsx`
- `apps/web/src/modules/feature-list/components/feature-list-card/feature-list-card.tsx`, `components/feature-list-carousel/feature-list-carousel.tsx`
- `apps/web/src/utils/to-module-grid-columns/to-module-grid-columns.ts`
- `packages/config/src/constants/icon.ts` (`FEATURE_ICONS`)

## Tests and stories

- `packages/service/src/features/modules/feature-list/adaptor/*.test.ts`
- `apps/web/src/modules/feature-list/feature-list-module.test.tsx`, `feature-list-module-view.test.tsx`, `components/feature-list-card/feature-list-card.test.tsx`, `components/feature-list-carousel/feature-list-carousel.test.tsx`
- `apps/web/src/utils/to-module-grid-columns/to-module-grid-columns.test.ts`, `packages/config/src/constants/icon.test.ts`
- Stories: `apps/web/src/modules/feature-list/feature-list-module-view.stories.tsx`, `packages/ui/src/components/molecules/media-card/media-card.stories.tsx`.
- Fixtures: `apps/web/src/testing/modules/feature-list/fixtures.ts`.

## Related

- #3252 — a visual icon picker for `block_feature.icon`.
- #4858 — card hover and the feature icon tile stay visible on a Brand tint band.
- #5016 — one-entry skins: #5019 (Background field lists the skin registry), #5022 (`Section` renders its skin; `tone` threading leaves the feature-list carousel and view).
- #5028 — text roles: #5032 (card titles step up from one container), #5034 (card body text takes the card roles).
- #4987 — accessible text and colour: #5007 (a card's focus ring outlines the whole card).
