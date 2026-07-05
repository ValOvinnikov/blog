import type { ComponentPropsWithoutRef } from 'react';

import { footerNavVariants } from './footer-nav-variants';

export const FooterNav = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'nav'>) => (
  <nav
    aria-label="Footer navigation"
    className={footerNavVariants({ class: className })}
    {...rest}
  />
);
