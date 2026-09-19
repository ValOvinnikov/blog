import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { resolveComponent } from '@blog/ui/lib/react';
import type { ElementType } from 'react';

import { proseLinkVariants } from './prose-link-variants';

type TProseLinkOwnProps = {
  className?: string;
} & IWithDataTestId;

export type TProseLinkProps<C extends ElementType = 'a'> = TPolymorphicProps<
  C,
  TProseLinkOwnProps
>;

/** The accent/underline treatment for inline links inside Portable Text article body copy. */
export const ProseLink = <C extends ElementType = 'a'>({
  className,
  dataTestId,
  as,
  ...rest
}: TProseLinkProps<C>) => {
  const Component = resolveComponent(as, 'a');

  return (
    // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `as`/fallback verbatim, so the reference stays stable across renders
    <Component
      className={proseLinkVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
