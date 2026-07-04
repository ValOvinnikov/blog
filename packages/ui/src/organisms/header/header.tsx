import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes, ReactNode } from 'react';

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
  mobileTrigger?: ReactNode;
}

export const Header = ({
  title,
  navLinks,
  mobileTrigger,
  className,
  dataTestId,
  ...rest
}: IHeaderProps) => {
  const {
    root,
    brand,
    nav,
    actions,
    mobileTrigger: mobileTriggerSlot,
  } = headerVariants();

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
        {mobileTrigger && (
          <div className={mobileTriggerSlot()}>{mobileTrigger}</div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
};
