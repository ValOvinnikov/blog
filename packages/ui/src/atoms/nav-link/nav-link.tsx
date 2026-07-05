import type { AnchorHTMLAttributes, ComponentType } from 'react';

import { navLinkVariants } from './nav-link-variants';

type TLinkAs = 'a' | ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>;

export interface INavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean;
  as?: TLinkAs;
}

export const NavLink = ({
  isActive = false,
  className,
  as: Component = 'a',
  ...rest
}: INavLinkProps) => {
  return (
    <Component
      className={navLinkVariants({ isActive, class: className })}
      {...rest}
    />
  );
};
