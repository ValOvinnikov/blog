# Polymorphic `as` — Level 2 and anchor rules (`@blog/ui`)

Reference for `ui-library-practices` § Polymorphism, which picks the level
(Level 1 union by default). Read this when a component needs element-specific
prop inference, or renders an anchor anywhere in its tree.

## The closed-prop-types exception stops here

A Level 2 component keeps `TPolymorphicProps<C, OwnProps>` and its `...rest`
spread because the forwarded props belong to an element the caller chooses
(SKILL.md § Closed prop types). The reasoning never extends to a component
that renders a fixed element: "consumers might want `aria-*`" is a reason to
name the prop, not to reopen the surface. `Eyebrow` (`atoms/eyebrow`) picks
its own element — `<p>`, or a `linkAs` link when `href` is set — so it is
closed like any other atom.

## Level 2 — fully polymorphic

For a wrapper that accepts **any** element and exposes _that_ element's props
(`href` only when `as="a"`, `disabled` only when `as="button"`), import
`TPolymorphicProps` from `@blog/config/react`
(`packages/config/src/react/polymorphic.ts`) — never re-derive it. `Tag`
(`atoms/tag`) is the minimal consumer; `LinkButton` and `PopoverMenu.Item`
follow the same shape:

```tsx
import {
  SPAN_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType } from 'react';

import { tagVariants, type TTagVariants } from './tag-variants';

export type TTagProps<C extends ElementType = typeof SPAN_AS_CONST> =
  TPolymorphicProps<
    C,
    IWithClassName & IWithDataTestId & Omit<TTagVariants, 'interactive'>
  >;

export const Tag = <C extends ElementType = typeof SPAN_AS_CONST>({
  as,
  className,
  variant,
  dataTestId,
  ...rest
}: TTagProps<C>) => {
  const Component = as ?? SPAN_AS_CONST;

  return (
    <Component
      className={tagVariants({
        variant,
        interactive: Boolean(as),
        class: className,
      })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
```

The derivation, for reading the breakdown below (import it, never copy it):

```ts
export type TPolymorphicProps<
  C extends ElementType,
  OwnProps = object,
> = OwnProps & {
  as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof OwnProps | 'as'>;
```

Why each piece matters:

- **`C extends ElementType = typeof A_AS_CONST`** — `C` is inferred from `as`;
  the default (`A_AS_CONST`, `SPAN_AS_CONST` or `BUTTON_AS_CONST` from
  `@blog/config`) makes a bare `<Tag />` a `<span>`. The `extends`
  constraint also lets the generic arrow parse in `.tsx`, so no `<C,>`.
- **`as ?? SPAN_AS_CONST`** needs no `as ElementType` cast; don't add one.
- **`ComponentPropsWithoutRef<C>`** (inside the generic) is the inference
  engine: `as="a"` makes `href` valid, `as="button"` makes `disabled` valid.
- **`Omit<…, keyof OwnProps | 'as'>`** lets the component's own props win over
  the element's; every own prop added is excluded automatically.
- **`WithoutRef`, deliberately** — refs don't cross the RSC boundary. A client
  component that genuinely needs a ref builds a local variant on
  `ComponentPropsWithRef<C>` instead of reusing `TPolymorphicProps`; React 19's
  ref-as-prop forwards it through `...rest` with no `forwardRef`.
- **`@blog/config/react`, never the root barrel** — the root is consumed by
  `@blog/service`, which must not see React types. Never re-export the React
  types from the root.

## Every anchor a component renders — never a hardcoded `<a>`

The rule (SKILL.md § Polymorphism) covers anchors that aren't the component's
root too: `Pagination`'s page links, `BookmarksList`'s per-row link, and a link
an organism builds to hand into another component's slot. Each takes a
`linkAs` prop typed `TAnchorElementType` (`@blog/config/react` — never
redeclare the union), defaulting to `'a'`. "It only wraps a slot's children"
is not an exemption.

```tsx
// ❌ hardcoded — apps/web can never swap in its router Link
<a href={bookmark.href} className="underline">
  {bookmark.filename}
</a>;

// ✅ polymorphic, defaults to 'a', classes from a tv() slot
const Component = linkAs ?? A_AS_CONST;
<Component href={bookmark.href} className={filename()}>
  {bookmark.filename}
</Component>;
```

A one-off class on that anchor (a full-card `before:absolute before:inset-0`
overlay) is still a named slot in the component's `tv()`, never an inline
string — SKILL.md § Styling.
