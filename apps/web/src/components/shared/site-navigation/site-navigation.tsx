'use client';

import type {
  ILink,
  THeaderBarStyle,
  THeaderLayout,
  THeaderSubmenuStyle,
} from '@blog/config';
import { PrimaryNavigation } from '@blog/ui/components/molecules/primary-navigation';
import { SmartLink } from '@web/components/shared/smart-link';
import { NavPanelGroupProvider } from '@web/context/nav-panel-group-provider';
import { useHideOpenPopovers } from '@web/hooks/use-hide-open-popovers';
import { useMobileNavToggle } from '@web/hooks/use-mobile-nav-toggle';
import { usePublicPathname } from '@web/hooks/use-public-pathname';
import { useTranslations } from 'next-intl';
import { useEffect, useId, type ReactNode } from 'react';

import { siteNavigationVariants } from './site-navigation-variants';

type TSiteNavigationLink = ILink & { subItems?: ILink[] };

type TSiteNavigationProps = {
  links: TSiteNavigationLink[];
  layout?: THeaderLayout;
  submenuStyle?: THeaderSubmenuStyle;
  barStyle?: THeaderBarStyle;
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

const toNavItem = (pathname: string, link: TSiteNavigationLink) => {
  const subItems = link.subItems?.map((subItem) => ({
    ...subItem,
    isActive: isNavItemActive(pathname, subItem.href),
  }));

  return {
    ...link,
    subItems,
    isActive:
      isNavItemActive(pathname, link.href) ||
      Boolean(subItems?.some((subItem) => subItem.isActive)),
  };
};

export const SiteNavigation = ({
  links,
  layout,
  submenuStyle,
  barStyle,
  actions,
  panelActions,
  drawerActions,
}: TSiteNavigationProps) => {
  const t = useTranslations('siteNavigation');
  const pathname = usePublicPathname();
  const panelId = useId();
  const panelGroupName = useId();
  const { open, toggle, close, containerRef } = useMobileNavToggle(panelId);
  useHideOpenPopovers(containerRef, pathname);

  useEffect(() => {
    if (!open) return;

    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close only when the route actually changes, not whenever `open`/`close` are redefined
  }, [pathname]);

  const items = links.map((link) => toNavItem(pathname, link));

  return (
    <div ref={containerRef} className={siteNavigationVariants()}>
      <NavPanelGroupProvider groupName={panelGroupName}>
        <PrimaryNavigation
          links={items}
          layout={layout}
          submenuStyle={submenuStyle}
          barStyle={barStyle}
          panelGroupName={panelGroupName}
          linkAs={SmartLink}
          mobileToggle={{
            isOpen: open,
            onToggle: toggle,
            ariaLabel: t('toggleMenu'),
            panelId,
          }}
        >
          {Boolean(panelActions) && (
            <PrimaryNavigation.PanelActions>
              {panelActions}
            </PrimaryNavigation.PanelActions>
          )}
          {Boolean(actions) && (
            <PrimaryNavigation.Actions>{actions}</PrimaryNavigation.Actions>
          )}
          {Boolean(drawerActions) && (
            <PrimaryNavigation.DrawerActions>
              {drawerActions}
            </PrimaryNavigation.DrawerActions>
          )}
        </PrimaryNavigation>
      </NavPanelGroupProvider>
    </div>
  );
};
