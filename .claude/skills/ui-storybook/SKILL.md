---
name: ui-storybook
description: >-
  How to write, run, and maintain Storybook stories in @blog/ui (packages/ui).
  Use when adding stories for atoms, molecules, or organisms, or when
  configuring the Storybook instance in packages/ui. Complements
  ui-library-practices and testing-practices.
---

# Storybook in `@blog/ui`

Storybook v8 with `@storybook/react-vite`. Runs on port **6006**.

```
pnpm --filter @blog/ui storybook        # dev server
pnpm --filter @blog/ui storybook:build  # static build
```

## Where stories live

Co-locate stories next to the component:

```
src/atoms/button/
  button.tsx
  button.test.tsx
  button.stories.tsx   ← here
```

(Kebab-case files/folders, same as every other file in `@blog/ui` — see
`ui-library-practices`.)

The glob `../src/**/*.stories.@(ts|tsx)` picks them up automatically.

## Story format (CSF 3)

Always use [Component Story Format 3](https://storybook.js.org/docs/writing-stories).

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Atoms/Button', // Atomic Design path
  component: Button,
  tags: ['autodocs'], // generates the docs page
  args: {
    // shared defaults across stories
    children: 'Click me',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};
```

## Naming convention for `title`

Match Atomic Design tiers: `"Atoms/Button"`, `"Molecules/PostCard"`,
`"Organisms/Header"`. This keeps the sidebar tidy. There is no Templates tier —
`@blog/ui` stops at organisms (see `ui-library-practices`); page-level
compositions are storied in `apps/web` (`web-storybook`).

## Args and controls

- **All required props belong in `meta.args`**, not in individual stories. If
  a prop appears in every story with the same value, it belongs in meta.
  Individual stories only override what genuinely differs from those defaults.
- Optional props that serve as a useful base (e.g. `className`, `size`) should
  also go in `meta.args` when they're shared across stories.
- **For `tailwind-variants` (`tv()`) props (`variant`, `size`, etc.), always
  wire an explicit `select` control via `objectKeys` — don't rely on
  Storybook's TypeScript-inferred control.** Inference reads the prop type,
  not the component's actual variant config, so it silently drifts out of
  sync (wrong/missing options) whenever the `*-variants.ts` file changes.
  `tv()` exposes its config on `.variants` at runtime, so `objectKeys` (from
  `@blog/utils`) gives you the real, always-current option list:

  ```tsx
  import { objectKeys } from '@blog/utils';

  import { Button } from './button';
  import { buttonVariants } from './button-variants';

  const meta = {
    title: 'Atoms/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: 'select',
        options: objectKeys(buttonVariants.variants.variant),
      },
      size: {
        control: 'select',
        options: objectKeys(buttonVariants.variants.size),
      },
    },
  } satisfies Meta<typeof Button>;
  ```

  For other union-typed props with no `tv()` variant behind them, Storybook's
  inferred control is fine — only override with `argTypes` when it's wrong.

- Never pass live data or async functions as args — all props must be static
  and serialisable.

```tsx
// ✅ correct — shared props in meta, stories only override what changes
const meta = {
  component: Avatar,
  args: { name: 'Jane Doe', alt: 'Jane Doe', size: Size.MD }, // required props here
} satisfies Meta<typeof Avatar>;

export const WithImage: TStory = { args: { src: '...' } }; // just the diff
export const Small: TStory = { args: { size: Size.SM } };

// ❌ wrong — required props repeated in every story
export const WithImage: TStory = {
  args: { name: 'Jane Doe', alt: 'Jane Doe', src: '...' },
};
export const Small: TStory = {
  args: { name: 'Jane Doe', alt: 'Jane Doe', size: Size.SM },
};
```

## `render` — prefer args; use render only when args can't express it

Pass JSX children directly as `children` in `args`. Storybook renders JSX args
correctly, and this keeps stories as plain objects with no boilerplate.

```tsx
// ✅ correct — children in args, no render
const FillImage = () => (
  <img
    src="..."
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
    children: <FillImage />, // JSX element as arg
  },
} satisfies Meta<typeof ImageWithCaption>;

export const WithCaption: TStory = {};
export const WithoutCaption: TStory = { args: { caption: undefined } };

// ❌ wrong — render used just to provide children that could be args
export const WithCaption: TStory = {
  args: { caption: 'A scenic mountain view' },
  render: (args) => (
    <ImageWithCaption {...args}>
      <FillImage />
    </ImageWithCaption>
  ),
};
```

The same rule applies to compound-slot children (`PostCard.Media`, `Hero.Cta`,
`Footer.Nav`, etc.) — pass them as `children: <Slot>...</Slot>` in args and
override per story when the composition changes.

**Define any JSX helpers (like `FillImage`) before the `meta` const**, since
`const` is not hoisted and the JSX evaluates at module initialisation time.

Use `render` when args genuinely can't express the story's structure:

- The story needs a stateful wrapper (e.g. controlled input demo)
- The component must sit inside a specific DOM context (`<form>`, `<table>`)
- Multiple component instances are composed side by side
- A per-story context provider that doesn't belong in a global decorator

## Testing strategy

Storybook is for **visual development and documentation**, not a test runner.
Use Vitest + Testing Library (`Component.test.tsx`) for all behaviour tests —
same `userEvent` / `expect` API but faster and CI-friendly. See
`testing-practices`.

## Tailwind tokens in stories

Tokens load via `tokens.css` imported in `.storybook/preview.ts` — no extra
setup needed. Use the same token utilities in stories that you use in components
(`bg-bg`, `text-fg`, etc.).

Dark mode is class-based (`.dark` on `<html>`), not `prefers-color-scheme`. A
**Light/Dark toolbar toggle** is wired via `@storybook/addon-themes`'
`withThemeByClassName` in `.storybook/preview.ts`, which toggles `.dark` on
the preview `<html>` exactly like `apps/web` does — no per-story setup
needed. `.storybook/preview.css` re-asserts the themed canvas background at
higher specificity so the whole preview (not just component colors) follows
the toggle.

## Viewport testing

Global responsive breakpoint presets (phone/tablet/desktop, matching this
repo's real Tailwind breakpoints) live in `.storybook/preview.ts`'s
`parameters.viewport` config, wired via `@storybook/addon-viewport` (bundled
in `@storybook/addon-essentials`). The toolbar viewport picker uses these
presets for **every** story automatically — **never redefine a custom
viewport object or add a per-story `parameters.viewport` override in an
individual story file.** Anyone can switch viewports interactively from the
toolbar; a story doesn't need a dedicated export per breakpoint.

## MDX documentation pages

For complex components, add a `{component}.mdx` file alongside stories to write
long-form docs:

```mdx
import { Canvas, Controls, Meta } from '@storybook/blocks';
import * as ButtonStories from './button.stories';

<Meta of={ButtonStories} />

# Button

Usage notes here.

<Canvas of={ButtonStories.Primary} />
<Controls of={ButtonStories.Primary} />
```

## Purity rules — same as the component

Stories in `@blog/ui` must obey the same boundary rules as the components:

- **No imports from `@blog/service`**, `sanity`, or `next`.
- All data is static in `args`. Never `fetch()` in a story.
- If a template component accepts a `renderBody` slot for Portable Text, pass a
  static React element as the arg — do not import the PT renderer.

## Checklist before finishing

- [ ] `title` follows the `"Tier/ComponentName"` pattern.
- [ ] `tags: ["autodocs"]` present on `meta`.
- [ ] All required props covered by `args`.
- [ ] Any `tv()`-backed prop (`variant`, `size`, …) has an `argTypes` `select`
      control sourced via `objectKeys(<x>Variants.variants.<group>)`, not
      left to TypeScript inference.
- [ ] No `service`/`sanity`/`next` imports in the story file.
- [ ] Story compiles clean — `.storybook` and `.stories.tsx` are covered by
      `packages/ui/tsconfig.json`'s `include`, so `pnpm --filter @blog/ui
  type-check` already catches TS errors here; no separate
      `storybook:build` needed. Verify the story renders correctly in the
      running dev server (`pnpm --filter @blog/ui storybook`) — that's the
      check for actual Storybook/Vite runtime issues type-check can't see.
