---
name: ui-storybook
description: >-
  How to write, run, and maintain Storybook stories in @blog/ui (packages/ui).
  Use when adding stories for atoms, molecules, or organisms, or when
  configuring the Storybook instance in packages/ui. Complements
  ui-library-practices and testing-practices.
---

# Storybook in `@blog/ui`

Storybook v10 with `@storybook/react-vite`. Runs on port **6006**.

Storybook 10 folded most of `@storybook/addon-essentials`' functionality
(controls, interactions, actions, viewport) into core — no addon needed for
any of those. The one piece that didn't move to core is docs:
`@storybook/addon-docs` is an explicit `addons` entry in `.storybook/main.ts`,
required for the `tags: ['autodocs']` convention below to work.
`@storybook/addon-themes` stays, for the light/dark toolbar toggle.
`Meta`/`StoryObj`/`Preview`/`ReactRenderer` types come from
`@storybook/react-vite` (the framework package), not `@storybook/react` —
Storybook 10 moved to framework-based type imports.

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
import type { Meta, StoryObj } from '@storybook/react-vite';
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

- **For a prop backed by an UPPERCASE key/value dictionary const (the
  `@blog/config` constant convention — `ASIDE_KIND`, `BRAND_VARIANT`, …),
  always wire an explicit `select` control with
  `options: Object.values(THE_CONST)`.** A free-text input for such a prop is
  not acceptable: it invites an arbitrary invalid string where the valid set
  is already known and enumerable.

  ```tsx
  // ❌ before — no argTypes entry, so `kind` renders as a free-text box
  import { ASIDE_KIND } from '@blog/config';

  import { Aside } from './aside';

  const meta = {
    title: 'Molecules/Aside',
    component: Aside,
    tags: ['autodocs'],
    args: { children: <p>…</p> },
  } satisfies Meta<typeof Aside>;

  // ✅ after — a select bound to the real dictionary
  const meta = {
    title: 'Molecules/Aside',
    component: Aside,
    tags: ['autodocs'],
    argTypes: {
      kind: {
        control: 'select',
        options: Object.values(ASIDE_KIND),
      },
    },
    args: { children: <p>…</p> },
  } satisfies Meta<typeof Aside>;
  ```

  `Object.values` here, not the `objectKeys` of the `tv()` rule above — the
  two look alike but aren't the same case. A dictionary const's _values_ are
  the stored vocabulary the prop accepts; a `tv()` variant map's _keys_ are,
  and its values are class strings.

  **When a prop is both — typed from a dictionary const _and_ passed into a
  `tv()` config — the `tv()` rule wins:** source the options from the variant
  map. The variant map is usually keyed off the const already
  (`[CTA_IMAGE_SIDE.LEFT]: { … }`), so both forms yield the same list, but the
  variant map is what actually renders, and keying off it keeps the control
  honest if the two ever diverge. The discriminator is _does this prop drive
  `tv()`_, not _is this prop dictionary-typed_. `Icon` carries one of each:

  ```tsx
  argTypes: {
    name: {
      control: 'select',
      options: Object.values(ICONS),
    },
    size: {
      control: 'select',
      options: objectKeys(iconVariants.variants.size),
    },
  },
  ```

  **Scope the options to the subset the prop actually accepts.** Where a prop
  narrows a wider dictionary (`TBrandVariantOf<'PRIMARY' | 'SECONDARY'>`), a
  blanket `Object.values()` offers a value the type rejects — trading a
  permissive text box for a dropdown of invalid options. List the narrowed
  subset instead:

  ```tsx
  brandVariant: {
    control: 'select',
    options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
  },
  ```

  **Audit from the component's prop types, not from the story's imports.** A
  story file often doesn't import the const its component's prop is typed
  against, so an import-driven sweep silently misses those props. For each
  story, open the component, read its full prop type, and follow every prop's
  type alias back to its definition looking for
  `TValueOf<typeof SOME_UPPERCASE_CONST>`.

  For a prop typed as a bare literal union with neither a `tv()` config nor a
  dictionary const behind it (`variant: 'full' | 'compact'`), Storybook's
  inferred control is fine — only override with `argTypes` when it's wrong.

- Never pass live data or async functions as args — all props must be static
  and serialisable.

```tsx
// ✅ shared/required props in meta; each story overrides only the diff
const meta = {
  component: Avatar,
  args: { name: 'Jane Doe', alt: 'Jane Doe', size: Size.MD },
} satisfies Meta<typeof Avatar>;
export const WithImage: TStory = { args: { src: '...' } };
export const Small: TStory = { args: { size: Size.SM } };
// ❌ repeating name/alt in every story's args
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

// ❌ wrong — a `render` used only to pass children that could have been an arg
```

The same rule applies to compound-slot children (`PostCard.Media`, `Hero.Cta`,
`Footer.Nav`, etc.) — pass them as `children: <Slot>...</Slot>` in args and
override per story when the composition changes.

**Define any JSX helpers (like `FillImage`) before the `meta` const**, since
`const` is not hoisted and the JSX evaluates at module initialisation time.

Use `render` when args genuinely can't express the story's structure:

- The story needs a stateful wrapper (a controlled input, or a controlled/
  headless component whose visible state is prop-driven — see below)
- The component must sit inside a specific DOM context (`<form>`, `<table>`)
- Multiple component instances are composed side by side
- A per-story context provider that doesn't belong in a global decorator

**A controlled/headless component needs a visible, interactive story — not a
static `open`.** When a component's visible state is entirely prop-driven
(`open`, `isCopied`) and its surface is absolutely positioned (a popover panel,
a dropdown, a menu), an `args: { open: true }` story renders it clipped, empty,
or overlapping — effectively invisible in the canvas. Give it a `render` story
with a stateful wrapper that toggles the state through the real trigger, plus a
decorator that gives the positioned surface room (padding / `min-height`). A
story where the open state can't be seen and exercised is a broken story.

## Testing strategy

Storybook is for **visual development and documentation**, not a test runner.
Use Vitest + Testing Library (`Component.test.tsx`) for all behaviour tests —
same `userEvent` / `expect` API but faster and CI-friendly. See
`testing-practices`.

## Fixtures

A component's `.stories.tsx` args and its `.test.tsx` render props both need
sample data — don't duplicate a hand-written literal in both files. Follow
the same `src/testing/` pattern as `apps/web` (`web-storybook`,
`testing-practices` → "Where tests live"): mirror the component tree under
`packages/ui/src/testing/`, e.g. `src/organisms/post-card/` →
`src/testing/post-card/fixtures.ts`, and import via the workspace alias —
`import { mockPostCard } from '@blog/ui/testing/post-card/fixtures'` — never
a relative path once the fixture is shared. A one-off literal used by only a
single file stays inline; promote it to `src/testing/` the moment a second
file (typically the story) needs the same shape.

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
`parameters.viewport` config — viewport is a core Storybook 10 feature, no
addon install needed. The toolbar viewport picker uses these presets for
**every** story automatically — **never redefine a custom viewport object or
add a per-story `parameters.viewport` override in an individual story file.**
Anyone can switch viewports interactively from the toolbar; a story doesn't
need a dedicated export per breakpoint.

**Narrow exception — a component whose behavior forks on a real (non-container)
media-query breakpoint.** Most components don't care which viewport preset is
active, so the rule above holds. But if a component's own rendering only
changes below/above a real CSS `md:`/`sm:`-style breakpoint (not a container
query), a story demonstrating that state renders identically to `Default` at
Storybook's normal wide canvas — silently showing nothing without a manual
toolbar switch. In that specific case, pin `globals: { viewport: '<preset>' }`
(the CSF3 per-story globals override, not `parameters.viewport` — that field
no longer even has a `defaultViewport` key in Storybook 10) on that story,
reusing an existing named preset from `preview.ts` rather than inventing new
dimensions, and leave a one-line comment explaining why. First precedent:
`PrimaryNavigation`'s `MobileClosed`/`MobileOpen`/`MobileInteractive` stories
(`packages/ui/src/molecules/primary-navigation/primary-navigation.stories.tsx`),
whose `mobileToggle` prop collapses the nav behind a real `md:` variant.

## MDX documentation pages

For complex components, add a `{component}.mdx` file alongside stories to write
long-form docs:

```mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
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
- [ ] Any dictionary-const-backed prop has an `argTypes` `select` control with
      `options: Object.values(THE_CONST)`, narrowed to the subset the prop
      accepts — checked against the component's prop types, not the story's
      imports. If the prop also drives a `tv()` config, source the options
      from the variant map instead.
- [ ] No `service`/`sanity`/`next` imports in the story file.
- [ ] Story compiles clean — `.storybook` and `.stories.tsx` are covered by
      `packages/ui/tsconfig.json`'s `include`, so
      `pnpm --filter @blog/ui type-check` already catches TS errors here; no
      separate `storybook:build` needed. Verify the story renders correctly
      in the running dev server (`pnpm --filter @blog/ui storybook`) — that's
      the check for actual Storybook/Vite runtime issues type-check can't see.
