import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { footerNavVariants } from './footer-nav-variants';

interface IFooterNavProps
  extends ComponentPropsWithoutRef<'nav'>, IWithDataTestId {
  ariaLabel?: string;
}

/**
 * FooterNav — the navigation region of the site `Footer`; a labelled `<nav>`
 * wrapping the footer links.
 */
export const FooterNav = ({
  className,
  ariaLabel,
  dataTestId,
  ...rest
}: IFooterNavProps) => (
  <nav
    aria-label={ariaLabel}
    className={footerNavVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
