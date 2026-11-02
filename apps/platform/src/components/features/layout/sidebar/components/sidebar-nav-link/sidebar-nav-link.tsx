'use client';

import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import { Link, usePathname } from '@platform/i18n/navigation';
import { isCurrentNavHref } from '@platform/utils/nav-sections/is-current-nav-href';
import type { ComponentProps } from 'react';

export type TSidebarNavLinkProps = Omit<
  ComponentProps<typeof Link>,
  'className' | 'aria-current'
>;

// The client boundary for the active state; `Sidebar` and its inert rows stay Server Components.
export const SidebarNavLink = ({ href, ...props }: TSidebarNavLinkProps) => {
  const pathname = usePathname();
  const isActive = isCurrentNavHref(href, pathname);
  const { row } = sidebarVariants();

  return (
    <Link
      {...props}
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={row({ state: isActive ? 'active' : 'resting' })}
    />
  );
};
