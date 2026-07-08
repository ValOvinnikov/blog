import type { IWithDataTestId } from '@blog/config';
import { NavLink } from '@blog/ui/atoms/nav-link';
import type { ComponentType, HTMLAttributes, ReactNode } from 'react';

import { primaryNavigationVariants } from './primary-navigation-variants';

/**
 * Restricts `linkAs` to the intrinsic `<a>` tag or a custom component whose
 * props accept a string `href` and `children` (e.g. next/link's `Link`,
 * next-intl's `Link`) — anything else is rejected at the type level. A plain
 * `ElementType<{ href: string }>` is too loose here: TS's `extends` check
 * allows any intrinsic element to structurally match an object type that
 * only adds properties, so it would silently accept `div`, `span`, etc.
 */
export type TAnchorElementType =
  'a' | ComponentType<{ href: string; children?: ReactNode }>;

export interface INavItem {
  href: string;
  label: string;
  isActive?: boolean;
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
    {links.map(({ href, label, isActive }) => (
      <NavLink key={href} as={linkAs} href={href} isActive={isActive}>
        {label}
      </NavLink>
    ))}
    {actions}
  </nav>
);
