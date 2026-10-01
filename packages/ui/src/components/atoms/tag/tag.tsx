import { SPAN_AS_CONST, type IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { type ElementType } from 'react';

import { tagVariants, type TTagVariants } from './tag-variants';

type TTagOwnProps = {
  className?: string;
} & Omit<TTagVariants, 'interactive'> &
  IWithDataTestId;

export type TTagProps<C extends ElementType = typeof SPAN_AS_CONST> =
  TPolymorphicProps<C, TTagOwnProps>;

/** Small pill-shaped label. */
export const Tag = <C extends ElementType = typeof SPAN_AS_CONST>({
  className,
  variant,
  as,
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
