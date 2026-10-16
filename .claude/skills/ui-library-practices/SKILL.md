---
name: ui-library-practices
description: >-
  Best practices for building components in the @blog/ui design system
  (packages/ui). Use when creating or editing an atom, molecule or organism,
  deciding a component API, styling with tv() and Tailwind tokens, or keeping
  the library pure and publishable. Apply whenever touching packages/ui.
---

# UI library practices (`@blog/ui`)

A **pure, prop-driven, Atomic Design** component library, portable enough to
publish to npm with zero edits. It builds on `react-component-practices`
(§ Props, § Styling files, § Size and splitting, state, composition, accessible
markup) and adds only what is specific to this package. Two reference files
load on demand: `polymorphic-and-as.md` (Level-2 `as`, anchor rules) and
`compound-components.md` (multi-slot authoring).

## Purity rules (non-negotiable)

- **No data fetching.** Components take plain typed props; they never call
  `@blog/service` or `fetch`, or import `sanity`/`next-sanity`.
- **No app coupling.** No `next/*` imports. Framework specifics arrive through
  `as`/`linkAs`, `children` or a slot; default to plain elements.
- Shapes come from `@blog/config`. No business logic.
- **No `'use client'`** (CLAUDE.md → Conventions, which names the agreed
  client-only components). A component that calls a client-only hook — state,
  a ref, an effect, a third-party hook such as `useEmblaCarousel` — is
  client-only without the directive: its consumer renders it under its own
  client boundary, and rendering it from a Server Component throws, which is
  the correct failure. `useId` is server-safe. None is a precedent; a new
  client-only component needs its own explicit decision.

## Atomic Design layering

- `atoms/` — primitives (`Button`, `Heading`, `Text`, `Icon`, `Tag`, `Avatar`,
  `Prose`).
- `molecules/` — small compositions (`MediaCard`, `PostMeta`, `Panel`,
  `PopoverMenu`, `Breadcrumbs`).
- `organisms/` — page sections (`Header`, `Footer`, `Hero`, `Carousel`,
  `Dialog`, `Pagination`).
- **No template layer.** Page composition (layout shells, Portable Text
  rendering) belongs in `apps/web`; `@blog/ui` stops at organisms.
- Each layer composes only the layers below it.

## File and folder structure

Every file and folder under `src/` is **kebab-case** (ESLint-enforced). Each
component owns a folder:

```
src/components/molecules/media-card/
  media-card.tsx             # the component — one per file
  media-card-variants.ts     # its tv() (see Styling)
  media-card.test.tsx
  media-card.stories.tsx
  index.ts                   # public entry: component + props type, never the variants
  components/                # parts only this component uses
    title/                   # one sub-folder per part: <child>/
      media-card-title.tsx   # named <parent>-<child>
      media-card-title-variants.ts
```

- **One component per file.** A part not exported from `index.ts` lives in
  `components/<child>/<parent>-<child>.tsx`, never inline in the parent.
- **No group barrels.** There is no `src/index.ts` and no per-layer `index.ts`;
  consumers deep-import `@blog/ui/components/<layer>/<name>` (served by
  `package.json`'s `"./*"` export). Cross-folder imports inside the package
  use the `@blog/ui/*` alias (declared in `tsconfig.json`, `vitest.config.ts`
  and `.storybook/main.ts`), e.g. `@blog/ui/components/atoms/heading`,
  `@blog/ui/lib/react`; same-folder imports stay relative.
- Size budgets: CLAUDE.md → Conventions. What to extract, and where:
  `react-component-practices` § Size and splitting.

> **The component index depends on this layout.** `scripts/gen-ui-index.mjs`
> parses the eponymous `{folder}/{folder}.tsx` exporting a component named
> after the folder, its `T{X}Props` (or inline param type), the sibling
> `-variants.ts`, and the `Object.assign(Root, Parts)` / object-literal
> compound shapes to build `packages/ui/COMPONENTS.md`. Deviate and a
> component drops out of the index silently — `pnpm gen:ui-index:check` fails
> when it does.

## Accessibility rules (non-negotiable)

- **Never hardcode strings.** Any text conveying meaning or identity —
  `aria-label`, landmark names, button labels — is a prop; the component
  doesn't know the page it sits on. The mapped `aria-label` prop is camelCase
  `ariaLabel`; visible copy is a flat `…Label` prop
  (`react-component-practices` § Props).

  ```tsx
  // ✅ consumer supplies the label      // ❌ component decides its own label
  <nav aria-label={ariaLabel} />          <nav aria-label="Site navigation" />
  ```

  **Exception — compose the name instead of accepting an override when it is
  the component's own visible text plus values it already receives.** An
  override `ariaLabel` can omit the visible text and still type-check, render
  and pass tests: a silent WCAG 2.5.3 failure for speech-input users. Put the
  **whole** name in one visually hidden `span` and `aria-hidden` the visible
  copy — never a hidden suffix beside visible text, because name computation
  trims at element boundaries and drops a leading-space separator. `TextLink`
  without an `href`, which hides its visible copy and carries its whole name
  in one `sr-only` span, is the precedent.

- **Never format dates.** Locale lives in the app. Take `publishedAt` (ISO
  8601, for `<time dateTime>`) and `formattedDate` (pre-formatted in
  `apps/web`), and render `<time>` only when both are present:
  `{publishedAt && formattedDate && <time dateTime={publishedAt}>{formattedDate}</time>}`.

- **A card title slot renders a heading at a level the caller picks**, so it
  joins the page's real outline. Render through the `Heading` atom — never a
  `<div>`, never a literal `<h3>`, never a second tag map. `MediaCard.Title`
  and `TaxonomyCard` are the pattern:

  ```tsx
  <Heading
    level={level}
    visual="card"
    className={mediaCardTitleVariants({ class: className })}
  >
    {children}
  </Heading>
  ```

  The link stays the caller's `children`
  (`<MediaCard.Title level={3}><a href>…</a></MediaCard.Title>`), so the
  heading wraps the anchor.

  - **Name the prop for what the component is.** A component that _is_ the
    heading takes `level`, like `Heading` (`MediaCard.Title`). One that
    _contains_ a heading among other content takes `headingLevel`
    (`TaxonomyCard`, `Dialog`). One owning two heading depths qualifies the
    subordinate one (`<part>HeadingLevel`).
  - **Required on a slot, optional at the app-facing edge.** A slot-level
    component requires the level, so composing it is a deliberate outline
    decision; an organism with many call sites may default it in its
    destructure.
  - **`visual` carries the typography.** A title rendered through `Heading`
    keeps in its own `tv()` only what `Heading` can't express — interaction
    state (`hover:`, `transition-colors`). Font family, size, leading and
    tracking come from `visual` (`card` for card titles); repeating them in
    both places is how the two drift.

- **Also:** semantic elements first (`button`, `nav`, `article`, `time`);
  images require `alt`; interactive atoms show a `focus-visible` style (the
  global default ring is in `configs/tailwind/theme.css`); icon-only controls
  get `aria-label` + `title` (see Icons). General markup rules:
  `react-component-practices` § Accessible by construction.

## Using `@blog/config`

- **`SIZE` keys every size variant** — computed keys in `tv()` maps,
  `defaultVariants` and lookups, never `'sm'`/`'md'` literals:
  ```ts
  import { SIZE } from '@blog/config';
  // inside tv({ … })
  size: { [SIZE.SM]: 'px-3 py-1.5 text-sm', [SIZE.MD]: 'px-4 py-2 text-copy' },
  defaultVariants: { size: SIZE.MD },
  ```
- Shared types (`IWithClassName`, `IWithDataTestId`, `TMaybeUndefined`, …):
  CLAUDE.md → "Use `@blog/config`'s shared types". The React ones —
  `TPolymorphicProps`, `TAnchorElementType` — come from `@blog/config/react`.
- **Heading tags come from `headingTags`** (`@blog/ui/lib/react`, keyed by
  `THeadingLevel`) — never ``Tag = `h${level}` `` and never a local map.

## Props

The contract (a named `type T{X}Props`, no DOM `extends`, no `...rest`, the
polymorphic exception, variant props typed from the `tv()` type), the prop
ceiling, its exemptions and the drop → group → slot → hook → context ladder:
`react-component-practices` § Props. This package adds:

- **Every prop type composes `IWithClassName` and `IWithDataTestId`**, with
  `dataTestId` wired to the root's `data-testid` — compound roots and every
  slot (`Header.Brand`, `MediaCard.Footer`, …) included. A slot is public API
  the moment it is `Object.assign`'d onto its parent.
  ```tsx
  export type TFooProps = IWithClassName &
    IWithDataTestId & {
      variant?: TFooVariants['variant'];
      children?: ReactNode;
    };
  ```
- **`T{X}Variants` is exported by the `-variants.ts`** as
  `VariantProps<typeof xVariants>` (`brand-mark-variants.ts`) — never
  `VariantProps<…>` inline in the component.
- **When a consumer needs a native prop, name it** — `Button` names `type`,
  `Heading` names `id` and `style`, `Icon` names `aria-hidden` — then answer
  "where's the styling for it?". A wide type promises every HTML attribute
  while the `tv()` styles only the few it knows; an inherited `readOnly` once
  produced an uneditable field with no visual change.
- **Attributes the component controls are absent from the type.** A caller
  can't pass `disabled` to `Button`: it sets `disabled` from its own
  `isDisabled`, `TButtonProps` doesn't list it, and there is no spread.
- **`className` is layout, not appearance** — margins, width, flex/grid
  placement, what only the parent can know. A consumer restyling internals
  through `className` (or a `[&>child]:` selector) means a variant is missing;
  add the variant.

## Component conventions

- **Host interactive or foreign content in a `ReactNode` slot — never a
  controlled-props bag forwarded to a child.** When the component must show
  something it can't own (client state, a browser API, a router link), an
  opaque slot stops it becoming a middle layer that tunnels props it never
  reads and that every consumer's test must mock. The widget is built in
  `apps/web` and passed in (`web-component-practices`).
  ```tsx
  // ✅ PostMeta knows nothing about share state
  export type TPostMetaProps = … & { share?: ReactNode };
  // ❌ a state bag tunnelled through a component that reads none of it
  export type TPostMetaProps = … & { share?: { url: string; isCopied: boolean; onCopy: () => void; … } };
  ```
- **Shape data props to the view-model you're fed.** Name a data prop's
  fields after the `@blog/service` view-model passed to it, so
  `x={viewModel.x}` type-checks with no reshape. `@blog/ui` still never
  imports `@blog/service`; structural typing bridges it.
- **Every exported component and slot carries a one-sentence JSDoc — required
  here, unlike the repo default.** It is the library's public API and feeds
  `COMPONENTS.md`, whose `pnpm gen:ui-index:check` coverage guard fails on a
  missing one. Say what the component is _for_, never opening with `Name —`.
  Otherwise CLAUDE.md → "Comments default to zero" holds (never on a prop; no
  CSS, DOM or placement detail; no issue numbers).
  ```tsx
  // ✅
  /** The panel's title bar, rendered as a real heading so the panel's name takes its place in the page's heading outline. */
  // ❌ restates the name, describes the CSS, cites a ticket
  /** PanelHeader — a bordered h2 with px-card-x padding below the image (#937). */
  ```

## Polymorphism — the `as` prop

Pick the **minimum** level:

- **Level 1 — constrained union (default).** The element only swaps its tag
  and every option shares one prop surface: `as?: TAnchorElementType` (`'a'`
  or a router `Link`), or a heading's `level`. Use it unless you need
  element-specific prop inference.
- **Level 2 — fully polymorphic.** Accepts _any_ element and exposes _that_
  element's props (`href` only when `as="a"`). Use the shared
  `TPolymorphicProps<C, OwnProps>` from `@blog/config/react` — never
  re-derive it.
- **Every anchor a component builds itself takes a `linkAs`/`as` prop**
  (default `'a'`, typed `TAnchorElementType`) — never a hardcoded `<a>`,
  including one built to hand into another component's slot.
- **A run of text that links is `TextLink`** (`atoms/text-link`), never a new
  link atom and never a `tv()` slot that re-creates a link look. Pick its
  `appearance` (`prose`, `nav`, `quiet`, `accent`). `isStretched` makes a
  whole card the click target. `isCurrent` sets the current style and
  `aria-current`. A look it lacks becomes a new `appearance` on `TextLink`. A
  link that looks like a button is `LinkButton`.
- **No `href` means plain text.** `TextLink` without an `href` renders a
  `span` that Tab skips, with no hover. A current item or a missing
  destination passes no `href`; it never branches between a link and a
  `span`. A `TextLink` with no children must take `ariaLabel`, which its prop
  type enforces.

Level-2 derivation, the "why each piece matters" breakdown and the anchor
before/after → **`polymorphic-and-as.md`**.

## Compound components

Use when a component owns **more than one** framework-coupled seam (a link and
an image, or a family of swappable children); a single `as` swaps one seam.
Compound splits into named slots (`Header.Brand`/`Header.Nav`, `MediaCard`,
`Panel`). The repo uses **context-free children introspection**
(`mapCompoundSlots` from `@blog/ui/lib/react`), **not** React Context, which
needs a client boundary this package can't have. A component that only ever
swaps **one** element uses `as`, not compound.

Primitives API, folder layout, the `Header` example and the slot/media rules →
**`compound-components.md`**.

## Styling

- **Where a `tv()` lives:** `react-component-practices` § Styling files.
  **This package's exception:** a `tv()` is never folded into the `.tsx` here;
  it stays in a `-variants.ts` because `scripts/gen-ui-index.mjs` reads it,
  until the generator reads an inline `tv()`.
- **No Tailwind classes inline in JSX, on any element** — root or inner
  (placeholder spans, icon wrappers). Every class goes through the `tv()`.
- **Import `tv` from `@blog/ui/lib/styling`**, never from `tailwind-variants`
  — the wrapper registers this project's tokens with `tailwind-merge`. Pass
  `className` as `class: className` in the call; never wrap it in `cn()`.
- **One `tv({ slots: {...} })` per multi-element component** — every styled
  element (root plus each inner span or wrapper) is a key in one `slots`
  object, never one `tv()` export per element. Genuinely independent elements
  (a component and its separate mount placeholder) may be separate exports.
  ```ts
  // ✅ one tv({ slots })                     // ❌ one tv() per element
  export const myVariants = tv({ slots: {    export const myRootVariants = tv({...});
    root: ['flex items-center gap-2'],        export const myLabelVariants = tv({...});
    label: ['font-medium'] } });
  ```
- **Every slot value is an array of strings** — even a single class, even in a
  `variants`/`compoundVariants` override. Single-element calls
  (`button-variants.ts`) may use bare strings in `base`/`variants`. Review
  enforces this, not ESLint.
- **An element with no base classes gets no slot.** A bare `slotName: []`
  merges nothing — assign `className` straight to the element, and add the
  slot back when it gains real classes:
  ```tsx
  // ✅ no base styling for this element
  <nav className={className}>
  // ❌ empty slot kept "for the merge" — slots: { root: [] }
  <nav className={s.root({ class: className })}>
  ```
- **Group classes by concern** — one string per concern inside the `base`
  array, never one unreadable string:
  ```ts
  // ✅                                       // ❌
  base: ['inline-flex items-center',          base: 'inline-flex items-center rounded-sm px-4 ...'
         'rounded-sm px-4 py-2',
         'bg-brand-primary-solid text-brand-primary-contrast'],
  ```
  In this package, variants and stories files carry no section labels and no
  JSDoc on the exports. A tuned value or a real gotcha (a sticky offset, a
  browser workaround) gets the one line CLAUDE.md's comment rule allows; if it
  needs a paragraph, simplify the CSS instead.
- **Tokens, not values.** Use token utilities — `bg-primary`, `bg-surface`,
  `text-text`, `text-text-muted`, `text-brand-primary`, `border-border`,
  `font-display`, `font-mono` — never a hex or arbitrary value. Dark mode is
  the tokens switching under `.dark`; never add `dark:` colour utilities.

## Responsive design

- **Mobile-first.** Unprefixed classes are mobile; layer up with `md:` then
  `lg:`, never desktop-first.
- **`md` (768px) and `lg` (1024px) are the layout tiers**
  (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, `hidden md:flex`); `sm`/`xl`/
  `2xl` are for genuine exceptions. No custom `--breakpoint-*` overrides.
- **Prefer fluid tokens.** The type scale and spacing tokens (`gap-gutter`,
  `px-gutter`, `py-section`) are `clamp()`-based and need no prefix.
- **Page width belongs to `apps/web`.** Components stay width-agnostic
  (`w-full`); the app applies `max-w-content`/`max-w-measure`.

## Icons

- **Every icon is `<Icon name={ICONS.X} />`**
  (`@blog/ui/components/atoms/icon`; `ICONS`/`TIconName` from `@blog/config`),
  which maps the name to a bespoke local SVG through `icon-registry.ts`. No
  `lucide-react`, no ad-hoc inline SVG.
- Size it with the `size` variant (`size={SIZE.SM}`). It is `aria-hidden`
  unless given an `aria-label`.
- An icon-only interactive element has `aria-label` and `title`.

## Tests, stories, gates

- Tests: `testing-practices` — nothing test-specific lives here. Stories:
  `ui-storybook`.
- While iterating: `pnpm --filter @blog/ui type-check` and
  `pnpm --filter @blog/ui test`. Before finishing: `pnpm verify` from the
  root, which also runs lint and `gen:ui-index:check`. The post-edit hook
  formats every file you write.

## Checklist before finishing

- [ ] No `@blog/service`/`sanity`/`fetch` or `next/*` import; no
      `'use client'`; no client-only hook (state, ref, effect, third-party)
      unless the component is an agreed client-only one — `useId` is fine
      (Purity).
- [ ] One component per file; unexported parts in
      `components/<child>/<parent>-<child>.tsx`.
- [ ] Props per `react-component-practices` § Props, composing
      `IWithClassName` + `IWithDataTestId` with `dataTestId` on the root and
      every slot.
- [ ] Every class comes from a `tv()` in a `-variants.ts` (its own, or a
      shared one per `react-component-practices` § Styling files), with `tv`
      from `@blog/ui/lib/styling`; none inline; slot values arrays, grouped
      by concern; `class: className`, no `cn()`; tokens only.
- [ ] Interactive or foreign content via a `ReactNode` slot; data props accept
      the view-model as is.
- [ ] Strings and dates arrive as props; card titles render through `Heading`
      at a caller-chosen level.
- [ ] Icons via `<Icon name={ICONS.X} />`.
- [ ] Mobile-first, `md:`/`lg:` only, no page-width `max-w-*`.
- [ ] Every exported component and slot has a one-sentence JSDoc.
- [ ] The component's `index.ts` exports only the component and its props
      type — never the variants.
- [ ] Stories alongside (`ui-storybook`); `pnpm verify` green.
