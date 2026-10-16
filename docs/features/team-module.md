---
title: Team module
status: built
layers: [studio, service, web]
code:
  - packages/studio/src/schema-types/modules/team/**
  - packages/service/src/features/modules/team/**
  - apps/web/src/modules/team/**
  - apps/web/src/utils/to-team-grid-columns/**
  - apps/web/src/testing/modules/team/**
epics: [4987, 5028, 5047, 5016]
---

# Team module

## What it does

An editor introduces a founder, a team, staff or contributors by picking existing Person documents. One person renders as a spotlight (large photo beside name, role, bio and social links); two or more render as a card grid or a carousel. Each person's photo, name, role, bio, social links and profile link come from their Person document, so a change there shows in every Team module at once.

## Surfaces and routes

- **Studio** — `module_team` ("Team") under Modules → **Proof**. The members are `person` documents, edited under **People** ([people](./people.md)).
- **Public site** — on the home page (`/`) and landing pages (`/[...slug]`) (`template_home`, `template_landing`).
- No platform surface. Platform "Team" (tenant memberships) is unrelated ([tenant-access](./tenant-access.md)).

## Data

- **`module_team`** — `title`, `brandVariant`, `headingBlock`, `members[]` (references to `person`), `showBios` (initial off), `showSocialLinks` (initial on), `imageShape` (Circle or Square, initial Circle), `displayMode` (Grid or Carousel), `ctaButtons`, `contentAlignment` (Left or Center), `cardAlignment` (Left or Center, initial Center), `layout` (`wideLayout`).
- **From `person`** — `name`, `image` (per-language alt), `role` and `bio` (per language), `socialLinks[]`, and `profilePage` (a `link` document that becomes the profile URL).
- **Service** — `getTeamModule` dereferences every member through `personDetailFragment` and returns `TTeamModule`. The transformer drops each `bio` when `showBios` is off and empties `socialLinks` when `showSocialLinks` is off, so the view never receives hidden data. `showBios` and `showSocialLinks` read their initial values when unset.
- **Caching** — tagged `modules:team`, `module:<id>`, `link`, `homePage` and `page_landing`. Publishing a `person` revalidates `modules:team` through `REVALIDATE_TAGS` ([rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors (Studio) build the module and maintain the Person documents. No platform setting.
- Not plan-gated or capability-gated today ([plans-and-entitlements](./plans-and-entitlements.md)).
- Look reach: card style, radius, fonts and the band background restyle `MediaCard` and the spotlight through tokens ([look](./look.md), [design-tokens-and-surfaces](./design-tokens-and-surfaces.md)). Voice has no reach.

## Constraints and invariants

- A team holds 1–12 people, each at most once.
- A module with a single person always renders them as the spotlight; `displayMode` and `cardAlignment` do not apply to it.
- Grid columns follow the shared `toModuleGridColumns` rule, capped at three when bios are shown (`toTeamGridColumns`); a lone last card in a row of three is centred. The grid is one column below a 480px viewport, two from 480px and three from about 768px (container queries on the grid, sized for a page without a sidebar).
- A left-aligned card at least 30rem wide puts the photo beside the name, role, bio and social links (a container query on the card); narrower cards and centre-aligned cards stack.
- A card or spotlight without a photo shows an `Avatar` with the person's initials in the chosen shape.
- A member with a profile page makes the card interactive and links their name; otherwise the name is plain text.
- Square photos are requested at 384px (twice the `w-48` cap); circles use the shared circle size; the spotlight image is requested at 576px.
- The carousel is the shared `LabelledCarousel`, named after the heading. It shows two cards per view under 640px and three from 640px up (`Carousel`'s `halvesThenThirds` slide size).
- A failed fetch logs `team_module.fetch_failed` and renders nothing.

## Dependencies

- Layers: `studio`, `service`, `web` (with `@blog/ui` `MediaCard`, `MediaFrame`, `Avatar`, `CardGrid`, `Carousel`).
- Features: [people](./people.md) (the members' content), [module-system](./module-system.md), [links](./links.md) (profile pages, actions), [rich-text](./rich-text.md) (bios), [languages](./languages.md), [page-types](./page-types.md), [rendering-and-caching](./rendering-and-caching.md).
- No env vars of its own.

## Entry points

- `packages/studio/src/schema-types/modules/team/team.ts`
- `packages/service/src/features/modules/team/adaptor/query.ts`, `loader.ts`, `transformer.ts`, `types.ts`
- `packages/service/src/shared/fragments/person/person.ts` (`personDetailFragment`, shared with the profile hero and post fragments)
- `apps/web/src/modules/team/team-module.tsx`, `team-module-view.tsx`
- `apps/web/src/modules/team/components/team-member-card/team-member-card.tsx`, `components/team-spotlight/team-spotlight.tsx`, `components/team-carousel/team-carousel.tsx`
- `apps/web/src/utils/to-team-grid-columns/to-team-grid-columns.ts`

## Tests and stories

- Service: `features/modules/team/adaptor/transformer.test.ts` (no loader or query test).
- Web: `team-module.test.tsx`, `team-module-view.test.tsx`, `team-member-card.test.tsx`, `team-spotlight.test.tsx`, `team-carousel.test.tsx`, `to-team-grid-columns.test.ts`; fixtures in `apps/web/src/testing/modules/team/fixtures.ts`; story `team-module-view.stories.tsx`.

## Related

- #4987 — epic: accessible text and colour on the public site. #5013 scales square-shape initials with their tile.
- #5028 — epic: text roles. #5039 moves the card role, bio and spotlight name and role onto shared text roles.
- #5047 — epic: plans and entitlements. Proposes Team as a Growth module.
- #5016 — epic: one-entry skins. The carousel's `tone` prop goes when band surfaces render their skin.
