import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType } from 'react';

import { navLinkVariants } from './nav-link-variants';

type TNavLinkOwnProps = {
  className?: string;
  isActive?: boolean;
};

export type TNavLinkProps<C extends ElementType = 'a'> = TPolymorphicProps<
  C,
  TNavLinkOwnProps
>;

export const NavLink = <C extends ElementType = 'a'>({
  isActive = false,
  className,
  as,
  ...rest
}: TNavLinkProps<C>) => {
  const Component = (as ?? 'a') as ElementType;

  return (
    <Component
      className={navLinkVariants({ isActive, class: className })}
      {...rest}
    />
  );
};
