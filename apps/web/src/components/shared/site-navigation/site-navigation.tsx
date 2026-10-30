'use client';

import type { THeaderLayout, THeaderSubmenuStyle } from '@blog/config';
import type { TNavigationItem } from '@blog/service';
import {
  type INavItem,
  PrimaryNavigation,
} from '@blog/ui/components/molecules/primary-navigation';
import {
  AccountMenuGroup,
  type TAccountMenuGroupProps,
} from '@web/components/shared/auth-menu';
import { SmartLink } from '@web/components/shared/smart-link';
import { HeaderOverlayParent } from '@web/context/header-overlay-provider';
import { useMobileNavToggle } from '@web/hooks/use-mobile-nav-toggle';
import { usePublicPathname } from '@web/hooks/use-public-pathname';
import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useId, type ReactNode } from 'react';

import { siteNavigationVariants } from './site-navigation-variants';

type TSiteNavigationProps = {
  links: TNavigationItem[];
  layout?: THeaderLayout;
  submenuStyle?: THeaderSubmenuStyle;
  actions?: ReactNode;
  panelActions?: ReactNode;
  menuAccount?: Omit<TAccountMenuGroupProps, 'groupName'>;
};

const isNavItemActive = (pathname: string, href: string): boolean => {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

const toNavItem = (
  pathname: string,
  { subItems, ...link }: TNavigationItem,
): INavItem => {
  const navSubItems = subItems?.map((subItem) => ({
    ...subItem,
    isActive: isNavItemActive(pathname, subItem.href),
  }));

  return {
    ...link,
    isActive:
      isNavItemActive(pathname, link.href) ||
      Boolean(navSubItems?.some((subItem) => subItem.isActive)),
    subItems: navSubItems,
  };
};

export const SiteNavigation = ({
  links,
  layout,
  submenuStyle,
  actions,
  panelActions,
  menuAccount,
}: TSiteNavigationProps) => {
  const t = useTranslations('siteNavigation');
  const pathname = usePublicPathname();
  const panelId = useId();
  const groupName = useId();
  const { open, toggle, close, containerRef } = useMobileNavToggle(panelId);

  const closeMenusLeftOpenByNavigation = useEffectEvent(() => {
    containerRef.current
      ?.querySelectorAll<HTMLElement>('[popover]')
      .forEach((popover) => popover.hidePopover());
    containerRef.current
      ?.querySelectorAll<HTMLDetailsElement>('details[open]')
      .forEach((details) => (details.open = false));
    if (open) close();
  });

  useEffect(() => {
    closeMenusLeftOpenByNavigation();
  }, [pathname]);

  const items = links.map((link) => toNavItem(pathname, link));

  return (
    <div ref={containerRef} className={siteNavigationVariants()}>
      <PrimaryNavigation
        links={items}
        layout={layout}
        submenuStyle={submenuStyle}
        groupName={groupName}
        linkAs={SmartLink}
        mobileToggle={{
          isOpen: open,
          onToggle: toggle,
          ariaLabel: t('toggleMenu'),
          panelId,
        }}
      >
        {panelActions ? (
          <PrimaryNavigation.PanelActions>
            <HeaderOverlayParent id={panelId}>
              {panelActions}
            </HeaderOverlayParent>
          </PrimaryNavigation.PanelActions>
        ) : null}
        {actions ? (
          <PrimaryNavigation.Actions>{actions}</PrimaryNavigation.Actions>
        ) : null}
        {menuAccount && (
          <PrimaryNavigation.DrawerActions>
            <HeaderOverlayParent id={panelId}>
              <AccountMenuGroup {...menuAccount} groupName={groupName} />
            </HeaderOverlayParent>
          </PrimaryNavigation.DrawerActions>
        )}
      </PrimaryNavigation>
    </div>
  );
};
