'use client';

import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import { Link, usePathname } from '@platform/i18n/navigation';
import { isCurrentNavHref } from '@platform/utils/nav-sections/is-current-nav-href';
import type { ReactNode } from 'react';

export type TSidebarNavLinkProps = {
  href: string;
  title: string;
  children: ReactNode;
};

// The client boundary for the active state; `Sidebar` and its inert rows stay Server Components.
export const SidebarNavLink = ({
  href,
  title,
  children,
}: TSidebarNavLinkProps) => {
  const pathname = usePathname();
  const isActive = isCurrentNavHref(href, pathname);
  const { row } = sidebarVariants();

  return (
    <Link
      href={href}
      title={title}
      aria-current={isActive ? 'page' : undefined}
      className={row({ state: isActive ? 'active' : 'resting' })}
    >
      {children}
    </Link>
  );
};
