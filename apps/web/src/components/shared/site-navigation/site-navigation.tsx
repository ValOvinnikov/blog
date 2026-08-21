'use client';

import type { ILink } from '@blog/config';
import { PrimaryNavigation } from '@blog/ui/molecules/primary-navigation';
import { SmartLink } from '@web/components/shared/smart-link';
import { useMobileNavToggle } from '@web/hooks/use-mobile-nav-toggle';
import { usePathname } from '@web/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useId, type ReactNode } from 'react';

import { siteNavigationVariants } from './site-navigation-variants';

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
 * item matching the current route as active, and wires up the mobile
 * hamburger toggle. Open/closed state, focus management, and Escape/
 * outside-click dismissal live in `useMobileNavToggle` — this component only
 * supplies the real accessible name and closes the panel whenever the route
 * changes (so a nav link click never leaves it open on the next page).
 */
export const SiteNavigation = ({ links, actions }: TSiteNavigationProps) => {
  const t = useTranslations('siteNavigation');
  const pathname = usePathname();
  const panelId = useId();
  const { open, toggle, close, containerRef } = useMobileNavToggle(panelId);

  useEffect(() => {
    if (!open) return;

    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close only when the route actually changes, not whenever `open`/`close` are redefined
  }, [pathname]);

  const items = links.map((link) => ({
    ...link,
    isActive: isNavItemActive(pathname, link.href),
  }));

  return (
    <div ref={containerRef} className={siteNavigationVariants()}>
      <PrimaryNavigation
        links={items}
        actions={actions}
        linkAs={SmartLink}
        mobileToggle={{
          isOpen: open,
          onToggle: toggle,
          ariaLabel: t('toggleMenu'),
          panelId,
        }}
      />
    </div>
  );
};
