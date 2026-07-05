import type { ComponentPropsWithoutRef } from 'react';

import { headerNavVariants } from './header-nav-variants';

export const HeaderNav = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'nav'>) => (
  <nav
    aria-label="Site navigation"
    className={headerNavVariants({ class: className })}
    {...rest}
  />
);
