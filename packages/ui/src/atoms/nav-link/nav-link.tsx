import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType } from 'react';

import { navLinkVariants } from './nav-link-variants';

type TNavLinkOwnProps = {
  className?: string;
  isActive?: boolean;
} & IWithDataTestId;

export type TNavLinkProps<C extends ElementType = 'a'> = TPolymorphicProps<
  C,
  TNavLinkOwnProps
>;

export const NavLink = <C extends ElementType = 'a'>({
  isActive = false,
  className,
  dataTestId,
  as,
  ...rest
}: TNavLinkProps<C>) => {
  const Component = (as ?? 'a') as ElementType;

  return (
    <Component
      className={navLinkVariants({ isActive, class: className })}
      aria-current={isActive ? 'page' : undefined}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
