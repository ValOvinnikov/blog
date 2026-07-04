---
name: ui-library-practices
description: >-
  Best practices for building components in the @blog/ui design system
  (packages/ui). Use when creating or editing atoms/molecules/organisms/
  templates, deciding component APIs, styling with Tailwind tokens, or keeping
  the library pure and publishable. Apply whenever touching packages/ui.
---

# UI library practices (`@blog/ui`)

This package is a **pure, prop-driven, Atomic Design** component library. It
must stay portable enough to publish to npm with zero edits.

## Purity rules (non-negotiable)

- **No data fetching.** Components receive plain typed props; they never call
  `service`, `fetch`, or import `sanity`/`next-sanity`.
- **No app coupling.** No `next/*` imports except `next/image`/`next/link` only
  if passed in as props/slots — prefer accepting `as`/`children` so the app
  owns framework specifics. Default to plain elements.
- Depend only on `@blog/config` for shapes. No business logic.
- **No `"use client"` directive.** `@blog/ui` must be fully server-component-safe.
  Client boundaries are declared in `apps/web` only — never inside the library.

## Atomic Design layering

- `atoms/` — smallest primitives (Button, Tag, Heading, Avatar, Icon, Badge,
  Prose). No composition of other domain components.
- `molecules/` — small compositions (PostCard, AuthorByline, SocialLinks,
  CategoryPill, ShareButtons).
- `organisms/` — page sections (Hero, PostGrid, Header, Footer, PostMeta,
  Pagination).
- **No template layer.** Page-level composition (layout shells, Portable Text
  rendering) belongs in `apps/web` using Next.js App Router layouts and Server
  Components. `@blog/ui` stops at organisms.
- Each layer only composes layers below it. Re-export everything from
  `src/index.ts`.

## File and folder structure

All files and folders under `src/` must be **kebab-case** (enforced by ESLint).

Each component lives in its own folder:

```
src/atoms/theme-toggle/
  theme-toggle.tsx           # component (one per file)
  theme-toggle-variants.ts   # cva variants (see Styling section)
  theme-toggle.test.tsx      # co-located tests
  theme-toggle.stories.tsx   # Storybook stories
  index.ts                   # named barrel — component + props only, never variants
  components/                # sub-components used only by this component
    some-child.tsx
```

- **One component per file.** Sub-components that are not exported from the
  barrel belong in a `components/` sub-folder — never inline in the parent file.

## Component conventions

- **Arrow functions only.** Use `export const MyComponent = (props) => { ... }`.
  Never `function MyComponent`.
- Props are an explicit `interface` (prefixed `I`) or `type` (prefixed `T`),
  never inline. Extend the right DOM props
  (`React.ComponentPropsWithoutRef<"button">`) and spread `...rest` so
  consumers can pass `aria-*`, `id`, etc.
- **Every interactive component prop interface must extend `IWithDataTestId`**
  from `@blog/config`. Wire `dataTestId` to the root interactive element's
  `data-testid` attribute:
  ```tsx
  import type { IWithDataTestId } from '@blog/config';
  import { type VariantProps } from 'tailwind-variants';
  import { myComponentVariants } from './my-component-variants';

  export interface IMyComponentProps extends IWithDataTestId {
    className?: string;
  }

  export const MyComponent = ({ className, dataTestId }: IMyComponentProps) => (
    <button
      data-testid={dataTestId}
      className={myComponentVariants({ class: className })}
    >
      ...
    </button>
  );
  ```
- Always forward `className`; merge with the `cn()` helper (`clsx` +
  `tailwind-merge`) so consumers can safely override tokens.
- Prefer composition (`children`, slots) over boolean prop explosions.
- Server-component-safe by default. **No `"use client"` allowed** — see Purity rules.

## The `as` prop — two levels

A component that can render as different elements uses an `as` prop. Pick the
**minimum** level that fits — don't reach for generics when a union works.

### Level 1 — constrained union (default choice)

When the element only swaps its **tag** and every variant shares the same prop
surface (e.g. an anchor-like nav link, or a heading that swaps `h1`–`h4`), a
plain union is simplest and safest:

```tsx
type TLinkAs = 'a' | ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>;

export interface INavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  as?: TLinkAs;
}
```

The props are fixed to one element's shape; the consumer just supplies a
drop-in replacement (e.g. next-intl's `Link`). No element-specific prop
inference — and that's the point. Use this unless you actually need Level 2.

### Level 2 — fully polymorphic (element-specific prop inference)

When the component is a generic wrapper that should accept **any** element and
expose _that element's_ props (`href` only when `as="a"`, `disabled` only when
`as="button"`), use the generic pattern. `Container` in `apps/web` is the
reference implementation:

```tsx
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type TContainerOwnProps = {
  className?: string;
};

export type TContainerProps<C extends ElementType = 'div'> =
  TContainerOwnProps & {
    as?: C;
  } & Omit<ComponentPropsWithoutRef<C>, keyof TContainerOwnProps | 'as'>;

export const Container = <C extends ElementType = 'div'>({
  as,
  className,
  ...rest
}: TContainerProps<C>) => {
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component className={containerVariants({ class: className })} {...rest} />
  );
};
```

(Generic arrow components are fine in `.tsx` — the `extends` constraint on the
type parameter disambiguates it from a JSX tag, so no `<C,>` trailing comma is
needed.)

Why each piece matters:

- **`C extends ElementType = 'div'`** — `C` is inferred from `as`; the default
  makes `<Container />` a `div` with no ceremony.
- **`ComponentPropsWithoutRef<C>`** — the inference engine. `as="a"` makes
  `href` valid; `as="button"` makes `disabled` valid instead.
- **`Omit<…, keyof TContainerOwnProps | 'as'>`** — strips the element's own
  `className`/`as` so _our_ prop typing wins and there's no key collision. Add
  more own props later and they're excluded automatically.
- **`ComponentPropsWithoutRef`, not `WithRef`** — deliberate for
  server-component-safe wrappers (refs don't cross the RSC boundary). If a
  client component needs a ref, switch to `ComponentPropsWithRef<C>`; React 19's
  ref-as-prop forwards it through `...rest` with no `forwardRef` wrapper.
- **`as ElementType` cast** — the one unavoidable seam: TS can't prove a
  generic-typed value is safe to spread arbitrary props onto. One narrow cast at
  the assignment site is the standard escape hatch.

## Styling

- **All Tailwind classes live in a `{component-name}-variants.ts` file.**
  Never put Tailwind class strings inline in the component JSX — this includes
  every element in the component, not just the root. Placeholder spans,
  icons wrappers, inner elements: all classes go through the variants file.
- Use `tailwind-variants` (`tv`) in the variants file for all base styles,
  variants, and sizes. Even components with no variants still define a `tv`.
  `tv` handles `tailwind-merge` internally — do **not** wrap the call with `cn()`.
- **Group classes by concern inside the `base` array** — one string per concern,
  not one long unreadable string:
  ```ts
  // ✅ correct — grouped, readable, no comments
  export const buttonVariants = tv({
    base: [
      'inline-flex items-center justify-center',
      'rounded-sm px-4 py-2',
      'text-sm font-medium',
      'bg-accent text-accent-contrast',
      'transition-colors duration-[var(--dur-fast)]',
      'hover:bg-accent-hover',
      'focus-visible:outline-none focus-visible:ring-2',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
    variants: { ... },
    defaultVariants: { ... },
  });

  // ❌ wrong — single unreadable string
  export const buttonVariants = tv({
    base: 'inline-flex items-center justify-center rounded-sm px-4 py-2 ...',
  });

  // ❌ wrong — comments in the array
  export const buttonVariants = tv({
    base: [
      'inline-flex items-center justify-center', // layout
      'rounded-sm px-4 py-2', // shape
    ],
  });
  ```
  The grouping is self-evident from the classes themselves — no comments needed.
- Every named element in the component (including inner spans or wrappers)
  gets its own named export in the variants file:
  ```ts
  export const themeToggleVariants = tv({ base: [...] });
  export const themeTogglePlaceholderVariants = tv({ base: ['block h-[18px] w-[18px]'] });
  ```
- In the component, pass `class: className` into the `tv` call — no `cn()` import needed:
  ```tsx
  import { type VariantProps } from 'tailwind-variants';
  import { myComponentVariants } from './my-component-variants';

  className={myComponentVariants({ variant, size, class: className })}
  ```
  For components with no variants (className override only):
  ```tsx
  className={myComponentVariants({ class: className })}
  ```
- Use token utilities (`bg-bg`, `text-text`, `text-accent`, `border-border`,
  `font-display`, `font-body`, `font-mono`). No hard-coded hex values.
- Dark mode is handled by token values switching under `.dark` — no manual
  `dark:` utilities needed for colour tokens.

## Responsive design

- **Mobile-first.** Author base (unprefixed) classes for mobile; layer up with
  `md:` then `lg:`. Never author desktop-first and scale down.
- **Two primary breakpoints only.** Use Tailwind's default `md` (768px, tablet)
  and `lg` (1024px, desktop) as the layout-shifting tiers — e.g. `grid-cols-1
md:grid-cols-2 lg:grid-cols-3`, `hidden md:flex`. Reserve `sm`/`xl`/`2xl` for
  genuine exceptions; don't reach for every tier out of habit.
- **No custom breakpoints.** Tailwind v4 defaults (`sm` 640, `md` 768, `lg`
  1024, `xl` 1280, `2xl` 1536) are the project standard — do not define
  `--breakpoint-*` overrides.
- **Prefer fluid tokens over breakpoint-specific values** wherever a smooth
  scale suffices. The type scale (`text-xl` through `text-display` in
  `configs/tailwind/theme.css`) is already `clamp()`-based and needs no
  responsive prefix. Layout spacing uses the same approach: `gap-gutter`,
  `px-gutter`, `py-section`, `gap-section` (all fluid via `clamp()`) instead of
  hand-picking per-breakpoint spacing values.
- **Page width belongs to `apps/web`, not `@blog/ui`.** Components stay
  width-agnostic (`w-full`); the consuming app applies `max-w-content` /
  `max-w-measure` containers.
- Responsive classes follow the same rule as all Tailwind classes: they live
  in the `*-variants.ts` file via `tv`, grouped by concern — never inline in
  JSX. Example (PostGrid-style responsive grid):
  ```ts
  export const postGridVariants = tv({
    base: ['grid grid-cols-1 gap-gutter', 'md:grid-cols-2', 'lg:grid-cols-3'],
  });
  ```

## Icons

- **Use `lucide-react` for all icons.** Do not write inline SVG in components.
- Pass `size` and `strokeWidth` as props to match the design spec:
  ```tsx
  import { Sun } from 'lucide-react';
  <Sun size={18} strokeWidth={1.6} aria-hidden="true" />;
  ```
- Icon-only interactive elements must have `aria-label` and `title`.

## Accessibility

- Semantic elements first (`button`, `nav`, `article`, `time`).
- Interactive atoms expose `focus-visible` styles (handled globally in
  `tokens.css`).
- Images require `alt`. Icon-only buttons get `aria-label` + `title`.

## Tests

- Co-locate `component-name.test.tsx` in the component folder.
- Use a **template literal with the component's `.name`** as the describe
  title — never a plain string. This keeps the label in sync if the component
  is renamed:
  ```tsx
  describe(`<${ThemeToggle.name}/>`, () => { ... })
  ```
  Nested / variant describes extend the pattern:
  ```tsx
  describe(`<${ThemeToggle.name}/> — with props`, () => { ... })
  ```
- **Put the default render in `beforeEach`** when all (or most) tests share
  the same setup. For tests that need specific props, put them in a separate
  `describe` block with their own render (Testing Library auto-cleans up
  between tests):
  ```tsx
  describe(`<${ThemeToggle.name}/>`, () => {
    beforeEach(() => {
      render(<ThemeToggle />);
    });

    it('renders a button', () => {
      expect(screen.getByRole('button')).toBeVisible();
    });
  });

  describe(`<${ThemeToggle.name}/> — with props`, () => {
    it('merges extra className', () => {
      render(<ThemeToggle className="ml-2" />);
      expect(screen.getByRole('button').className).toContain('ml-2');
    });
  });
  ```
- **Use `.toBeVisible()` for positive render assertions, not `.toBeInTheDocument()`.**
  `.toBeInTheDocument()` is only valid with `.not` to assert an element is absent:
  ```tsx
  // ✅ correct
  expect(screen.getByRole('button')).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // ❌ wrong
  expect(screen.getByRole('button')).toBeInTheDocument();
  ```
- **Do not write a dedicated test for `dataTestId`.** If a test uses
  `screen.getByTestId(...)` and the attribute is missing, the test fails on its
  own — an explicit assertion adds no value.
- See `testing-practices` for the full testing guide.

## Quality gates (run in this order before finishing)

```bash
pnpm --filter @blog/ui format   # format ALL created/edited files first
pnpm --filter @blog/ui type-check
pnpm --filter @blog/ui test
pnpm lint
```

All four must pass. Fix failures before reporting back. **Format runs first** — it prevents lint noise from style issues and ensures every file committed is consistently formatted.

## Checklist before finishing

- [ ] **Ran `pnpm --filter @blog/ui format`** on all created and edited files.
- [ ] No `service`/`sanity`/`fetch` imports. No `"use client"` directive.
- [ ] Arrow-function component (`export const MyComponent = (...) => ...`); no helper components in the same file.
- [ ] Props interface extends `IWithDataTestId` from `@blog/config`; `dataTestId`
      wired to the root interactive element's `data-testid`.
- [ ] Props typed (`I`-prefix interface or `T`-prefix type); `className` forwarded via `class:` key in `tv()` call.
- [ ] All Tailwind classes in `{component}-variants.ts`; none inline in JSX on any element. Classes grouped by concern in `base` arrays inside `tv`. No `cn()` wrapping the `tv` call.
- [ ] Stories file `{component}.stories.tsx` created alongside the component.
- [ ] Icons from `lucide-react`; no inline SVG.
- [ ] `describe(Component.name, ...)` and `beforeEach` for shared setup.
- [ ] Uses token utilities; dark mode intact.
- [ ] Exported from the barrel (`index.ts` → `atoms/index.ts` → `src/index.ts`). The component `index.ts` exports **only the component and its props interface** — never the variants file. Variants are an implementation detail.
- [ ] If the component has more than one layout arrangement (grid, stacking nav, columns), it is mobile-first with `md:`/`lg:` only — no custom breakpoints, no page-width `max-w-*` baked into the component.
