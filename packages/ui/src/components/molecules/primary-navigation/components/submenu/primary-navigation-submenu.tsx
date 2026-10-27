import { HEADER_SUBMENU_STYLE, ICONS, SIZE } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import type { INavItem } from '@blog/ui/components/molecules/primary-navigation/primary-navigation';
import { splitSubItems } from '@blog/ui/components/molecules/primary-navigation/split-sub-items';
import { useId } from 'react';

import {
  primaryNavigationSubmenuVariants,
  type TPrimaryNavigationSubmenuVariants,
} from './primary-navigation-submenu-variants';

export type TPrimaryNavigationSubmenuProps = {
  item: INavItem;
  submenuStyle?: TPrimaryNavigationSubmenuVariants['submenuStyle'];
  linkAs?: TAnchorElementType;
};

export const PrimaryNavigationSubmenu = ({
  item,
  submenuStyle,
  linkAs,
}: TPrimaryNavigationSubmenuProps) => {
  const panelId = useId();
  const anchorName = `--submenu${panelId}`;
  const isDropdown = submenuStyle !== HEADER_SUBMENU_STYLE.WIDE_PANEL;
  const { lead, rest } = splitSubItems(item);
  const { trigger, chevron, panel, body, separator, ...slots } =
    primaryNavigationSubmenuVariants({
      isActive: item.isActive,
      submenuStyle,
    });

  const renderLink = (
    { href, label, isActive, target }: INavItem,
    isLead: boolean,
  ) => (
    <TextLink
      key={href}
      appearance="quiet"
      as={linkAs}
      href={href}
      isCurrent={isActive}
      target={target}
      className={slots.item({ class: isLead && slots.lead() })}
    >
      {label}
      {isLead && <Icon name={ICONS.ARROW} size={SIZE.SM} />}
    </TextLink>
  );

  return (
    <>
      <button
        type="button"
        popoverTarget={panelId}
        className={trigger()}
        style={{ anchorName }}
      >
        {item.label}
        <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} className={chevron()} />
      </button>
      <div
        id={panelId}
        popover="auto"
        className={panel()}
        style={isDropdown ? { positionAnchor: anchorName } : undefined}
      >
        <div className={body()}>
          {lead && renderLink(lead, true)}
          {lead && rest.length > 0 && <hr className={separator()} />}
          <div className={slots.rest()}>
            {rest.map((subItem) => renderLink(subItem, false))}
          </div>
        </div>
      </div>
    </>
  );
};
