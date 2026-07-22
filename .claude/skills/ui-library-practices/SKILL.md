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

Heavy reference lives in two on-demand files, loaded only when relevant:
`polymorphic-and-as.md` (Level-2 `as`, anchor rules) and
`compound-components.md` (multi-slot component authoring).

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
  theme-toggle-variants.ts   # cva variants (see Styling)
  theme-toggle.test.tsx      # co-located tests
  theme-toggle.stories.tsx   # Storybook stories
  index.ts                   # named barrel — component + props only, never variants
  components/                # sub-components used only by this component
    child-name/              # every child gets its own sub-folder
      child-name.tsx
      child-name-variants.ts # child's own tv() — never imports parent's variants
```

- **One component per file.** Sub-components not exported from the barrel belong
  in a `components/` sub-folder — never inline in the parent file.
- **Every child has its own variants file** and never imports the parent's
  `*-variants.ts`. Extract the relevant slot classes into the child's own file.
- **Every child lives in its own sub-folder** inside `components/`.
- **Use absolute package paths for cross-folder imports** —
  `@blog/ui/atoms/heading`, `@blog/ui/lib/compound`, never `../../atoms/heading`.
  The `@blog/ui/*` alias is configured in `tsconfig.json` (paths),
  `vitest.config.ts` (resolve.alias), and `.storybook/main.ts`. Same-folder
  imports (`./header-variants`) stay relative.

## Accessibility rules (non-negotiable)

- **Never hardcode strings in UI components.** Any text that conveys meaning or
  identity — `aria-label`, landmark names, button labels — must be a prop. The
  component has no knowledge of the page context it's placed in. Use the
  camelCase **`ariaLabel`** prop convention for the mapped `aria-label`
  attribute.

  ```tsx
  // ✅ consumer supplies the label      // ❌ component decides its own label
  <nav aria-label={ariaLabel} {...rest} />   <nav aria-label="Site navigation" />
  ```

- **Never format dates inside a UI component.** Date display is locale-dependent
  and the UI layer has no access to the user's locale. Pass two props:
  `publishedAt?: string` (ISO 8601, for `<time dateTime>`) and
  `formattedDate?: string` (human-readable, pre-formatted in `apps/web` via
  `Intl.DateTimeFormat`/Next helpers). The `<time>` renders only when **both**
  are present: `{publishedAt && formattedDate && <time dateTime={publishedAt}>{formattedDate}</time>}`.

- **Card/post title slots must render a heading element.** `PostCard.Title` is
  an `<h2>` wrapper (not `<div>`) so the card title joins the document outline;
  the consumer passes the link as `children` (`<h2><a href>Post title</a></h2>`).

- **Also:** semantic elements first (`button`, `nav`, `article`, `time`);
  interactive atoms expose `focus-visible` styles (global via `tokens.css`);
  images require `alt`; icon-only interactive elements get `aria-label` +
  `title`.

## Using `@blog/config`

Import shared constants and types from `@blog/config` — never re-declare them or
replace them with bare string literals.

- **`Size` constant for all size variant keys.** Use `[Size.SM]`, `[Size.MD]`,
  etc. as computed keys in `tv()` variant maps, `defaultVariants`, and lookups.
  Never write `'sm'`/`'md'`/`'lg'` as plain strings.
  ```ts
  import { Size } from '@blog/config';
  export const buttonVariants = tv({
    variants: {
      size: {
        [Size.SM]: 'px-3 py-1.5 text-sm',
        [Size.MD]: 'px-4 py-2 text-copy',
      },
    },
    defaultVariants: { size: Size.MD },
  });
  ```
- **`IWithDataTestId`, `TPolymorphicProps`, and other shared types** come from
  `@blog/config` or `@blog/config/react`. Never re-declare them locally.
- **Heading tag literals over template expressions.** Deriving an HTML tag from
  a numeric prop uses an explicit lookup map with a typed union, not
  ``Tag = `h${level}` as const``:
  ```tsx
  const headingTags: Record<1 | 2 | 3 | 4, 'h1' | 'h2' | 'h3' | 'h4'> = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4',
  };
  const Tag = headingTags[level];
  ```

## Component conventions

- **Arrow functions only.** `export const MyComponent = (props) => { ... }`.
  Never `function MyComponent`.
- Props are an explicit `interface` (`I`-prefix) or `type` (`T`-prefix), never
  inline. Extend the right DOM props (`ComponentPropsWithoutRef<'button'>`) and
  spread `...rest` so consumers can pass `aria-*`, `id`, etc.
- **Every prop interface extends `IWithDataTestId`** from `@blog/config`; wire
  `dataTestId` to the root element's `data-testid`.
- **A `tv()` variants file that defines a `variants` key exports its own derived
  type** — `export type T{X}Variants = VariantProps<typeof xVariants>;` **in the
  `*-variants.ts` file** — and the component types its props from that export
  (`size?: T{X}Variants['size']`, or `extends T{X}Variants`). Never derive
  `VariantProps<...>` inline in the component, and never hand-write a duplicate
  union (`size?: 'sm' | 'md' | 'lg'`) — both drift out of sync. See
  `brand-mark-variants.ts`.
- Always forward `className`; pass it as `class: className` in the `tv()` call.
  Never use `cn()` for this.
- **Optional vs required props must match the render logic.** A prop rendered
  conditionally (`{caption && <Caption>...}`) is typed `caption?: string`, not
  `caption: string` — a required prop the component ignores when falsy is a type
  lie.
- Prefer composition (`children`, slots) over boolean prop explosions.
- **Host interactive/foreign content with a `ReactNode` slot — never a
  controlled-props bag you forward to a child.** When a pure component must show
  something it can't own (client state, browser APIs, a router link), give it an
  opaque slot, not a typed state bag it spreads into a child. A forwarded bag
  makes the component a pointless middle layer, tunnels props it never reads, and
  forces consumers to mock it in tests. The interactive widget is built in
  `apps/web` and passed _in_ (see `web-component-practices`).
  ```tsx
  // ✅ opaque slot — PostMeta knows nothing about share state
  export interface IPostMetaProps { share?: ReactNode; … }
  // ❌ forwarded controlled bag — ~10 props tunnel through a component that reads none
  export interface IPostMetaProps { share?: IShareButtonsProps; … }
  ```
- **Shape data props to the view-model you're fed.** A component's data prop
  should structurally accept the `@blog/service` view-model field passed to it,
  so `x={viewModel.x}` type-checks with no reshape. If `TPostDetailAuthor`
  exposes `imageUrl`, `PostMeta`'s author prop is `{ name; imageUrl? }` — not
  `avatarUrl`, which forces every caller to hand-map. (`@blog/ui` still never
  imports `@blog/service`; structural typing bridges it.)
- Server-component-safe by default. **No `"use client"` allowed** — see Purity.

## Polymorphism — the `as` prop

A component that renders as different elements takes an `as` prop. Pick the
**minimum** level:

- **Level 1 — constrained union (default).** The element only swaps its tag and
  every variant shares one prop surface (an anchor-like nav link, a heading
  `h1`–`h4`). A plain union is simplest and safest — use it unless you truly
  need element-specific prop inference:
  ```tsx
  type TLinkAs = 'a' | ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>;
  export interface INavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    as?: TLinkAs;
  }
  ```
- **Level 2 — fully polymorphic.** The component accepts _any_ element and
  exposes _that element's_ props (`href` only when `as="a"`). Use the shared
  `TPolymorphicProps<C, OwnProps>` from `@blog/config/react` — never re-derive.
- **Any anchor a component builds itself needs a `linkAs`/`as` prop** (default
  `'a'`, `TAnchorElementType` from `@blog/config/react`) — never a hardcoded
  `<a>`, even one built to hand into another component's slot.

Full Level-2 derivation, the "why each piece matters" breakdown, and the anchor
before/after → **`polymorphic-and-as.md`**.

## Compound components

Use when a component owns **more than one** framework-coupled seam (renders both
a link and an image, or a family of swappable children). A single `as` swaps one
seam; compound splits into named slots (`Header.Brand`/`Header.Nav`, `PostCard`,
`Hero`). The repo uses a **context-free children-introspection** pattern
(`mapCompoundSlots` from `@blog/ui/lib/compound`), **not** React Context — which
needs a client boundary `@blog/ui` can't have. If a component only ever swaps
**one** element, don't build compound — use `as`.

Primitives API, folder layout, the full `Header` authoring example, and the
slot/media rules → **`compound-components.md`**.

## Styling

- **All Tailwind classes live in a `{component-name}-variants.ts` file** — every
  element in the component, not just the root. Placeholder spans, icon wrappers,
  inner elements: all classes go through the variants file.
- Use `tailwind-variants` (`tv`) for all base styles/variants/sizes. Even a
  component with no variants defines a `tv`. `tv` handles `tailwind-merge`
  internally — never wrap the call with `cn()`.
- **A component with multiple visual slots uses exactly one `tv({ slots: {...} })`
  call** — never multiple separate `tv()` exports. Every named element (root plus
  each inner span/wrapper) becomes a key in the single `slots` object:
  ```ts
  // ✅ one tv({ slots }) call             // ❌ one tv() export per element
  export const myVariants = tv({ slots: {   export const myRootVariants = tv({...});
    root: ['flex items-center gap-2'],       export const myLabelVariants = tv({...});
    label: ['font-medium'] } });
  ```
  Genuinely independent elements (e.g. a component and its separate mount
  placeholder) may be separate `tv()` exports — that's the exception, not the
  multi-element rule above.
- **Group classes by concern inside the `base` array** — one string per concern,
  not one unreadable string, and **no comments of any kind** in variants/stories
  files (no inline `// layout`, no section-label comments, no JSDoc above
  exports) unless the reason is genuinely non-obvious (a browser workaround, a
  surprising z-index):
  ```ts
  // ✅ grouped, readable, no comments        // ❌ single unreadable string
  base: [ 'inline-flex items-center',          base: 'inline-flex items-center rounded-sm px-4 ...'
          'rounded-sm px-4 py-2',
          'bg-accent text-accent-contrast' ]
  ```
- **In `slots`-based `tv()` calls, every slot value is an array of strings** —
  never a bare string, even a single class, even in a `variants`/
  `compoundVariants` override. (Non-slot `base`/`variants` calls in
  single-element atoms like `button-variants.ts` may use bare strings.) Not
  ESLint-enforced by design — `reviewer`/`code-review-practices` catches it at
  PR time.
  ```ts
  // ✅ arrays everywhere, including overrides
  slots: { root: ['grid grid-cols-1'] },
  variants: { hasMedia: { true: { root: ['lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]'] } } },
  ```
- Pass `class: className` into the `tv` call; type `variant`/`size` args via the
  variants file's derived `VariantProps` export (see Component conventions),
  not hand-written unions.
- Use token utilities (`bg-bg`, `text-text`, `text-accent`, `border-border`,
  `font-display`, `font-mono`). No hard-coded hex. Dark mode is handled by token
  values switching under `.dark` — no manual `dark:` colour utilities.

## Responsive design

- **Mobile-first.** Author base (unprefixed) classes for mobile; layer up with
  `md:` then `lg:`. Never author desktop-first and scale down.
- **Two primary breakpoints only** — `md` (768px) and `lg` (1024px) as the
  layout-shifting tiers (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`,
  `hidden md:flex`). Reserve `sm`/`xl`/`2xl` for genuine exceptions.
- **No custom breakpoints.** Tailwind v4 defaults are the standard; do not define
  `--breakpoint-*` overrides.
- **Prefer fluid tokens over breakpoint-specific values.** The type scale and
  spacing tokens (`gap-gutter`, `px-gutter`, `py-section`) are `clamp()`-based
  and need no responsive prefix.
- **Page width belongs to `apps/web`, not `@blog/ui`.** Components stay
  width-agnostic (`w-full`); the app applies `max-w-content`/`max-w-measure`.
- Responsive classes live in `*-variants.ts` via `tv`, grouped by concern —
  never inline in JSX.

## Icons

- **Use `lucide-react` for all icons.** No inline SVG.
- Pass `size` and `strokeWidth` props: `<Sun size={18} strokeWidth={1.6} aria-hidden="true" />`.
- Icon-only interactive elements must have `aria-label` and `title`.

## Tests

Co-locate `component-name.test.tsx`. **All test conventions live in
`testing-practices`** — the component ``describe(`<${Component.name}/>`, …)``
title form, semantic queries + `getByTestId` fallback, `.toBeVisible()`, no
dedicated `dataTestId` test, and boundary mocks. Follow it; this skill adds
nothing test-specific of its own.

## Quality gates (run in this order before finishing)

```bash
pnpm --filter @blog/ui format   # format ALL created/edited files first
pnpm --filter @blog/ui type-check
pnpm --filter @blog/ui test
pnpm lint
```

All four must pass. **Format runs first** — it prevents lint noise from style
issues and ensures every committed file is consistently formatted.

## Checklist before finishing

- [ ] **Ran `pnpm --filter @blog/ui format`** on all created and edited files.
- [ ] No `service`/`sanity`/`fetch` imports. No `"use client"` directive.
- [ ] Arrow-function component; no inline sub-components — each lives in
      `components/{child-name}/` with its own `{child-name}-variants.ts` (never
      importing the parent's variants).
- [ ] Props interface extends `IWithDataTestId`; `dataTestId` wired to the root
      `data-testid`.
- [ ] Props typed (`I`/`T` prefix); `className` forwarded via `class:` in `tv()`.
- [ ] All Tailwind classes in `{component}-variants.ts`; none inline on any
      element; grouped by concern; no `cn()`.
- [ ] Interactive/foreign content hosted via a `ReactNode` slot, not a forwarded
      controlled-props bag. Data props shaped to accept the view-model directly.
- [ ] Stories file created alongside the component.
- [ ] Icons from `lucide-react`; no inline SVG.
- [ ] `describe(Component.name, ...)` and `beforeEach` for shared setup.
- [ ] Uses token utilities; dark mode intact.
- [ ] Exported from the barrel (`index.ts` → `atoms/index.ts` → `src/index.ts`);
      the component `index.ts` exports **only** the component and its props
      interface — never the variants file.
- [ ] Multi-arrangement layouts are mobile-first with `md:`/`lg:` only — no
      custom breakpoints, no page-width `max-w-*` baked in.
