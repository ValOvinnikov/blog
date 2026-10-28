import { HEADER_SUBMENU_STYLE, ICONS, SIZE } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { PrimaryNavigationSubLink } from '@blog/ui/components/molecules/primary-navigation/components/sub-link/primary-navigation-sub-link';
import type { INavItem } from '@blog/ui/components/molecules/primary-navigation/primary-navigation';
import { splitSubItems } from '@blog/ui/components/molecules/primary-navigation/split-sub-items';
import { hasArrayGotItems } from '@blog/utils/primitives';
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

  return (
    <>
      <button
        type="button"
        popoverTarget={panelId}
        aria-controls={panelId}
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
          {lead && (
            <PrimaryNavigationSubLink
              item={lead}
              isLead={true}
              appearance="quiet"
              className={slots.item({ class: slots.lead() })}
              linkAs={linkAs}
            />
          )}
          {lead && hasArrayGotItems(rest) && <hr className={separator()} />}
          <div className={slots.rest()}>
            {rest.map((subItem) => (
              <PrimaryNavigationSubLink
                key={subItem.href}
                item={subItem}
                isLead={false}
                appearance="quiet"
                className={slots.item()}
                linkAs={linkAs}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
