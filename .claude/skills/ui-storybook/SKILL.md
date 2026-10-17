---
name: ui-storybook
description: >-
  How to write, run, and maintain Storybook stories in @blog/ui (packages/ui).
  Use when adding stories for atoms, molecules, or organisms, or when
  configuring the Storybook instance in packages/ui. Complements
  ui-library-practices and testing-practices.
---

# Storybook in `@blog/ui`

Storybook 10 on `@storybook/react-vite`, port **6006**.

```
pnpm --filter @blog/ui storybook        # dev server
pnpm --filter @blog/ui storybook:build  # static build
```

- Controls, actions, interactions and viewport are core — no addon. The two
  `addons` in `.storybook/main.ts` are `@storybook/addon-docs` (required for
  `tags: ['autodocs']`) and `@storybook/addon-themes` (the light/dark toggle).
- Import `Meta`, `StoryObj`, `Preview` and `ReactRenderer` from
  `@storybook/react-vite`, never `@storybook/react`.
- `.storybook/main.ts` loads as ESM: resolve paths with `import.meta.url`,
  never `__dirname` or `require`.

## Where stories live

Co-locate `{name}.stories.tsx` beside the component
(`src/components/atoms/button/button.stories.tsx`). `.storybook/main.ts` globs
`../src/**/*.stories.@(ts|tsx)` and `../src/**/*.mdx`, so nothing is
registered by hand.

## Story format (CSF 3)

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Publish' },
} satisfies Meta<typeof Button>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Primary: TStory = { args: { variant: 'primary' } };
export const Ghost: TStory = { args: { variant: 'ghost' } };
```

A component story's `title` is `'<Tier>/<ComponentName>'` — `Atoms`,
`Molecules` or `Organisms` — with `tags: ['autodocs']`. `@blog/ui` has no
Templates tier; page compositions are storied in `apps/web` (`web-storybook`).
The one non-component story, `src/lib/design-tokens/design-tokens.stories.tsx`,
is deliberately a top-level `'Design Tokens'` title with no tier and no
autodocs — don't "fix" it.

## Args

- **Every required prop goes in `meta.args`**, as does any optional prop
  several stories share (`className`, `size`). A story's `args` carry only
  what differs.
- Write `satisfies Meta<typeof X>` and `StoryObj<typeof meta>` — never an
  annotated `const meta: Meta<…>` or `StoryObj<typeof X>` — so type-check
  requires each story to supply any required prop `meta.args` leaves out.
- Args are static — no live data, no async functions.

```tsx
// ✅ shared props in meta; each story overrides only the difference
const meta = {
  component: Avatar,
  args: { name: 'Jane Doe', alt: 'Jane Doe', size: SIZE.MD },
} satisfies Meta<typeof Avatar>;
export const WithImage: TStory = { args: { src: '…' } };
export const Small: TStory = { args: { size: SIZE.SM } };
// ❌ name/alt repeated in every story's args
```

## Controls — an explicit `select` wherever inference can't supply one

Storybook infers a control from the prop's TypeScript type, not from the
values the component accepts at runtime, so an inferred control drifts or
degrades to a free-text box. Pick `options` by what backs the prop:

| Prop backed by                | `options`                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| a `tv()` variant group        | `objectKeys(xVariants.variants.<group>)`                    |
| an UPPERCASE dictionary const | `Object.values(THE_CONST)`, narrowed to the accepted subset |
| a union behind a named alias  | the plural array const the type derives from                |
| an inline literal union       | nothing — inference works                                   |

### `tv()` variant props

`tv()` exposes its config on `.variants` at runtime, so `objectKeys` (from
`@blog/utils/primitives`) yields the real, current option list:

```tsx
import { objectKeys } from '@blog/utils/primitives';

import { buttonVariants } from './button-variants';

argTypes: {
  variant: { control: 'select', options: objectKeys(buttonVariants.variants.variant) },
  size: { control: 'select', options: objectKeys(buttonVariants.variants.size) },
},
```

### Dictionary-const props

For a prop typed from an UPPERCASE key/value const (`ASIDE_KIND`,
`BRAND_VARIANT`, …), use `Object.values` — a const's _values_ are the
vocabulary the prop accepts, where a `tv()` map's _keys_ are:

```tsx
argTypes: {
  kind: { control: 'select', options: Object.values(ASIDE_KIND) },
},
```

- **Narrow to the subset the prop accepts.** A prop typed
  `TBrandVariantOf<'PRIMARY' | 'SECONDARY'>` lists
  `[BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY]`; a blanket
  `Object.values()` offers a value the type rejects.
- **A prop that is both dictionary-typed and fed into `tv()` takes the `tv()`
  source.** The variant map is what renders, so it keeps the control honest
  if the two diverge. The test is "does this prop drive `tv()`", not "is it
  dictionary-typed". `Icon` has one of each:

  ```tsx
  argTypes: {
    name: { control: 'select', options: Object.values(ICONS) },
    size: { control: 'select', options: objectKeys(iconVariants.variants.size) },
  },
  ```

- **Audit from the component's prop types, not the story's imports.** A story
  often doesn't import the const its prop is typed against. Follow each prop's
  type back to its definition, looking for `TValueOf<typeof SOME_CONST>`.

### Literal-union props

Both Storybooks run the default `react-docgen` (neither `.storybook/main.ts`
sets `typescript.reactDocgen`). It expands an **inline** union
(`type?: 'button' | 'submit' | 'reset'`) into options, so inference works and
no `argTypes` entry is needed. A **named alias** (`status: TFormStatus`) comes
through as the alias name with no values, so it always needs an explicit
control.

Give such a union a plural runtime array and derive the type from it, so the
type and the control read one source and cannot drift:

```ts
export const HEADING_LEVELS = [1, 2, 3, 4] as const;
export type THeadingLevel = (typeof HEADING_LEVELS)[number];
```

```tsx
argTypes: {
  level: { control: 'select', options: HEADING_LEVELS },
},
```

Name these consts in the plural (`HEADING_LEVELS`): they are lists passed
straight to `options`, unlike the singular dictionary consts reached through
`Object.values` (`options: Object.values(FORM_STATUS)`). Where no such const exists, a literal array
is the fallback — matching the declared type exactly (`THeadingLevel` takes
numbers, not `['1', '2', …]`). Never derive it with `objectKeys(headingTags)`:
that record is keyed by numbers, `objectKeys` types the result as
`Array<1 | 2 | 3 | 4>`, and the control receives strings at runtime —
type-check passes and the select sets the wrong value.

## `render` — only when args can't express the story

Pass JSX children as `children` in `args` — compound-slot children too
(`MediaCard.Media`, `Hero.Cta`, `Footer.Nav`) — and override per story. A
`render` that only passes children is wrong. Define JSX helpers **before**
`meta`: `const` isn't hoisted and the JSX evaluates at module init.

```tsx
const FillImage = () => (
  <img
    src="…"
    alt="…"
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    }}
  />
);

const meta = {
  component: ImageWithCaption,
  tags: ['autodocs'],
  args: {
    caption: 'A scenic mountain view',
    className: 'aspect-video w-[480px]',
    children: <FillImage />,
  },
} satisfies Meta<typeof ImageWithCaption>;

export const WithCaption: TStory = {};
export const WithoutCaption: TStory = { args: { caption: undefined } };
```

Use `render` for:

- a stateful wrapper — a controlled input, or a controlled/headless component;
- a required DOM context (`<form>`, `<table>`);
- several instances side by side;
- a per-story provider that doesn't belong in a global decorator.

**A controlled component with a positioned surface needs an interactive
story.** When its visible state is prop-driven (`open`, `isCopied`) and the
surface is absolutely positioned (popover, dropdown, menu),
`args: { open: true }` renders it clipped, empty or overlapping. Write a
`render` with a stateful wrapper that toggles it through the real trigger,
plus a decorator that gives the surface room (padding, `min-height`). A story
whose open state can't be seen and exercised is broken.

## Theme and tokens

`.storybook/preview.ts` imports `packages/ui/index.css` (the shared
`@blog/tailwind-config/theme.css`), so the same token utilities components use
(`bg-surface`, `text-text`, …) work in stories with no setup. Dark mode is
class-based: `@storybook/addon-themes`' `withThemeByClassName` toggles `.dark`
on the preview `<html>` as `apps/web` does, and `.storybook/preview.css`
re-asserts the themed canvas background so the whole canvas follows the
toolbar toggle. No story needs its own theme setup.

## Viewports

`preview.ts` is meant to give every story's toolbar `phone`, `tablet` and
`desktop` presets (the Tailwind `sm`/`md` breakpoints). Never define a custom
viewport or a per-story `parameters.viewport`, and never export one story per
breakpoint.

**Known config bug — those presets are not live.** `preview.ts` declares them
under `parameters.viewport.viewports`, but Storybook 10 reads
`parameters.viewport.options`, so the toolbar falls back to its built-ins
(`mobile1`, `mobile2`, `tablet`, `desktop`) and a `phone` pin currently
selects nothing (`apps/web/.storybook/preview.tsx` has the same bug). Until
the key is renamed, check a pinned story's narrow state by picking `mobile1`
or `mobile2` from the toolbar.

**One exception: a component whose rendering forks on a real media-query
breakpoint (`sm:`/`md:`/`lg:`, not a container query).** A story for the
narrow state renders identically to `Default` on the wide canvas, so pin
`globals: { viewport: 'phone' }` on it and add a one-line comment saying why.
Precedent: `PrimaryNavigation`'s `Mobile*` stories
(`packages/ui/src/components/molecules/primary-navigation/primary-navigation.stories.tsx`),
whose `mobileToggle` collapses the nav behind `lg:`.

## MDX docs

A complex component may get a `{name}.mdx` beside its stories:

```mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as ButtonStories from './button.stories';

<Meta of={ButtonStories} />

# Button

Usage notes here.

<Canvas of={ButtonStories.Primary} />
<Controls of={ButtonStories.Primary} />
```

## Purity, tests and fixtures

- Stories obey the component's layer contract — no `@blog/service`, Sanity
  SDK, `next` or `fetch`. `configs/eslint/ui.js` fails a story the same as a
  component.
- Storybook is for visual development and docs, not a test runner — behaviour
  tests are Vitest (`testing-practices`).
- Sample data a story and a test both need is a `make*` builder in
  `packages/ui/src/testing/` → `testing-practices` § Where tests live.

## Checklist

- [ ] A component story's `title` is `'<Tier>/<ComponentName>'` with
      `tags: ['autodocs']` on `meta` (`Design Tokens` excepted).
- [ ] `meta` uses `satisfies Meta<typeof X>`; stories are `StoryObj<typeof meta>`.
- [ ] Required and shared props in `meta.args`; stories carry only the
      difference.
- [ ] Every `tv()`, dictionary-const or alias-union prop has an explicit
      `select` sourced per the Controls table, narrowed to what the type
      accepts — audited from the component's prop types, not the story's
      imports.
- [ ] No `@blog/service`/Sanity/`next` imports and no live data.
- [ ] `pnpm --filter @blog/ui type-check` passes — `packages/ui/tsconfig.json`
      includes `src` and `.storybook`, so no `storybook:build` is needed — and
      the story renders in the dev server, which catches the Vite runtime
      issues type-check can't.
