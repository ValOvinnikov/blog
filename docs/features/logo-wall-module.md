---
title: Logo wall module
status: built
layers: [studio, service, ui, web]
code:
  - packages/studio/src/schema-types/modules/logo-wall/**
  - packages/studio/src/schema-types/objects/logo-item/**
  - packages/service/src/features/modules/logo-wall/**
  - packages/ui/src/components/molecules/logo-tile/**
  - apps/web/src/modules/logo-wall/**
  - apps/web/src/testing/modules/logo-wall/**
epics: [5047, 5016, 4987]
---

# Logo wall module

## What it does

An editor shows a row of partner or client logos as social proof. Each logo sits in a same-size tile, can link to the company's site or a case study, and can carry a second asset for dark mode. The wall renders as a wrapping row of tiles or as a carousel, with optional actions underneath.

## Surfaces and routes

- **Studio** — `module_logoWall` ("Logo Wall") under Modules → **Proof**, beside Testimonials, Team and Stats. The preview subtitle shows the background and the logo count.
- **Public site** — on the home page (`/`) and landing pages (`/[...slug]`), the only templates that allow it (`template_home`, `template_landing`).
- No platform surface.

## Data

- **`module_logoWall`** — `title` (Studio label), `brandVariant`, `headingBlock`, `logos[]` (`logoItem`), `ctaButtons`, `displayMode` (Grid or Carousel), `contentAlignment` (Left or Center), `layout` (spacing, container width, dividers).
- **`logoItem`** (object) — `name` (required; the image's alt text, never shown), `image` (required asset), `imageDark` (optional asset for dark mode), `link` (optional reference to a `link` document).
- Logos are not translated: names and images are the same in every language. The heading block is per language.
- **Service** — `getLogoWallModule` returns `TLogoWallModule`; each `TLogoItem` carries `id` (the array `_key`), `name`, `image`, `imageDark` and a resolved `link`. Both images take the company name as alt.
- **Caching** — the query is tagged `modules:logoWall`, `module:<id>`, `link`, `homePage` and `page_landing`. Publishing the module, a referenced `link`, or a page that places it revalidates it ([rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors (Studio) author every field. There is no platform setting.
- Not plan-gated or capability-gated today ([plans-and-entitlements](./plans-and-entitlements.md)).
- Look reach: radius and the band background restyle the tiles and the carousel through tokens ([look](./look.md), [design-tokens-and-surfaces](./design-tokens-and-surfaces.md)). Voice has no reach.

## Constraints and invariants

- A wall holds 1–12 logos (Studio errors outside that range).
- Content alignment allows Left and Center only; it aligns the heading, the tile row, the carousel and the actions.
- Each tile is a `LogoTile` built from its `Logo`, `DarkLogo` and `Link` parts: a fixed 192×88px frame. Each logo part is sized by the asset's aspect ratio (`--logo-aspect`): 2.25rem (36px) tall, its width capped at the frame; without usable dimensions the image falls back to `max-h-9 w-auto max-w-full`. Images are requested at 360×72 in `contain` mode and lazy-loaded.
- With `imageDark` set, the tile renders both logos and shows one per colour mode; without it the one logo shows in both.
- A linked tile is interactive: one `LogoTile.Link` overlays the whole tile, named by the link's `ariaLabel` or else the company name, and the logo images inside it are decorative (`alt=""`). An unlinked tile's images keep their alt text.
- The carousel is the shared `LabelledCarousel`, named "<heading> carousel", with content-sized slides.
- A failed fetch logs `logo_wall_module.fetch_failed` and renders nothing.

## Dependencies

- Layers: `studio` (schema), `service` (query, transformer), `ui` (`LogoTile`, `Carousel`), `web` (module, view, tile, carousel).
- Features: [module-system](./module-system.md) (shared fields, `Section`, renderer maps), [links](./links.md) (tile links), [page-types](./page-types.md), [rendering-and-caching](./rendering-and-caching.md).
- No env vars of its own.

## Entry points

- `packages/studio/src/schema-types/modules/logo-wall/logo-wall.ts`
- `packages/studio/src/schema-types/objects/logo-item/logo-item.ts`
- `packages/service/src/features/modules/logo-wall/adaptor/query.ts`, `loader.ts`, `transformer.ts`, `types.ts`
- `packages/ui/src/components/molecules/logo-tile/logo-tile.tsx`
- `apps/web/src/modules/logo-wall/logo-wall-module.tsx`, `logo-wall-module-view.tsx`
- `apps/web/src/modules/logo-wall/components/logo-wall-tile/logo-wall-tile.tsx`, `components/logo-wall-carousel/logo-wall-carousel.tsx`

## Tests and stories

- Service: `features/modules/logo-wall/adaptor/{loader,query,transformer}.test.ts`.
- UI: `logo-tile.test.tsx`, `logo-tile.stories.tsx`.
- Web: `logo-wall-module.test.tsx`, `logo-wall-module-view.test.tsx`, `logo-wall-tile.test.tsx`, `logo-wall-carousel.test.tsx`; fixtures in `apps/web/src/testing/modules/logo-wall/fixtures.ts`; story `logo-wall-module-view.stories.tsx`.

## Related

- #5047 — epic: plans and entitlements. Proposes the logo wall as a Growth module that stops rendering on a Free site (#5051 is its manual test).
- #5016 — epic: one-entry skins. The carousel's `tone` prop goes when band surfaces render their skin.
- #4987 — epic: accessible text and colour on the public site, including every module story in each brand variant.
