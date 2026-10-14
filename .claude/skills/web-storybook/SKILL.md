---
name: web-storybook
description: >-
  Use when adding or editing a story in apps/web — a module or page view, an
  async page, a client component — or changing apps/web's Storybook config.
  Covers what to story, aliasing server-only modules, fixtures and titles.
  Pure @blog/ui stories follow ui-storybook.
---

# Storybook in `apps/web`

Storybook 10 on `@storybook/nextjs-vite`, port **6007** — not
`@storybook/nextjs`, whose webpack preset needs `next/config`, which Next 16
removed.

```
pnpm --filter web storybook        # dev server
pnpm --filter web storybook:build  # static build
```

- `Meta`/`StoryObj`/`Preview` come from `@storybook/nextjs-vite`, never
  `@storybook/react`.
- Viewport, controls, interactions and actions are core. `@storybook/addon-docs`
  is the one explicit addon in `.storybook/main.ts`; `tags: ['autodocs']`
  needs it.
- `features.experimentalRSC: true` renders `async` Server Components; the
  framework stubs `next/image`, `next/link` and `next/navigation`.
- `.storybook/preview.tsx` already gives every story what the real layout
  does: the `AppProviders` decorator (`@web/testing/providers` — next-intl and
  the `SanityImage` base URL, shared with `customRender`), `apps/web/index.css`
  (the theme plus the `@source` for `packages/ui`), the CONSOLE preset's font
  classes, and `layout: 'fullscreen'`. A story adds none of these; set
  `parameters.layout: 'padded'` for a small component.

Story format, `meta.args`, controls and `render` follow `ui-storybook` — the
rules are the same here. This skill covers only what differs in `apps/web`.

## What to story

`apps/web` stories are compositions that wire `@blog/ui` to real page
structure. A pure design-system component is storied in `packages/ui`.

| Kind                    | Story                                                            | Example                       |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------- |
| Module                  | the pure `<x>-module-view.tsx`, never the async `<x>-module.tsx` | `CtaModuleView`               |
| Page with a view        | the pure `<x>-page-view.tsx`                                     | `AccountPageView`             |
| Async page with no view | the page itself, its server modules aliased (B below)            | `TopicIndexPage`              |
| Client component        | the component                                                    | `SiteNavigation`, `PostShare` |

Routes under `src/app/` are never storied — story the view the route renders.

## Where stories live, and `title`

Co-locate `<file>.stories.tsx` beside the component. `.storybook/main.ts`
globs only `src/components/**` and `src/modules/**`.

`title` takes its prefix from the top-level folder; a nested component takes
the same prefix (`shared/portable-text/components/code-block/` →
`Components/CodeBlock`).

| Folder                                  | `title`                                                          |
| --------------------------------------- | ---------------------------------------------------------------- |
| `src/modules/<x>/`                      | `Modules/<X>Module`                                              |
| `src/components/pages/<x>/`             | `Pages/<Name>` (`Pages/Landing/LandingPageLayout`)               |
| `src/components/features/<domain>/<x>/` | `Features/<Domain>/<Name>` (`Features/Post/PostTableOfContents`) |
| `src/components/page-templates/<x>/`    | `Page Templates/<Name>`                                          |
| `src/components/shared/<x>/`            | `Components/<Name>`                                              |

## Story shape

```tsx
import { ASIDE_KIND } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DeepAside } from './deep-aside';

const meta = {
  title: 'Components/DeepAside',
  component: DeepAside,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    kind: { control: 'select', options: Object.values(ASIDE_KIND) },
  },
  args: {
    kind: ASIDE_KIND.DIGRESSION,
    label: 'Digression',
    children: <p>…</p>,
  },
} satisfies Meta<typeof DeepAside>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Digression: TStory = {};
export const WhyNot: TStory = {
  args: { kind: ASIDE_KIND.WHY_NOT, label: 'Why not X' },
};
```

Every dictionary-const, alias-union or `tv()`-backed prop gets an explicit
`select` (an inline union infers its own) → `ui-storybook` § Controls. Web
case: `NewsletterForm.align` is typed `TContentAlignment`, but
`newsletter-form.tsx` never imports `CONTENT_ALIGNMENT`. A
`Record<TEnum, string>` label-map prop is keyed by the enum, not valued by
it — it needs no control.

## Components that fetch

Storybook has no Sanity connection, no request context, and cannot evaluate a
`server-only` module in its browser bundle.

### A — Story the view (default)

The async component does the server-only work — request context,
`@blog/service`, `auth()`, translations — and renders a pure view with the
result: `src/modules/cta/cta-module.tsx` → `cta-module-view.tsx`,
`src/components/pages/account-page/account-page.tsx` → `account-page-view.tsx`.
Story the view, with args built from `@web/testing` builders. The view's prop
shape → `react-component-practices` § Props.

### B — Alias the server module

When the storied component is itself async (`TopicIndexPage`), or pulls in a
server-only or side-effecting module transitively (`newsletter-actions`, a
`'use server'` module that pulls in `@blog/db`; `@web/server/auth/auth` via
the account-page sections; `@web/utils/report-client-error`, which fires a
network request), alias that exact import specifier in `.storybook/main.ts`
to a stand-in under `.storybook/mocks/`:

```ts
// main.ts is ESM — resolve paths from import.meta.url, not __dirname
viteFinal: async (config) => {
  config.resolve ??= {};
  config.resolve.alias = {
    ...config.resolve.alias,
    '@web/server/request-context/request-context': fileURLToPath(
      new URL('./mocks/request-context.ts', import.meta.url),
    ),
  };
  return config;
},
```

- Key the alias by the full specifier the component imports — an alias
  applies to every story.
- A relative specifier can't be keyed safely, since `resolve.alias` matches
  the string alone: stub it with an importer-scoped `resolveId` plugin, as
  `main.ts` does for `./encrypt-secret`.
- The stand-in exports the same names and returns data from `@web/testing`
  builders (`.storybook/mocks/get-topic-index-page.ts`).
- Prefer A for a new component; B is for an async component with no view, or
  a server-only/side-effecting module pulled in transitively.

## Navigation

A component that reads the active route gets
`parameters.nextjs.navigation.pathname` (`preview.tsx` sets
`nextjs.appDirectory: true` for every story):

```tsx
export const OnBlog: TStory = {
  parameters: { nextjs: { navigation: { pathname: '/blog' } } },
};
```

## Fixtures

Story data comes from the `make*` builders in `apps/web/src/testing/`
(`@web/testing/{shared,modules,pages}/<name>/fixtures`) — the same builders
the tests use; location and the second-consumer rule → `testing-practices` §
Where tests live. Data only one story file uses stays inline in that file.

## Viewports

`.storybook/preview.tsx` declares `mobile` (390px), `tablet` (820px) and
`desktop` (1280px). Per-story viewport rules → `ui-storybook` § Viewports
(web precedent: `SiteNavigation`'s mobile stories).

## Checklist

- [ ] The view is storied, not the loader; no live Sanity call and no
      unaliased server-only import.
- [ ] `title` carries its folder's prefix; `tags: ['autodocs']` on `meta`.
- [ ] Required and shared props in `meta.args`; controls per `ui-storybook`
      § Controls.
- [ ] Data from `@web/testing` builders, or inline when only this story file
      uses it.
- [ ] `nextjs.navigation.pathname` set if the component reads the active
      route.
- [ ] `pnpm --filter web type-check` passes — `apps/web/tsconfig.json`
      includes `.storybook/**` and every `src/**/*.tsx`, stories too, so no
      `storybook:build` is needed — and the story renders in
      `pnpm --filter web storybook`, which catches the Vite runtime failures
      type-check can't.
