import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { headerNavVariants } from './header-nav-variants';

interface IHeaderNavProps
  extends ComponentPropsWithoutRef<'nav'>, IWithDataTestId {
  ariaLabel?: string;
}

/**
 * HeaderNav — the primary navigation region of the site `Header`; a labelled
 * `<nav>` wrapping the header links.
 */
export const HeaderNav = ({
  className,
  ariaLabel,
  dataTestId,
  ...rest
}: IHeaderNavProps) => (
  <nav
    aria-label={ariaLabel}
    className={headerNavVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
