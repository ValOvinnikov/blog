import type { TAnchorElementType } from '@shinefold/config/react';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { PrimaryNavigationPanelGroup } from '@shinefold/ui/components/molecules/primary-navigation/components/panel-group/primary-navigation-panel-group';
import {
  PrimaryNavigationSubmenu,
  type TPrimaryNavigationSubmenuProps,
} from '@shinefold/ui/components/molecules/primary-navigation/components/submenu/primary-navigation-submenu';
import type { INavItem } from '@shinefold/ui/components/molecules/primary-navigation/primary-navigation';
import { NAV_LINK } from '@shinefold/ui/lib/styling';
import { hasArrayGotItems } from '@shinefold/utils/primitives';

export type TPrimaryNavigationItemProps = {
  item: INavItem;
  linkAs?: TAnchorElementType;
  submenuStyle?: TPrimaryNavigationSubmenuProps['submenuStyle'];
  panel?: { groupName: string; linkClassName: string };
};

export const PrimaryNavigationItem = ({
  item,
  linkAs,
  submenuStyle,
  panel,
}: TPrimaryNavigationItemProps) => {
  const { href, label, isActive, target, subItems } = item;

  if (hasArrayGotItems(subItems)) {
    return panel ? (
      <PrimaryNavigationPanelGroup
        item={item}
        groupName={panel.groupName}
        linkAs={linkAs}
      />
    ) : (
      <PrimaryNavigationSubmenu
        item={item}
        submenuStyle={submenuStyle}
        linkAs={linkAs}
      />
    );
  }

  return (
    <TextLink
      appearance="nav"
      as={linkAs}
      href={href}
      isCurrent={isActive}
      currentStyle="weight"
      target={target}
      className={panel ? panel.linkClassName : NAV_LINK}
    >
      {label}
    </TextLink>
  );
};
