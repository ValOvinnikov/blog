'use client';

import type { ILink } from '@blog/config';
import { PrimaryNavigation } from '@blog/ui/components/molecules/primary-navigation';
import { SmartLink } from '@web/components/shared/smart-link';
import { useMobileNavToggle } from '@web/hooks/use-mobile-nav-toggle';
import { usePublicPathname } from '@web/hooks/use-public-pathname';
import { useTranslations } from 'next-intl';
import { useEffect, useId, type ReactNode } from 'react';

import { siteNavigationVariants } from './site-navigation-variants';

type TSiteNavigationProps = {
  links: ILink[];
  actions?: ReactNode;
  panelActions?: ReactNode;
  drawerActions?: ReactNode;
};

const isNavItemActive = (pathname: string, href: string): boolean => {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export const SiteNavigation = ({
  links,
  actions,
  panelActions,
  drawerActions,
}: TSiteNavigationProps) => {
  const t = useTranslations('siteNavigation');
  const pathname = usePublicPathname();
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
        panelActions={panelActions}
        drawerActions={drawerActions}
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
