import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { NavLink } from '../../atoms/nav-link';
import { footerVariants } from './footer-variants';

export interface IFooterProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'>, IWithDataTestId {
  title: string;
  navLinks?: { href: string; label: string }[];
}

export const Footer = ({
  title,
  navLinks,
  className,
  dataTestId,
  ...rest
}: IFooterProps) => {
  const { root, nav, copyright } = footerVariants();
  const year = new Date().getFullYear();

  return (
    <footer
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {navLinks && navLinks.length > 0 && (
        <nav className={nav()} aria-label="Footer navigation">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}

      <p className={copyright()}>
        &copy; {year} {title}
      </p>
    </footer>
  );
};
