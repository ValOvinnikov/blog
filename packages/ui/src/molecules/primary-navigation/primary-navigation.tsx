import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { NavLink } from '@blog/ui/atoms/nav-link';
import type { HTMLAttributes, ReactNode } from 'react';

import { primaryNavigationVariants } from './primary-navigation-variants';

export type { TAnchorElementType };

export interface INavItem {
  href: string;
  label: string;
  isActive?: boolean;
  target?: '_blank';
}

export interface IPrimaryNavigationProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'>, IWithDataTestId {
  links: INavItem[];
  actions?: ReactNode;
  ariaLabel?: string;
  className?: string;
  /** Component each NavLink renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
  linkAs?: TAnchorElementType;
}

/**
 * PrimaryNavigation — top-level `<nav>` landmark composing `NavLink` items
 * with an optional trailing `actions` slot (e.g. a theme toggle or menu button).
 */
export const PrimaryNavigation = ({
  links,
  actions,
  ariaLabel = 'Primary',
  className,
  dataTestId,
  linkAs,
  ...rest
}: IPrimaryNavigationProps) => (
  <nav
    aria-label={ariaLabel}
    className={primaryNavigationVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  >
    {links.map(({ href, label, isActive, target }) => (
      <NavLink
        key={href}
        as={linkAs}
        href={href}
        isActive={isActive}
        target={target}
      >
        {label}
      </NavLink>
    ))}
    {actions}
  </nav>
);
