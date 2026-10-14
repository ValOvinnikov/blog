---
title: Testimonial module
status: built
layers: [studio, service, ui, web]
code:
  - packages/studio/src/schema-types/modules/testimonial/**
  - packages/studio/src/schema-types/documents/blocks/testimonial/**
  - packages/service/src/features/modules/testimonial/**
  - packages/ui/src/components/molecules/quote-card/**
  - apps/web/src/modules/testimonial/**
  - apps/web/src/utils/to-testimonial-grid-columns/**
  - apps/web/src/testing/modules/testimonial/**
epics: [5028, 5047, 5016, 4987]
---

# Testimonial module

## What it does

An editor shows quotes from clients or readers as social proof. Quotes are reusable documents written once and picked into any number of Testimonials modules. One quote renders as a single centred spotlight; two or more render as a card grid or a carousel. Each card shows the quote, the person's image or initials, their name (optionally linked) and their role.

## Surfaces and routes

- **Studio** — `module_testimonial` ("Testimonials") under Modules → **Proof**. The quotes themselves are `block_testimonial` ("Testimonial Item") documents under **Blocks → Cards**, beside Feature Card.
- **Public site** — on the home page (`/`) and landing pages (`/[...slug]`) (`template_home`, `template_landing`).
- No platform surface.

## Data

- **`module_testimonial`** — `title`, `brandVariant`, `headingBlock`, `testimonials[]` (references to `block_testimonial`), `ctaButtons`, `displayMode` (Grid or Carousel), `contentAlignment` (Left, Center or Right), `cardAlignment` (Left or Center, initial Left), `layout` (`wideLayout`).
- **`block_testimonial`** — `title` (Studio label), `name` (required, one string for every language), `quote` (per-language rich text; required in the default language), `role` (per-language one line), `image` (`localizedImageWithAlt`; per-language alt), `link` (optional reference to a `link` document).
- **Service** — `getTestimonialModule` dereferences every quote and returns `TTestimonialModule`; each `TTestimonialItem` has `id` (the block's `_id`), `name`, `quote` (Portable Text), `role`, `image` and a resolved `link`. `cardAlignment` reads Left when unset.
- **Caching** — tagged `modules:testimonial`, `module:<id>`, `block_testimonial`, `link`, `homePage` and `page_landing`. Publishing any `block_testimonial` revalidates every testimonial module ([rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors (Studio) write the quotes and build the modules. No platform setting.
- Not plan-gated or capability-gated today ([plans-and-entitlements](./plans-and-entitlements.md)).
- Look reach: card style, radius, fonts and the band background restyle `QuoteCard` through tokens ([look](./look.md), [design-tokens-and-surfaces](./design-tokens-and-surfaces.md)). Voice has no reach.

## Constraints and invariants

- A module picks 1–8 quotes, each at most once (`unique()`).
- A module with a single quote always renders it as the spotlight: centred, larger avatar, `displayMode` and `cardAlignment` ignored.
- The grid's column count comes from `toTestimonialGridColumns` (2→2, 3→3, 4→2, 5→3, 6→3, 7→3, 8→2), not the shared module rule; a lone last card in a row is centred.
- The carousel aligns Left or Center only; a Right content alignment lays the carousel out from the left. It is the shared `LabelledCarousel`, named after the heading.
- The quote renders as rich text inside `QuoteCard`'s `<blockquote>`, in the italic read font. No typed quotation marks are added; the card shows a decorative brand-coloured quote-mark icon (`ICONS.QUOTE`, `text-brand-primary`) above every quote.
- Without an image the card shows an `Avatar` with the person's initials.
- A linked name uses the link's `ariaLabel` when set.
- A failed fetch logs and renders nothing.

## Dependencies

- Layers: `studio`, `service`, `ui` (`QuoteCard`, `Avatar`, `CardGrid`, `Carousel`), `web`.
- Features: [module-system](./module-system.md), [rich-text](./rich-text.md) (the quote), [links](./links.md), [languages](./languages.md), [studio-authoring](./studio-authoring.md) (Blocks section), [page-types](./page-types.md), [rendering-and-caching](./rendering-and-caching.md).
- No env vars of its own.

## Entry points

- `packages/studio/src/schema-types/modules/testimonial/testimonial.ts`
- `packages/studio/src/schema-types/documents/blocks/testimonial/testimonial.ts`
- `packages/studio/src/structure/sections/blocks-section.ts` (desk placement)
- `packages/service/src/features/modules/testimonial/adaptor/query.ts`, `loader.ts`, `transformer.ts`, `types.ts`
- `packages/ui/src/components/molecules/quote-card/quote-card.tsx`
- `apps/web/src/modules/testimonial/testimonial-module.tsx`, `testimonial-module-view.tsx`
- `apps/web/src/modules/testimonial/components/testimonial-card/testimonial-card.tsx`, `components/testimonial-carousel/testimonial-carousel.tsx`
- `apps/web/src/utils/to-testimonial-grid-columns/to-testimonial-grid-columns.ts`

## Tests and stories

- Service: `features/modules/testimonial/adaptor/{loader,query,transformer}.test.ts`.
- UI: `quote-card.test.tsx`, `quote-card.stories.tsx`.
- Web: `testimonial-module.test.tsx`, `testimonial-module-view.test.tsx`, `testimonial-card.test.tsx`, `testimonial-carousel.test.tsx`, `to-testimonial-grid-columns.test.ts`; fixtures in `apps/web/src/testing/modules/testimonial/fixtures.ts`; story `testimonial-module-view.stories.tsx`.

## Related

- #5028 — epic: text roles. #5036 gives quotes one shared style.
- #5047 — epic: plans and entitlements. Proposes Testimonials as a Growth module.
- #5016 — epic: one-entry skins. The card's and carousel's `tone` props go when band surfaces render their skin.
- #4987 — epic: accessible text and colour on the public site.
- #4456 — the content-alignment help text names the carousel on this module.
