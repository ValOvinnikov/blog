import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ReactNode } from 'react';

import { headerNavVariants } from './header-nav-variants';

export type THeaderNavProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel?: string;
    children?: ReactNode;
  };

/** Holds the site's main links as a landmark screen-reader users can jump straight to. */
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
