import type { ComponentPropsWithoutRef, ElementType } from 'react';

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
