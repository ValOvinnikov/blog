'use client';

import { Link, usePathname } from '@platform/i18n/navigation';
import type { ReactNode } from 'react';

import { sidebarVariants } from './sidebar-variants';

export type TSidebarNavLinkProps = {
  href: string;
  children: ReactNode;
};

/**
 * A client boundary: matches `href` against the current route to decide the
 * active state. `Sidebar` itself, and every inert row it renders, stay
 * server components.
 */
export const SidebarNavLink = ({ href, children }: TSidebarNavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const { row } = sidebarVariants();

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={row({ state: isActive ? 'active' : 'resting' })}
    >
      {children}
    </Link>
  );
};
