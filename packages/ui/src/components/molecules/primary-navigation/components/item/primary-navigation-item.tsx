import type { TAnchorElementType } from '@blog/config/react';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { PrimaryNavigationPanelGroup } from '@blog/ui/components/molecules/primary-navigation/components/panel-group/primary-navigation-panel-group';
import {
  PrimaryNavigationSubmenu,
  type TPrimaryNavigationSubmenuProps,
} from '@blog/ui/components/molecules/primary-navigation/components/submenu/primary-navigation-submenu';
import type { INavItem } from '@blog/ui/components/molecules/primary-navigation/primary-navigation';

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

  if (subItems?.length && panel) {
    return (
      <PrimaryNavigationPanelGroup
        item={item}
        groupName={panel.groupName}
        linkAs={linkAs}
      />
    );
  }
  if (subItems?.length) {
    return (
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
      className={panel?.linkClassName}
    >
      {label}
    </TextLink>
  );
};
