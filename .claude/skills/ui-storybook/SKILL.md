---
name: ui-storybook
description: >-
  How to write, run, and maintain Storybook stories in @blog/ui (packages/ui).
  Use when adding stories for atoms, molecules, organisms, or templates, or when
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
src/atoms/Button/
  Button.tsx
  Button.test.tsx
  Button.stories.tsx   ← here
```

The glob `../src/**/*.stories.@(ts|tsx)` picks them up automatically.

## Story format (CSF 3)

Always use [Component Story Format 3](https://storybook.js.org/docs/writing-stories).

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Atoms/Button",        // Atomic Design path
  component: Button,
  tags: ["autodocs"],            // generates the docs page
  args: {                        // shared defaults across stories
    children: "Click me",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};
```

## Naming convention for `title`

Match Atomic Design tiers: `"Atoms/Button"`, `"Molecules/PostCard"`,
`"Organisms/Header"`, `"Templates/PageLayout"`. This keeps the sidebar tidy.

## Args and controls

- Define **all required props** as `args` on `meta` so Storybook generates
  controls and a docs page automatically.
- For union types (variants, sizes) Storybook infers controls from TypeScript.
  Annotate with `argTypes` only when the inferred control is wrong.
- Never pass live data or async functions as args — all props must be static
  and serialisable.

## Testing strategy

Storybook is for **visual development and documentation**, not a test runner.
Use Vitest + Testing Library (`Component.test.tsx`) for all behaviour tests —
same `userEvent` / `expect` API but faster and CI-friendly. See
`testing-practices`.

## Tailwind tokens in stories

Tokens load via `tokens.css` imported in `.storybook/preview.ts` — no extra
setup needed. Use the same token utilities in stories that you use in components
(`bg-bg`, `text-fg`, etc.).

To preview dark mode, add the `backgrounds` parameter or use the toolbar toggle
(addon-essentials includes it). The tokens switch automatically via
`prefers-color-scheme`.

## MDX documentation pages

For complex components, add a `Component.mdx` file alongside stories to write
long-form docs:

```mdx
import { Canvas, Controls, Meta } from "@storybook/blocks";
import * as ButtonStories from "./Button.stories";

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
- [ ] No `service`/`sanity`/`next` imports in the story file.
- [ ] `pnpm --filter @blog/ui storybook:build` exits cleanly (no TS errors).
