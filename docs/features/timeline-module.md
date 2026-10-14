---
title: Timeline module
status: built
layers: [config, studio, service, ui, web]
code:
  - packages/config/src/constants/timeline.ts
  - packages/studio/src/schema-types/modules/timeline/**
  - packages/studio/src/schema-types/objects/timeline-item/**
  - packages/studio/src/schema-types/validation/validate-timeline-*/**
  - packages/service/src/features/modules/timeline/**
  - packages/ui/src/components/organisms/timeline/**
  - apps/web/src/modules/timeline/**
  - apps/web/src/testing/modules/timeline/**
epics: [4987, 5047, 5016]
---

# Timeline module

## What it does

An editor walks a reader through a process or a history: a step-by-step how-it-works, or a set of milestones. Items sit as points on one connected line, each with a marker (a step number or a short label such as a year), a heading and an optional sentence or two. The line runs down the page or across it, with optional actions underneath.

## Surfaces and routes

- **Studio** — `module_timeline` ("Timeline") under Modules → **Explainers**. The preview subtitle shows the background and the item count.
- **Public site** — on the home page (`/`) and landing pages (`/[...slug]`) (`template_home`, `template_landing`).
- No platform surface.

## Data

- **`module_timeline`** — `title`, `brandVariant`, `headingBlock`, `markerStyle` (`NUMBERED` or `LABELLED`, initial Numbered), `items[]` (`timelineItem`), `orientation` (`VERTICAL` or `HORIZONTAL`, initial Vertical), `ctaButtons`, `contentAlignment` (Left or Center), `itemAlignment` (Left or Center, initial Left), `layout` (spacing, container width, dividers).
- **`timelineItem`** (object) — `marker` (per-language one line; hidden when the module is Numbered), `heading` (per-language one line; required in the default language), `body` (per-language short rich text).
- `TIMELINE_MARKER_STYLE`, `TIMELINE_ORIENTATION` and `TIMELINE_HORIZONTAL_ITEM_CAP` (5) live in `@blog/config`, read by Studio validation, the `ui` organism and the web view.
- **Service** — `getTimelineModule` returns `TTimelineModule`. The transformer drops every item's `marker` when the module is Numbered, so a stale label never renders.
- **Caching** — tagged `modules:timeline`, `module:<id>`, `link`, `homePage` and `page_landing` ([rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors (Studio) author every field. No platform setting.
- Not plan-gated or capability-gated today ([plans-and-entitlements](./plans-and-entitlements.md)).
- Look reach: the marker pill takes the accent hue; fonts, divider and the band background apply through tokens ([look](./look.md), [design-tokens-and-surfaces](./design-tokens-and-surfaces.md)). Voice has no reach.

## Constraints and invariants

- A timeline holds 2–8 items. A Horizontal timeline holds at most five (`validateTimelineHorizontalItemCap` errors); the web view also renders any timeline with more than five items vertically, whatever its stored orientation.
- A Labelled timeline needs a marker on every item (`validateTimelineMarkerRequired`); markers stay under 16 characters, headings under 80. A body over 300 characters is a warning.
- Numbered markers are the item's 1-based position, computed in the web view; Labelled markers are the item's text. Numbered markers are `aria-hidden` (the `<ol>` already numbers the items); labelled ones are read. An item with no marker renders no pill.
- A Horizontal timeline gives each item an equal share of the width and falls back to a stacked column once a share is narrower than 9rem (container query), so it never overflows.
- Item alignment: on Horizontal the marker centres over its text; on Vertical the list centres as a block.
- The list is an `<ol role="list">`; each heading and body is passed into `Timeline` compound slots (`Timeline.Item`, `.Marker`, `.Heading`, `.Body`).
- A failed fetch logs `timeline_module.fetch_failed` and renders nothing.

## Dependencies

- Layers: `config` (constants), `studio` (schema, validation), `service`, `ui` (`Timeline` organism), `web`.
- Features: [module-system](./module-system.md), [rich-text](./rich-text.md) (item bodies), [languages](./languages.md), [links](./links.md) (actions), [page-types](./page-types.md), [rendering-and-caching](./rendering-and-caching.md).
- No env vars of its own.

## Entry points

- `packages/config/src/constants/timeline.ts`
- `packages/studio/src/schema-types/modules/timeline/timeline.ts`, `timeline-document.ts`
- `packages/studio/src/schema-types/objects/timeline-item/timeline-item.ts`
- `packages/studio/src/schema-types/validation/validate-timeline-horizontal-item-cap/`, `validate-timeline-marker-required/`
- `packages/service/src/features/modules/timeline/adaptor/query.ts`, `loader.ts`, `transformer.ts`, `types.ts`
- `packages/ui/src/components/organisms/timeline/timeline.tsx` and its `components/{item,marker,heading,body}/`
- `apps/web/src/modules/timeline/timeline-module.tsx`, `timeline-module-view.tsx`

## Tests and stories

- Studio: `validate-timeline-horizontal-item-cap.test.ts`, `validate-timeline-marker-required.test.ts`.
- Service: `features/modules/timeline/adaptor/{loader,query,transformer}.test.ts`.
- UI: `timeline.test.tsx`, `timeline.stories.tsx`.
- Web: `timeline-module.test.tsx`, `timeline-module-view.test.tsx`; fixtures in `apps/web/src/testing/modules/timeline/fixtures.ts`; story `timeline-module-view.stories.tsx`.

## Related

- #4987 — epic: accessible text and colour on the public site. #5013 lets a long labelled marker fit its pill.
- #5047 — epic: plans and entitlements. Proposes Timeline as a Growth module (a borderline call in the epic).
- #5016 — epic: one-entry skins (band backgrounds from one registry).
