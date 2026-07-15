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
    child-name/              # every child gets its own sub-folder
      child-name.tsx
      child-name-variants.ts # child's own tv() — never imports parent's variants
```

- **One component per file.** Sub-components that are not exported from the
  barrel belong in a `components/` sub-folder — never inline in the parent file.
- **Every child has its own variants file.** A child component must never import
  the parent's `*-variants.ts`. Extract the relevant slot classes into the
  child's own `child-name-variants.ts` alongside its `.tsx` file.
- **Every child lives in its own sub-folder** inside `components/` (since it
  always has at least two files: the component and its variants).
- **Use absolute package paths for cross-folder imports** — `@blog/ui/atoms/heading`,
  `@blog/ui/lib/compound`, never `../../atoms/heading` or `../../lib/compound`.
  The `@blog/ui/*` alias is configured in `tsconfig.json` (paths), `vitest.config.ts`
  (resolve.alias), and `.storybook/main.ts` (viteFinal alias). Same-folder imports
  (`./header-variants`, `./components/brand/header-brand`) remain relative.

## Accessibility rules (non-negotiable)

- **Never hardcode strings in UI components.** Any text that conveys meaning or
  identity — `aria-label`, landmark names, button labels — must be a prop. The
  component has no knowledge of the page context it's placed in.

  ```tsx
  // ✅ correct — consumer supplies the label
  interface IHeaderNavProps extends ComponentPropsWithoutRef<'nav'> {
    ariaLabel?: string;
  }
  export const HeaderNav = ({ ariaLabel, ...rest }: IHeaderNavProps) => (
    <nav aria-label={ariaLabel} {...rest} />
  );

  // ❌ wrong — component decides its own label
  export const HeaderNav = ({ ...rest }) => (
    <nav aria-label="Site navigation" {...rest} />
  );
  ```

  The camelCase `ariaLabel` prop is the project convention for the mapped
  `aria-label` attribute — prefer it over passing `aria-label` directly to keep
  component APIs consistent.

- **Never format dates inside a UI component.** Date display is locale-dependent
  and the UI layer has no access to the user's locale. Pass two separate props:
  `publishedAt?: string` (ISO 8601, used only for `<time dateTime>`) and
  `formattedDate?: string` (human-readable string pre-formatted in `apps/web`
  using `Intl.DateTimeFormat` or Next.js `formatDate` utilities). The `<time>`
  element only renders when **both** are present:

  ```tsx
  // IHeroProps / IPostCardProps
  publishedAt?: string;   // → <time dateTime={publishedAt}>
  formattedDate?: string; // → visible text inside <time>

  // render:
  {publishedAt && formattedDate && (
    <time dateTime={publishedAt}>{formattedDate}</time>
  )}
  ```

  In `apps/web`, format via `new Intl.DateTimeFormat(locale, { ... }).format(date)`
  (or equivalent Next.js/i18n helper) before passing to the component.

- **Card/post title slots must render a heading element.** `PostCard.Title` is an
  `<h2>` wrapper (not `<div>`) so the card title participates in the document
  outline. The consumer passes the link as `children`:
  ```html
  <h2><a href="/post">Post title</a></h2>
  ```
  This is the correct semantic pattern for a linked heading in a card component.

## Using `@blog/config`

Import shared constants and types from `@blog/config` — never re-declare them or replace them with bare string literals.

- **`Size` constant for all size variant keys.** Use `[Size.SM]`, `[Size.MD]`, etc. as computed property keys in `tv()` variant maps, in `defaultVariants`, and in component logic (e.g. `defaultSizes` lookup maps). Never write `'sm'`, `'md'`, `'lg'` etc. as plain strings:

  ```ts
  // ✅ correct
  import { Size } from '@blog/config';
  export const buttonVariants = tv({
    variants: {
      size: {
        [Size.SM]: 'px-3 py-1.5 text-sm',
        [Size.MD]: 'px-4 py-2 text-copy',
        [Size.LG]: 'px-5 py-2.5 text-base',
      },
    },
    defaultVariants: { size: Size.MD },
  });

  // ❌ wrong — plain strings bypass the single source of truth
  size: { sm: '...', md: '...', lg: '...' }
  defaultVariants: { size: 'md' }
  ```

- **`IWithDataTestId`, `TPolymorphicProps`, and other shared types** come from `@blog/config` or `@blog/config/react` (see the `as` prop section below). Never re-declare them locally.

- **Heading tag literals over template expressions.** When a component derives an HTML tag from a numeric prop (e.g. `level: 1 | 2 | 3 | 4` → `h1`–`h4`), use an explicit lookup map with a typed union — not a template literal with `as const`:

  ```tsx
  // ✅ correct — self-documenting type, no type-assertion noise
  type THeadingTag = 'h1' | 'h2' | 'h3' | 'h4';
  const headingTags: Record<1 | 2 | 3 | 4, THeadingTag> = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4',
  };
  const Tag = headingTags[level];

  // ❌ wrong — opaque cast, type not visible to readers
  const Tag = `h${level}` as const;
  ```

## Component conventions

- **Arrow functions only.** Use `export const MyComponent = (props) => { ... }`.
  Never `function MyComponent`.
- Props are an explicit `interface` (prefixed `I`) or `type` (prefixed `T`),
  never inline. Extend the right DOM props
  (`React.ComponentPropsWithoutRef<"button">`) and spread `...rest` so
  consumers can pass `aria-*`, `id`, etc.
- **Every component prop interface must extend `IWithDataTestId`**
  from `@blog/config`. Wire `dataTestId` to the root element's
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
- Always forward `className`; pass it as `class: className` in the `tv()` call — `tailwind-variants` handles merging internally. Never use `cn()` for this.
- **Optional vs required props must match the render logic.** If a prop is only rendered conditionally (`{caption && <Caption>...}`), type it as `caption?: string` — not `caption: string`. A required prop the component ignores when falsy is a type lie; make it optional so callers never have to pass an empty string.
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
`as="button"`), use the shared `TPolymorphicProps<C, OwnProps>` generic from
`@blog/config/react` — don't re-derive the mechanism per component. `Container`
in `apps/web` is the reference consumer:

```tsx
// packages/config/src/react/polymorphic.ts (already built — import, don't rewrite)
export type TPolymorphicProps<
  C extends ElementType,
  OwnProps = object,
> = OwnProps & {
  as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof OwnProps | 'as'>;
```

```tsx
// apps/web/src/app/components/container.tsx
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType } from 'react';

import { containerVariants } from './container-variants';

type TContainerOwnProps = { className?: string };

export type TContainerProps<C extends ElementType = 'div'> = TPolymorphicProps<
  C,
  TContainerOwnProps
>;

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
- **`ComponentPropsWithoutRef<C>`** (inside `TPolymorphicProps`) — the
  inference engine. `as="a"` makes `href` valid; `as="button"` makes `disabled`
  valid instead.
- **`Omit<…, keyof OwnProps | 'as'>`** — strips the element's own `className`/
  `as` so the component's own prop typing wins and there's no key collision.
  Add more own props to `TContainerOwnProps` and they're excluded automatically.
- **`ComponentPropsWithoutRef`, not `WithRef`** — `TPolymorphicProps` is
  deliberately built on `WithoutRef` for server-component-safe wrappers (refs
  don't cross the RSC boundary). If a client component genuinely needs a ref,
  don't reuse `TPolymorphicProps` — build a local variant with
  `ComponentPropsWithRef<C>`; React 19's ref-as-prop forwards it through
  `...rest` with no `forwardRef` wrapper.
- **`as ElementType` cast** — the one unavoidable seam at the consumer's render
  site (not inside the shared type): TS can't prove a generic-typed value is
  safe to spread arbitrary props onto. One narrow cast per consumer is the
  standard escape hatch.
- **Why `@blog/config/react`, not the package root** — `@blog/config`'s root
  barrel (`@blog/config`) is framework-agnostic and consumed by `@blog/service`,
  which must never import React. `TPolymorphicProps` lives behind a dedicated
  `./react` subpath export so it's opt-in and doesn't leak `@types/react` into
  `service`'s type graph. Always import it as `@blog/config/react`, never
  re-export it from the root.

### Any anchor a component builds itself — never a hardcoded `<a>`

This applies even when the anchor isn't the component's own root — e.g. an
**organism that constructs a link to pass into another component's slot**
(`PostsSection` building the `<a href={post.href}>` it hands to
`PostCard.Title`). The organism is still rendering an anchor, so it still
needs a `linkAs`/`as` prop (Level 1, `TAnchorElementType` from
`@blog/config/react` — reuse it, don't redeclare the union per component) that
defaults to `'a'`. A bare `<a>` baked into an organism is exactly as wrong as
one baked into an atom; "it's just wrapping a slot's children" is not an
exemption.

```tsx
// ❌ wrong — organism hardcodes the anchor; apps/web can never swap in next/link
<PostCard.Title>
  <a href={post.href} className="before:absolute before:inset-0">
    {post.title}
  </a>
</PostCard.Title>;

// ✅ correct — polymorphic, defaults to 'a', styling lives in the variants file
const Link = (linkAs ?? 'a') as ElementType;
<PostCard.Title>
  <Link href={post.href} className={s.titleLink()}>
    {post.title}
  </Link>
</PostCard.Title>;
```

Note `className={s.titleLink()}` above, not an inline string — the "no inline
Tailwind classes" rule (see Styling section) applies to every element,
including one-off classes like a full-card overlay (`before:absolute
before:inset-0`). Give it its own named slot in `{component}-variants.ts`.

## Compound components

Use this when a component owns **more than one** framework-coupled seam —
e.g. it renders both a link and an image internally, or a whole family of
child elements the consumer needs to swap in (a router `Link`, a Sanity-aware
image, a client-only interactive control). A single `as` prop (the previous
section) only swaps _one_ seam; compound splits the component into named
slots so the consumer controls each one independently. `Header` (nav links +
action buttons), `Footer` (nav links + copyright), `PostCard`, and `Hero`
(cover image + title/CTA link) all use this pattern.

**Why not React Context** (the classic compound-component mechanism,
Radix-style): `createContext`/`useContext` requires a client boundary, and
`@blog/ui` must stay server-component-safe (see Purity rules). This repo
uses a **context-free, children-introspection** pattern instead: the root
scans its `children` at render time and matches each one against a map of
known slot components — no shared runtime state, works identically in RSC
and client components.

### The shared primitives — `@blog/ui/src/lib/compound.tsx`

- `mapCompoundSlots(children, componentTypes)` — the runtime resolver.
  Takes `children` and a `{ SlotName: Component }` map; returns
  `{ slots, unmatched }`. `slots` is keyed exactly like the input map and
  typed accordingly. `unmatched` collects anything that didn't match a known
  slot — unknown component types, stray text, and duplicate occurrences of
  an already-matched slot (first occurrence wins). **Never drop `unmatched`
  silently** — render it somewhere sensible in the root, keyed via `Fragment`
  (a bare `ReactNode[]` array triggers React's missing-key warning):
  ```tsx
  {
    unmatched.map((node, i) => <Fragment key={i}>{node}</Fragment>);
  }
  ```
- `TCompoundComponent<Root, Parts>` — types the assembled export:
  `Root & Parts`, so `Header.Brand`/`Header.Nav`/etc. autocomplete.
- `TCompoundChildren<Parts>` — strictly types a compound root's `children`
  to only the slots in its own `Parts` map (plus arrays of them, `false`,
  `null`, `undefined`). Best-effort at the type level (content that reaches
  children through `.map()`/fragments widens to `ReactNode`) —
  `mapCompoundSlots`'s `unmatched` output is the runtime backstop for
  exactly that gap.

Import both from `@blog/ui/lib/compound` — never re-derive this mechanism per
component.

### Authoring a compound component

Sub-components live in `components/{child-name}/` and each owns its variants.
One `Parts` map drives everything — the `children` type, the resolver call,
and the assembled export:

```
header/
  components/
    brand/
      header-brand.tsx
      header-brand-variants.ts   ← child's own tv(), no parent import
    nav/
      header-nav.tsx
      header-nav-variants.ts
  header-variants.ts             ← root element only
  header.tsx                     ← root + assembly, no inline child defs
```

```ts
// components/brand/header-brand-variants.ts
export const headerBrandVariants = tv({
  base: [
    'font-sans font-semibold text-lg',
    'text-fg',
    'transition-colors hover:text-accent',
    'mr-8',
  ],
});
```

```tsx
// components/brand/header-brand.tsx
import { headerBrandVariants } from './header-brand-variants';
export const HeaderBrand = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'span'>) => (
  <span className={headerBrandVariants({ class: className })} {...rest} />
);
```

```ts
// header-variants.ts — root only
export const headerVariants = tv({
  base: [
    'flex items-center justify-between',
    'px-gutter py-3',
    'bg-bg border-b border-border',
    'sticky top-0 z-10',
  ],
});
```

```tsx
// header.tsx — root + assembly only, no inline sub-component definitions
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/compound';

import { HeaderBrand } from './components/brand/header-brand';
import { HeaderNav } from './components/nav/header-nav';
import { headerVariants } from './header-variants';

const HeaderParts = {
  Brand: HeaderBrand,
  Nav: HeaderNav,
} satisfies Record<string, ElementType>;

export interface IHeaderProps
  extends
    Omit<ComponentPropsWithoutRef<'header'>, 'children'>,
    IWithDataTestId {
  children?: TCompoundChildren<typeof HeaderParts>;
}

const HeaderRoot = ({
  children,
  className,
  dataTestId,
  ...rest
}: IHeaderProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeaderParts);
  return (
    <header
      className={headerVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Brand}
      {slots.Nav}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </header>
  );
};

export const Header: TCompoundComponent<typeof HeaderRoot, typeof HeaderParts> =
  Object.assign(HeaderRoot, HeaderParts);
```

- **Sub-components are hand-authored, not generated by a factory.** This
  repo explicitly rejected a `createSlot`/`createCompoundSlot` abstraction —
  each sub-component (`HeaderBrand`, `HeaderNav`, ...) is a normal arrow
  function with its own `tv` slot, same as any other component. Only
  `mapCompoundSlots` itself is shared. The ~15-line root-assembly pattern
  (resolve → render slots → `Object.assign`) is expected to repeat per
  component — that repetition is the deliberate trade-off for not having a
  factory, not a DRY violation to fix.
- **Slots are generic positioning containers — never force element types or
  borrow styles from other atoms.** A slot like `Hero.Cta` or `PostCard.Title`
  must be a plain wrapper with only its own layout/spacing styles. The consumer
  decides what goes inside (`<Button>`, `<a>`, a router `Link`, etc.) and
  supplies that element's own styling. Never import another atom's variants
  (e.g. `buttonVariants`) inside a slot — that would couple the slot to a
  specific visual treatment. The slot's `tv()` holds only positioning/layout
  classes (`mt-2`, `text-fg hover:text-accent`); everything else belongs to
  the consumer's child element.
  ```tsx
  // ✅ correct — generic wrapper, consumer owns the element and its style
  export const HeroCta = ({
    className,
    ...rest
  }: ComponentPropsWithoutRef<'div'>) => (
    <div className={heroCtaVariants({ class: className })} {...rest} />
  );

  // consumer:
  <Hero.Cta>
    <Button as="a" href="/post">Read more</Button>
  </Hero.Cta>

  // ❌ wrong — slot steals buttonVariants, forcing button styling on any child
  export const HeroCta = <C extends ElementType = 'a'>({
    as, className, children, ...rest
  }: TPolymorphicProps<C, ...>) => {
    const Component = (as ?? 'a') as ElementType;
    return (
      <Component className={buttonVariants({ class: heroCtaVariants({ class: className }) })} {...rest}>
        {children}
      </Component>
    );
  };
  ```
- **Barrel exports stay unchanged by compound-ness**: `index.ts` exports only
  the assembled compound (`Header`) and its root props type (`IHeaderProps`)
  — never the sub-components (`HeaderBrand`, `HeaderNav`) or their prop types
  as separate named exports. Consumers reach sub-components only through
  dot-notation (`Header.Brand`), never a direct import.
- **Image/media slots are positioning containers, not the image itself.**
  A slot like `PostCard.Media`/`Hero.Media` wraps _whatever_ image element
  the consumer renders (`next/image`, a Sanity-aware component, plain
  `<img>`) — so its own `tv` slot must not carry `object-cover` (a no-op on
  a non-replaced element like `<div>`); use `relative overflow-hidden` so a
  `next/image fill` (or any absolutely positioned image) has the parent it
  expects, and let the consumer's image supply its own `object-fit`.

### When NOT to use compound

If the component only ever needs to swap **one** element (a nav link, a
heading tag), don't build a compound API for it — use the plain `as` prop
(previous section). Compound earns its complexity only when there are
multiple independent slots or the component owns text that must be wrapped
in consumer-controlled markup.

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

  // ❌ wrong — inline comments on each group
  export const buttonVariants = tv({
    base: [
      'inline-flex items-center justify-center', // layout
      'rounded-sm px-4 py-2', // shape
    ],
  });

  // ❌ wrong — section label comments
  export const buttonVariants = tv({
    base: [
      // layout
      'inline-flex items-center justify-center',
      // shape
      'rounded-sm px-4 py-2',
    ],
  });

  // ❌ wrong — JSDoc block above the export
  /**
   * Layout variants for the Header organism.
   */
  export const headerVariants = tv({ ... });
  ```
  The grouping is self-evident from the classes themselves — **no comments of any kind** in variants files or stories files unless the reason is genuinely non-obvious (e.g. a browser workaround or a z-index constraint that would surprise a reader). Story names and export identifiers are self-documenting; JSDoc blocks above story exports are forbidden.
- **In `slots`-based `tv()` calls, every slot value is always an array of strings — never a bare string** — even a single-class slot, and even when the slot is overridden inside `variants`/`compoundVariants`. This keeps every slot assignment visually consistent and diff-friendly regardless of how many classes it currently holds:
  ```ts
  // ✅ correct — slot values are always arrays, including variant overrides
  export const heroVariants = tv({
    slots: {
      root: ['grid grid-cols-1 items-center'],
      excerpt: ['m-0 max-w-[52ch]'],
    },
    variants: {
      hasMedia: {
        true: { root: ['lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]'] },
      },
    },
  });

  // ❌ wrong — bare string breaks consistency with the slots block above it
  variants: {
    hasMedia: {
      true: { root: 'lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]' },
    },
  },
  ```
  This rule applies to slot-based components only. Non-slot `base`/`variants` `tv()` calls (a single-element component with no named slots) may use bare strings for variant entries, matching existing atoms like `button-variants.ts` and `tag-variants.ts`.
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
- **Testing a plain function/utility (not a component)** — e.g. `lib/compound.tsx`'s
  `mapCompoundSlots` — pass the symbol itself. Vitest derives the suite title
  from the reference's `.name`, so a rename tracks automatically and deleting
  the function is a compile error instead of a stale string (see
  `testing-practices`). The JSX-style `<${Name}/>` template is only for
  components:
  ```ts
  // ✅ correct — symbol reference, rename-safe
  describe(mapCompoundSlots, () => { ... })

  // ❌ wrong — string drifts when the function is renamed
  describe('mapCompoundSlots', () => { ... })

  // ❌ wrong — .name property access; the reference alone already does this
  describe(mapCompoundSlots.name, () => { ... })
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
- **Prefer semantic queries; fall back to `getByTestId` when queries would be
  ambiguous.** Default to `getByRole`, `getByLabelText`, `getByText` — they
  verify semantics and accessibility. Use `getByTestId` when a molecule or
  organism renders multiple elements of the same role and a semantic query
  can't unambiguously target the right one (e.g. two buttons in a `CardMeta`,
  a heading inside a `PostCard` alongside a nav heading). This is valid in
  both atom unit tests and molecule/organism integration tests in Vitest.
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
- [ ] Arrow-function component (`export const MyComponent = (...) => ...`); no sub-components defined inline — each lives in `components/{child-name}/` with its own `{child-name}-variants.ts`. Child variants never import the parent's variants file.
- [ ] Props interface extends `IWithDataTestId` from `@blog/config`; `dataTestId`
      wired to the root element's `data-testid`.
- [ ] Props typed (`I`-prefix interface or `T`-prefix type); `className` forwarded via `class:` key in `tv()` call.
- [ ] All Tailwind classes in `{component}-variants.ts`; none inline in JSX on any element. Classes grouped by concern in `base` arrays inside `tv`. No `cn()` wrapping the `tv` call.
- [ ] Stories file `{component}.stories.tsx` created alongside the component.
- [ ] Icons from `lucide-react`; no inline SVG.
- [ ] `describe(Component.name, ...)` and `beforeEach` for shared setup.
- [ ] Uses token utilities; dark mode intact.
- [ ] Exported from the barrel (`index.ts` → `atoms/index.ts` → `src/index.ts`). The component `index.ts` exports **only the component and its props interface** — never the variants file. Variants are an implementation detail.
- [ ] If the component has more than one layout arrangement (grid, stacking nav, columns), it is mobile-first with `md:`/`lg:` only — no custom breakpoints, no page-width `max-w-*` baked into the component.
