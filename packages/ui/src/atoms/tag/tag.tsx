import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { resolveComponent } from '@blog/ui/lib/react';
import { type ElementType } from 'react';

import { tagVariants, type TTagVariants } from './tag-variants';

type TTagOwnProps = {
  className?: string;
} & Omit<TTagVariants, 'interactive'> &
  IWithDataTestId;

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
  dataTestId,
  ...rest
}: TTagProps<C>) => {
  const Component = resolveComponent(as, 'span');

  return (
    // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `as`/fallback verbatim, so the reference stays stable across renders
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
