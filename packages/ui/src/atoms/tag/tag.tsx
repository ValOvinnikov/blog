import type { TPolymorphicProps } from '@blog/config/react';
import { type ElementType } from 'react';
import { type VariantProps } from 'tailwind-variants';

import { tagVariants } from './tag-variants';

type TTagOwnProps = {
  className?: string;
} & VariantProps<typeof tagVariants>;

export type TTagProps<C extends ElementType = 'span'> = TPolymorphicProps<
  C,
  TTagOwnProps
>;

/**
 * Tag — small pill-shaped label. Renders as a `<span>` by default; pass `as`
 * (e.g. `'a'` or the app router's `Link`) to render a clickable tag.
 */
export const Tag = <C extends ElementType = 'span'>({
  className,
  variant,
  as,
  ...rest
}: TTagProps<C>) => {
  const Component = (as ?? 'span') as ElementType;

  return (
    <Component
      className={tagVariants({ variant, class: className })}
      {...rest}
    />
  );
};
