import type {
  ComponentPropsWithoutRef,
  ComponentType,
  ElementType,
  ReactNode,
} from 'react';

/**
 * Props for a polymorphic component whose root element is selected via an `as`
 * prop. `C` is the element/component type; `OwnProps` are the component's own
 * props — they win over, and are stripped from, the inherited element props.
 *
 * Not re-exported from the package root (`@blog/config`) so the framework-
 * agnostic barrel stays React-free and `@blog/service` never pulls in React
 * types. Import from the subpath instead:
 *
 * ```ts
 * import type { TPolymorphicProps } from '@blog/config/react';
 * ```
 */
export type TPolymorphicProps<
  C extends ElementType,
  OwnProps = object,
> = OwnProps & {
  as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof OwnProps | 'as'>;

/**
 * Restricts an `as`/`linkAs` prop to the intrinsic `<a>` tag or a custom
 * component whose props accept a string `href` and `children` (e.g. next/link's
 * `Link`, next-intl's `Link`) — anything else is rejected at the type level. A
 * plain `ElementType<{ href: string }>` is too loose here: TS's `extends` check
 * allows any intrinsic element to structurally match an object type that only
 * adds properties, so it would silently accept `div`, `span`, etc.
 *
 * Use this whenever a `@blog/ui` component renders an anchor — never hardcode
 * a bare `<a>`. Default the prop to `'a'` so the library stays framework-free,
 * and let `apps/web` pass its router's `Link` for client-side navigation.
 */
export type TAnchorElementType =
  'a' | ComponentType<{ href: string; children?: ReactNode }>;
