import { A_AS_CONST, type IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType } from 'react';

import { proseLinkVariants } from './prose-link-variants';

type TProseLinkOwnProps = {
  className?: string;
} & IWithDataTestId;

export type TProseLinkProps<C extends ElementType = typeof A_AS_CONST> =
  TPolymorphicProps<C, TProseLinkOwnProps>;

/** The accent/underline treatment for inline links inside Portable Text article body copy. */
export const ProseLink = <C extends ElementType = typeof A_AS_CONST>({
  className,
  dataTestId,
  as,
  ...rest
}: TProseLinkProps<C>) => {
  const Component = as ?? A_AS_CONST;

  return (
    <Component
      className={proseLinkVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
