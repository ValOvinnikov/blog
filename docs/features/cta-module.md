---
title: Call to Action module
status: built
layers: [config, studio, service, ui, web]
code:
  - packages/config/src/constants/cta.ts
  - packages/studio/src/schema-types/modules/cta/**
  - packages/studio/src/schema-types/objects/cta-layout/**
  - packages/studio/src/schema-types/objects/cta-button/**
  - packages/studio/src/schema-types/fields/cta-buttons-field/**
  - packages/service/src/features/modules/cta/**
  - packages/service/src/shared/fragments/cta/**
  - packages/service/src/shared/transformers/cta/**
  - packages/ui/src/components/organisms/cta-module/**
  - apps/web/src/modules/cta/**
  - apps/web/src/components/shared/action-group/**
  - apps/web/src/utils/banner-section-layout/**
  - apps/web/src/testing/modules/cta/**
epics: [5016, 5028, 4987]
---

# Call to Action module

## What it does

A focused section that asks the reader to do one thing — subscribe, get in touch, read on. An editor writes a heading, optional eyebrow, supporting text, longer copy and footnote, adds up to two actions, and picks one of three shapes: **Callout** (a card on the section band, image above the copy), **Split** (a card with the image beside the copy) or **Banner** (a full-bleed band with the image behind the copy under a scrim). It is the one module every page type accepts, posts included.

The same "Actions" building block — `ctaButtons`, rendered by `ActionGroup` — is reused by most other modules for their own buttons; this page owns it.

## Surfaces and routes

- **Studio:** Modules → Conversion → Call to Action (`module_cta`). Offered in the Conversion group of every `modules` picker: `template_home`, `template_landing`, `template_postIndex`, `template_topic`, `template_tag`, `template_topicIndex`, `template_tagIndex`, and `page_post.modules[]` (`DEFAULT_MODULES` in `modules-field.ts`).
- **Public site:** no route of its own; renders wherever its page renders — home, landing pages, posts, the post index, topic and tag pages and the two taxonomy indexes.
- **Platform:** none.

## Data

- **`module_cta`:** `title` (Studio label), `brandVariant` (titled Card background, initial `SECONDARY`), `bandTone` (titled Background, initial `PRIMARY`, hidden on Banner), `variant` (`CTA_VARIANT`: `CALLOUT` initial, `SPLIT`, `BANNER`), `headingBlock` (`moduleHeadingBlock`: per-language `heading`, required in the default language, and `supportingText`), `eyebrow` (per language), `image` (`localizedImageWithAlt`), `content` (per-language `listedText`: paragraphs, bullet/numbered lists, bold, italic, sub/superscript, `linkRef`), `ctaButtons`, `footnote` (per language), `contentAlignment` (Left/Center/Right), `contentPositionSplit` (Left/Right), `contentPositionBanner` (Left/Center/Right), `mobileMediaOrder` (Split only, initial `LAST`), `layout` (`ctaLayout`: spacing, container width and dividers; width and dividers hidden on Banner).
- **Actions:** `ctaButtons` is an array of `ctaButton` — `variant` (`CTA_ACTION_VARIANT`: `PRIMARY`/`SECONDARY`), `appearance` (`CTA_ACTION_APPEARANCE`: `CONTAINED`/`INLINE`) and a required reference to a `link` document. `ctaSecondaryButton` is the same object with the variant fixed to `SECONDARY`, hidden, and the link optional.
- **Service shape** (`TCtaModule`): the two position fields collapse into one `contentPosition` (`undefined` on Callout); `bandTone` falls back to `PRIMARY`; per-language fields take the request language, else the default language; an empty `content` becomes `undefined`; an action whose `link` document resolves without a label or href is dropped.
- **Cache:** `getCta` tags `modules:cta`, `module:<id>`, `link`, the eight page types and `topic`. The publish webhook maps `module_cta` → `modules:cta` plus `module:<id>`, and purges `module:<id>` when a referenced `link` changes.

## Configuration

- **Editors** author every field in Studio. Text, image alt and footnote are per language.
- **Look** reaches the card through tokens (radius, card padding, shadow, fonts, accent, density's band spacing); Voice does not reach CTA copy.
- **Plans:** not gated; every plan can place it.

## Constraints and invariants

- `image` is required for Split and Banner (a custom error, since `required()` cannot depend on a sibling).
- `bandTone` equal to `brandVariant` raises a non-blocking warning ("the card will blend into the section"); it is not checked on Banner.
- At most two actions; each variant at most once; a `PRIMARY` action, when present, comes first. `ctaButtonsField` defaults to `min = 0`, so no actions is a valid module.
- Footnote at most 120 characters in each language.
- Two tones, two jobs: `Section` paints `bandTone` as the full-bleed band, and `CtaModule` paints `brandVariant` (its `tone`) on the card. On Banner the view forces the band to `PRIMARY` with `BANNER_SECTION_LAYOUT` (no spacing, no dividers); the authored `spacingTop`/`spacingBottom` set the Banner's own height instead, and `tone` picks its fill and scrim (brand scrim on Brand tint, neutral otherwise).
- Content position and content alignment are separate axes: position moves the copy block (grid column on Split, place over the image on Banner, nothing on Callout); alignment aligns text and actions inside it on every shape. The UI defaults position to Left, alignment to Left except on Split, and Split's mobile media order to Last.
- Action rendering (`ActionGroup`): `INLINE` renders as a text link; otherwise `PRIMARY` is a filled button and `SECONDARY` a ghost button. Over a Banner, non-primary actions reverse for the dark photo.
- The heading is always an `h2` with `visual="section"`, and its id labels the `Section` landmark.
- `variant`, `brandVariant`, `headingBlock` and each action's `link` reference are projected `.notNull()`: a document without them, or with an action whose `link` document does not resolve (deleted or never published), fails the query, the module renders nothing and `cta_module.fetch_failed` is logged; the page still renders.

## Dependencies

- Layers: `config` (`CTA_VARIANT`, `CTA_ACTION_*`, `BRAND_VARIANT`, `CONTENT_ALIGNMENT`, `MEDIA_ORDER`), `studio`, `service`, `ui` (`CtaModule`, shared `bannerVariants`), `web`.
- Features: ./module-system.md, ./links.md (every action is a `link` document), ./heroes.md (shares the Banner recipe), ./design-tokens-and-surfaces.md, ./look.md, ./rich-text.md, ./languages.md, ./page-types.md, ./post-modules.md, ./rendering-and-caching.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/modules/cta/cta.ts`
- `packages/studio/src/schema-types/objects/cta-button/cta-button.ts`, `fields/cta-buttons-field/cta-buttons-field.ts`, `objects/cta-layout/cta-layout.ts`
- `packages/service/src/features/modules/cta/adaptor/query.ts`, `transformer.ts`, `loader.ts`
- `packages/service/src/shared/transformers/cta/to-cta-button.ts`
- `packages/ui/src/components/organisms/cta-module/cta-module.tsx`, `cta-module-variants.ts`
- `packages/ui/src/lib/styling/banner.ts`
- `apps/web/src/modules/cta/cta-module.tsx`, `cta-module-view.tsx`
- `apps/web/src/components/shared/action-group/action-group.tsx`

## Tests and stories

- `packages/service/src/features/modules/cta/adaptor/*.test.ts`, `packages/service/src/shared/transformers/cta/*.test.ts`
- `packages/ui/src/components/organisms/cta-module/cta-module.test.tsx`, `apps/web/src/modules/cta/cta-module.test.tsx`, `cta-module-view.test.tsx`, `apps/web/src/components/shared/action-group/action-group.test.tsx`
- Stories: `packages/ui/src/components/organisms/cta-module/cta-module.stories.tsx`, `apps/web/src/modules/cta/cta-module-view.stories.tsx`, `apps/web/src/components/shared/action-group/action-group.stories.tsx`. No CTA module story (`cta-module.stories.tsx`, `cta-module-view.stories.tsx`) shows an `INLINE` action.
- Fixtures: `apps/web/src/testing/modules/cta/fixtures.ts`.

## Related

- #5016 — one-entry skins: #5019 (the Background fields list the skin registry), #5021 (`CtaModule` card and Banner render `data-skin`; tone-keyed `bg-*`/`surface-*` pairs go), #5022 (`Section` renders its skin; `isOnDark` leaves `ActionGroup`).
- #5028 — text roles: #5033 (CTA supporting text becomes INTRO, footnote becomes FOOTNOTE).
- #4987 — accessible text and colour: #3076 (Banner copy AA-legible over a bright photo).
