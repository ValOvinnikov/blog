import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { footerNavVariants } from './footer-nav-variants';

export type TFooterNavProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel?: string;
    children?: ReactNode;
  };

/**
 * FooterNav — the navigation region of the site `Footer`; a labelled `<nav>`
 * wrapping the footer links.
 */
export const FooterNav = ({
  className,
  ariaLabel,
  dataTestId,
  children,
}: TFooterNavProps) => (
  <nav
    aria-label={ariaLabel}
    className={footerNavVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </nav>
);
