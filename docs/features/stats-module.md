---
title: Stats module
status: built
layers: [studio, service, web]
code:
  - packages/studio/src/schema-types/modules/stats/**
  - packages/studio/src/schema-types/objects/stat/**
  - packages/service/src/features/modules/stats/**
  - apps/web/src/modules/stats/**
  - apps/web/src/testing/modules/stats/**
epics: [5028, 5047, 4987]
---

# Stats module

## What it does

An editor backs up a claim with a band of figures — signups, uptime, ratings. Each figure has a short value, a label saying what it counts and an optional line of context. A one-line footnote (period, source, caveat) and actions can follow the figures.

## Surfaces and routes

- **Studio** — `module_stats` ("Stats") under Modules → **Proof**. The preview subtitle shows the background and the figure count.
- **Public site** — on the home page (`/`) and landing pages (`/[...slug]`) (`template_home`, `template_landing`).
- No platform surface.

## Data

- **`module_stats`** — `title` (Studio label), `brandVariant`, `headingBlock`, `stats[]` (`stat`), `footnote` (per language), `ctaButtons`, `contentAlignment`, `layout` (`wideLayout`: spacing, Wide or Full width, dividers).
- **`stat`** (object) — `value`, `label` and `description`, each a per-language one-line string. `value` and `label` must be filled in the default language.
- **Service** — `getStatsModule` returns `TStatsModule`; each `TStatItem` has `id` (the `_key`), `value`, `label` and an optional `description`. Every text field resolves to the request's language, falling back to the default language.
- **Caching** — tagged `modules:stats`, `module:<id>`, `link`, `homePage` and `page_landing` ([rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors (Studio) author every field. No platform setting.
- Not plan-gated or capability-gated today ([plans-and-entitlements](./plans-and-entitlements.md)).
- Look reach: the accent hue colours every value (`text-brand-primary`); fonts and the band background apply through tokens ([look](./look.md)). Voice has no reach.

## Constraints and invariants

- A band holds 2–6 figures (errors outside that range).
- Soft limits are warnings, not errors: value ≤ 8 characters, label ≤ 48, footnote ≤ 160.
- Content alignment allows Left and Center (the field's default list); it aligns the heading, every figure, the footnote and the actions.
- The figures render as one `<dl>`: each item is a `<dt>` label followed by a `<dd>` value and an optional `<dd>` description. CSS `order` shows the value first, so screen readers hear the label before the number.
- The list is a wrapping flex row (`@container`) whose value size steps up with the container (`text-2xl` → `text-4xl`); values never wrap and use tabular figures.
- The module has no `@blog/ui` organism of its own; the view composes `Text`, `Section`, `ModuleHeading` and `ActionGroup` directly.
- A failed fetch logs `stats_module.fetch_failed` and renders nothing.

## Dependencies

- Layers: `studio`, `service`, `web` (with `@blog/ui` atoms).
- Features: [module-system](./module-system.md), [languages](./languages.md) (per-language fields), [links](./links.md) (actions), [page-types](./page-types.md), [rendering-and-caching](./rendering-and-caching.md).
- No env vars of its own.

## Entry points

- `packages/studio/src/schema-types/modules/stats/stats.ts`
- `packages/studio/src/schema-types/objects/stat/stat.ts`
- `packages/service/src/features/modules/stats/adaptor/query.ts`, `loader.ts`, `transformer.ts`, `types.ts`
- `apps/web/src/modules/stats/stats-module.tsx`, `stats-module-view.tsx`, `stats-module-view-variants.ts`

## Tests and stories

- Service: `features/modules/stats/adaptor/{loader,query,transformer}.test.ts`.
- Web: `stats-module.test.tsx`, `stats-module-view.test.tsx`; fixtures in `apps/web/src/testing/modules/stats/fixtures.ts`; story `stats-module-view.stories.tsx`.

## Related

- #5028 — epic: text roles. #5039 moves the stats label, value, description and footnote onto shared text roles and a named `figures` container.
- #5047 — epic: plans and entitlements. Proposes Stats as a Growth module.
- #4987 — epic: accessible text and colour on the public site.
