import type { ComponentPropsWithoutRef } from 'react';

import { headerNavVariants } from './header-nav-variants';

interface IHeaderNavProps extends ComponentPropsWithoutRef<'nav'> {
  ariaLabel?: string;
}

/**
 * HeaderNav — the primary navigation region of the site `Header`; a labelled
 * `<nav>` wrapping the header links.
 */
export const HeaderNav = ({
  className,
  ariaLabel,
  ...rest
}: IHeaderNavProps) => (
  <nav
    aria-label={ariaLabel}
    className={headerNavVariants({ class: className })}
    {...rest}
  />
);
