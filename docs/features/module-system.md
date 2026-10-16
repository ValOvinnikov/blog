---
title: Module system
status: built
layers: [config, studio, service, web]
code:
  - apps/web/src/modules/module-renderer*.tsx
  - apps/web/src/testing/shared/module-renderer-contract/**
  - apps/web/src/components/shared/section/**
  - apps/web/src/components/shared/module-heading/**
  - apps/web/src/utils/to-module-grid-columns/**
  - packages/config/src/types/page-module*.ts
  - packages/config/src/constants/module*.ts
  - packages/config/src/constants/layout.ts
  - packages/config/src/constants/display-mode.ts
  - packages/studio/src/schema-types/modules/index.ts
  - packages/studio/src/schema-types/fields/modules-field/**
  - packages/studio/src/schema-types/fields/brand-variant-field/**
  - packages/studio/src/schema-types/fields/alignment-fields/**
  - packages/studio/src/schema-types/fields/spacing-and-divider-fields/**
  - packages/studio/src/schema-types/fields/container-width-field/**
  - packages/studio/src/schema-types/fields/display-mode-field/**
  - packages/studio/src/schema-types/fields/show-images-field/**
  - packages/studio/src/schema-types/objects/layout/**
  - packages/studio/src/schema-types/objects/wide-layout/**
  - packages/studio/src/schema-types/objects/module-heading-block/**
  - packages/studio/src/structure/module-kinds/**
  - packages/service/src/shared/transformers/module/**
  - packages/service/src/shared/fragments/module/**
  - packages/service/src/shared/fragments/layout/**
  - packages/service/src/shared/transformers/layout/**
  - packages/service/src/shared/expressions/module/**
  - packages/service/src/features/entities/modules/**
epics: [5016, 4987, 5028, 1919]
---

# Module system

## What it does

Editors build a page out of modules: reusable Sanity documents (a hero, a post list, a CTA, an FAQ, …) that a page template references in order. Each module document is authored once under the Studio's Modules section and can be placed on any page that accepts its kind. On the public site, each page type walks its template's `hero` and `modules[]`, and every module fetches and renders itself as one full-bleed band with a shared background, spacing, width and divider vocabulary.

## Surfaces and routes

- **Studio** — the **Modules** desk section groups every module type: a hardcoded Heroes group in `modules-section.ts`, then Explainers, Proof, Conversion and Posts from `moduleKinds`. A template's Modules field offers its allowed kinds in an insert menu grouped the same way. Templates (`template_home`, `template_landing`, `template_postIndex`, `template_topic`, `template_tag`, `template_topicIndex`, `template_tagIndex`) hold `hero` + `modules[]`; `page_post` holds `modules[]` directly and has no hero.
- **Public site** — every page type that renders modules: `/`, landing pages (`/[...slug]`), `/blog` (+ `/blog/page/[page]`), `/topics`, `/topics/[slug]`, `/tags`, `/tags/[slug]` (+ their `/page/[page]`) and `/blog/[slug]`.
- No platform surface.

## Data

- **Module documents** — 22 registered `module_*` types (`packages/studio/src/schema-types/modules/index.ts`), one document per placed instance. Modules and templates are not translated documents: copy fields hold per-language values inside the one document, and each language's page references a template (Studio warns when it differs from the default-language page's).
- **Shared fields** most modules carry: `title` (Studio-only label), `brandVariant` (Background: Plain `PRIMARY`, Shaded `SECONDARY`, Brand tint `BRAND_PRIMARY`; required), `headingBlock` (`moduleHeadingBlock`: per-language `heading` + `supportingText`), `contentAlignment` (Left/Center by default; a module may allow Right), and a layout object. Optional per kind: `displayMode` (`GRID` or `CAROUSEL`, read as Grid when unset) and `showImages` (read as on when unset).
- **Layout objects** — `layout` (spacing top/bottom, container width Narrow/Wide/Full, dividers), `wideLayout` (width limited to Wide/Full), `heroLayout` (no width; see [heroes](./heroes.md)) and `ctaLayout` (see [cta-module](./cta-module.md)). Spacing is `SPACING_SCALE` `NONE`…`XL`; unset means Medium. Width unset means Wide.
- **Page → modules** — page queries deref `template.hero` and `template.modules[]` to `{ _id, _type }` only (`moduleFragment`); `toModule` / `toHeroSlot` turn them into `TModule { id, type }`. The module's own content is fetched later by its component.
- **Caching** — each module loader tags its query `modules:<kind>` and `module:<id>` (prefixed `t:<projectId>:`), plus the tags of any document it reads; fallback revalidate 3600s. The revalidation webhook maps a published `_type` to tags through `REVALIDATE_TAGS`, appends `module:<id>` for a module, and adds `module:<id>` for every module that references the published document directly or through a `link` document (`getReferencingModuleIds`, never cached). Publishing a template purges its page type's tags.

## Configuration

- Editors (Studio) create module documents, set their fields, and order them in a template's Modules field. Every page accepts `module_cta` and `module_newsletter`; each template adds its own list in `modulesField({ extend })`. See [page-types](./page-types.md) for each template's list.
- `module_newsletter` is the only capability-gated module: Studio flags it when the Newsletter capability is off, and the web module renders nothing ([newsletter](./newsletter.md), [plans-and-entitlements](./plans-and-entitlements.md)). No module is plan-gated.
- Look reach: accent hue (the Brand tint band and every accent colour), card style, radius, fonts and density restyle every module through tokens ([look](./look.md), [design-tokens-and-surfaces](./design-tokens-and-surfaces.md)). Voice reaches only the empty states of the post list and taxonomy list ([voice](./voice.md)).

## Constraints and invariants

- A page references a module document at most once (`unique()`), which is what makes `module.id` a safe React key. A template's `once` list caps a kind at one per page (Post List on archive templates, Taxonomy List on index templates, Related Reading on posts).
- Each page type has its own module map (`*-module-renderer.tsx`), typed `Partial<Record<TPage…Type, TModuleComponent>>`. `TPage…Type` is derived from the generated template type's `hero` and `modules[]` reference unions, so a map entry for a kind the template no longer allows is a `type-check` error. Nothing in the types checks that a map covers every allowed kind: a missing entry renders nothing and logs `module_renderer.unknown_module_type`.
- `renderModules` renders an unknown `_type` as nothing and logs `module_renderer.unknown_module_type`. A module whose fetch fails logs and renders nothing (Post List and Taxonomy List call `notFound()` instead).
- Modules receive only `id` and an optional page `context`: `post.id` (post page), `landingPage { id, path }` (landing page), `page` (current archive page), and `archive { id, kind, slug, name }` (topic/tag page). A module needing context it lacks logs a warning and renders nothing.
- Every module renders inside `Section`: a full-bleed `<section aria-labelledby>` painted by `brandVariant`, padding (not margin) spacing so bands tile, and a centred inner container. Heading level is `h2` for modules; only a hero renders the `h1`.
- A linked card (`MediaCard`, `TaxonomyCard`, `LogoTile`) is one stretched `CardLink`: its `::before` covers the card, so a click anywhere on the card opens the link, and keyboard focus draws an inset `--ring` outline (Highlight in forced colours) around the whole card, never around the clamped title. Drawing it inset keeps a parent's `overflow-hidden`, such as a carousel viewport, from clipping it.
- `toModuleGridColumns` is the one rule for count-derived grid columns (2→2, 3→3, 4→4, 5→3, 6→3, 7→4, 8→4, 9→3, otherwise 4).
- `REVALIDATE_TAGS` must have an entry for every `TModuleType` (enforced by `satisfies`), and `pnpm check:revalidate-tags-sync` fails when a loader's `isr()` tag is missing from it.
- Studio module icons are wrapped by `textSizedIcon`; the desk's Heroes group is hardcoded in `modules-section.ts`, and every group after it comes from `moduleKinds`.

## Dependencies

- Layers: `config` (types, layout and module constants), `studio` (schemas, desk), `service` (one feature per module under `packages/service/src/features/modules/`), `ui` (`CardGrid`, `MediaCard`, `Hero`, …), `web` (renderers, `Section`, `ModuleHeading`).
- Features: [page-types](./page-types.md), [landing-tree](./landing-tree.md), [rendering-and-caching](./rendering-and-caching.md), [studio-authoring](./studio-authoring.md), [links](./links.md), [languages](./languages.md), [look](./look.md); each module kind has its own page — [heroes](./heroes.md), [post-modules](./post-modules.md), [taxonomy-list-module](./taxonomy-list-module.md), [section-pages-module](./section-pages-module.md), [cta-module](./cta-module.md), [faq-module](./faq-module.md), [feature-list-module](./feature-list-module.md), [feature-highlights-module](./feature-highlights-module.md), [content-module](./content-module.md), [logo-wall-module](./logo-wall-module.md), [stats-module](./stats-module.md), [testimonial-module](./testimonial-module.md), [team-module](./team-module.md), [timeline-module](./timeline-module.md), [pricing-module](./pricing-module.md), [newsletter](./newsletter.md).
- Env: `SANITY_LIVE_CONTENT=1` in development switches every module query to `no-store`.

## Entry points

- `apps/web/src/modules/module-renderer.tsx` — `renderModules`, `renderHeroModule`, `TModuleComponentProps`
- `apps/web/src/components/pages/home-page/home-module-renderer.tsx` (and the seven sibling `*-module-renderer.tsx`)
- `apps/web/src/components/shared/section/section.tsx`, `section-variants.ts`
- `apps/web/src/utils/revalidate-tags/revalidate-tags.ts`
- `apps/web/src/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags.ts`
- `packages/config/src/types/page-module.ts`, `packages/config/src/constants/module.ts`, `layout.ts`
- `packages/studio/src/schema-types/fields/modules-field/modules-field.ts`
- `packages/studio/src/structure/module-kinds/module-kinds.ts`, `structure/sections/modules-section.ts`
- `packages/service/src/shared/transformers/module/to-module.ts`
- `packages/service/src/index.ts` — `service.modules.*`

## Tests and stories

- Web: `module-renderer.test.tsx`, every `*-module-renderer.test.tsx` (sharing `testing/shared/module-renderer-contract`), `section.test.tsx`, `module-heading.test.tsx`, `to-module-grid-columns.test.ts`, `revalidate-tags.test.ts`, `resolve-referencing-module-tags.test.ts`.
- Studio: `module-kinds.test.ts`. Service: `to-module.test.ts`, `to-layout.test.ts`, `features/entities/modules/**/*.test.ts`. Config: `page-module.test.ts`, `module.test.ts`.
- Stories: `section.stories.tsx`, `module-heading.stories.tsx`, and a `*-module-view.stories.tsx` beside every web module.

## Related

- #5016 — epic: one-entry skins. Band backgrounds move to one registry; `Section` renders `data-skin` and the Studio Background options come from the registry.
- #4987 — epic: accessible text and colour on the public site. #4997 renders every module in each brand variant in CI; #5014 gives every module story each brand variant.
- #5028 — epic: text roles. #5038 makes `ModuleHeading` default to its section look.
- #1919 — epic: module and page-type portfolio. #2803 adds module presets via initial-value templates.
