import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { NavLink } from '../../atoms/nav-link';
import { ThemeToggle } from '../../atoms/theme-toggle';
import { headerVariants } from './header-variants';

export interface INavLinkItem {
  href: string;
  label: string;
  isActive?: boolean;
}

export interface IHeaderProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'>, IWithDataTestId {
  title: string;
  navLinks: INavLinkItem[];
}

export function Header({
  title,
  navLinks,
  className,
  dataTestId,
  ...rest
}: IHeaderProps) {
  const { root, brand, nav, actions } = headerVariants();

  return (
    <header
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <span className={brand()}>{title}</span>

      <nav className={nav()} aria-label="Site navigation">
        {navLinks.map((link) => (
          <NavLink key={link.href} href={link.href} isActive={link.isActive}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className={actions()}>
        <ThemeToggle />
      </div>
    </header>
  );
}
