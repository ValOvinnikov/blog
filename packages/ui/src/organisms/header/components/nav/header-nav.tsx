import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { headerNavVariants } from './header-nav-variants';

export type THeaderNavProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel?: string;
    children?: ReactNode;
  };

/**
 * HeaderNav — the primary navigation region of the site `Header`; a labelled
 * `<nav>` wrapping the header links.
 */
export const HeaderNav = ({
  className,
  ariaLabel,
  dataTestId,
  children,
}: THeaderNavProps) => (
  <nav
    aria-label={ariaLabel}
    className={headerNavVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </nav>
);
