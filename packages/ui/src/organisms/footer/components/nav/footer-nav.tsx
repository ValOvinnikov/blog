import type { ComponentPropsWithoutRef } from 'react';

import { footerNavVariants } from './footer-nav-variants';

interface IFooterNavProps extends ComponentPropsWithoutRef<'nav'> {
  ariaLabel?: string;
}

export const FooterNav = ({
  className,
  ariaLabel,
  ...rest
}: IFooterNavProps) => (
  <nav
    aria-label={ariaLabel}
    className={footerNavVariants({ class: className })}
    {...rest}
  />
);
