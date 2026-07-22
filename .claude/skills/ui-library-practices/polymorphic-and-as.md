# Polymorphic `as` — Level 2 and anchor rules (`@blog/ui`)

Reference for the `ui-library-practices` skill. SKILL.md covers the decision
(Level 1 union by default). Read this when you actually need element-specific
prop inference, or when an organism builds an anchor to hand into a slot.

## Level 2 — fully polymorphic (element-specific prop inference)

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
  barrel is framework-agnostic and consumed by `@blog/service`, which must
  never import React. `TPolymorphicProps` lives behind a dedicated `./react`
  subpath so it's opt-in and doesn't leak `@types/react` into `service`'s type
  graph. Always import it as `@blog/config/react`, never re-export from root.

## Any anchor a component builds itself — never a hardcoded `<a>`

This applies even when the anchor isn't the component's own root — e.g. an
**organism that constructs a link to pass into another component's slot**
(`PostsSection` building the `<a href={post.href}>` it hands to
`PostCard.Title`). The organism is still rendering an anchor, so it still needs
a `linkAs`/`as` prop (Level 1, `TAnchorElementType` from `@blog/config/react`
— reuse it, don't redeclare the union) that defaults to `'a'`. A bare `<a>`
baked into an organism is exactly as wrong as one baked into an atom; "it's
just wrapping a slot's children" is not an exemption.

```tsx
// ❌ organism hardcodes the anchor; apps/web can never swap in next/link
<PostCard.Title>
  <a href={post.href} className="before:absolute before:inset-0">
    {post.title}
  </a>
</PostCard.Title>;

// ✅ polymorphic, defaults to 'a', styling lives in the variants file
const Link = (linkAs ?? 'a') as ElementType;
<PostCard.Title>
  <Link href={post.href} className={s.titleLink()}>
    {post.title}
  </Link>
</PostCard.Title>;
```

Note `className={s.titleLink()}`, not an inline string — the "no inline
Tailwind classes" rule applies to every element, including one-off classes
like a full-card overlay (`before:absolute before:inset-0`). Give it its own
named slot in `{component}-variants.ts`.
