'use client';

import type { ILink } from '@blog/config';
import { PrimaryNavigation } from '@blog/ui/molecules';
import { SmartLink } from '@web/components/shared/smart-link';
import { usePathname } from '@web/i18n/navigation';
import type { ReactNode } from 'react';

type TSiteNavigationProps = {
  links: ILink[];
  actions?: ReactNode;
};

const isNavItemActive = (pathname: string, href: string): boolean => {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

/**
 * SiteNavigation — client wrapper around `PrimaryNavigation` that marks the
 * item matching the current route as active. Reads the locale-aware
 * pathname (stripped of any locale prefix) via `usePathname` from
 * `@web/i18n/navigation` so it lines up with the plain `href`s served by the
 * navigation service.
 */
export const SiteNavigation = ({ links, actions }: TSiteNavigationProps) => {
  const pathname = usePathname();

  const items = links.map((link) => ({
    ...link,
    isActive: isNavItemActive(pathname, link.href),
  }));

  return (
    <PrimaryNavigation links={items} actions={actions} linkAs={SmartLink} />
  );
};
