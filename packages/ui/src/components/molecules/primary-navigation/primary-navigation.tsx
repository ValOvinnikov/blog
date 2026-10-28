import {
  ICONS,
  type IWithClassName,
  type IWithDataTestId,
  SIZE,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { type ReactNode, useId } from 'react';

import {
  PrimaryNavigationItem,
  type TPrimaryNavigationItemProps,
} from './components/item/primary-navigation-item';
import {
  primaryNavigationVariants,
  type TPrimaryNavigationVariants,
} from './primary-navigation-variants';

export type { TAnchorElementType };

export interface INavItem {
  href: string;
  label: string;
  isActive?: boolean;
  target?: '_blank';
  subItems?: INavItem[];
}

export type TPrimaryNavigationMobileToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
  ariaLabel: string;
  panelId: string;
};

export type TPrimaryNavigationProps = IWithClassName &
  IWithDataTestId & {
    links: INavItem[];
    actions?: ReactNode;
    panelActions?: ReactNode;
    drawerActions?: ReactNode;
    ariaLabel?: string;
    linkAs?: TAnchorElementType;
    mobileToggle?: TPrimaryNavigationMobileToggleProps;
    layout?: TPrimaryNavigationVariants['layout'];
    submenuStyle?: TPrimaryNavigationItemProps['submenuStyle'];
  };

/** Top-level `<nav>` landmark whose trailing `actions` stay in the bar, whose `panelActions` move into the mobile panel below `lg`, and whose `drawerActions` exist only in the open mobile panel; a link with `subItems` opens them as a sub-menu in the bar and in place in the panel. */
export const PrimaryNavigation = ({
  links,
  actions,
  panelActions,
  drawerActions,
  ariaLabel = 'Primary',
  className,
  dataTestId,
  linkAs,
  mobileToggle,
  layout,
  submenuStyle,
}: TPrimaryNavigationProps) => {
  const groupName = useId();
  const {
    root,
    links: linksSlot,
    controls,
    toggle,
    panel,
    panelLink,
    barPanelActions,
    panelActionsRow,
    drawerActionsRow,
  } = primaryNavigationVariants({
    collapsible: Boolean(mobileToggle),
    layout,
  });

  return (
    <nav
      aria-label={ariaLabel}
      className={root({ class: className })}
      data-testid={dataTestId}
    >
      <div className={linksSlot()} data-testid="primary-navigation-links">
        {links.map((item) => (
          <PrimaryNavigationItem
            key={item.href}
            item={item}
            linkAs={linkAs}
            submenuStyle={submenuStyle}
          />
        ))}
      </div>
      {(panelActions || actions || mobileToggle) && (
        <div className={controls()}>
          {panelActions && (
            <div className={barPanelActions()}>{panelActions}</div>
          )}
          {actions}
          {mobileToggle && (
            <IconButton
              variant="circle"
              ariaLabel={mobileToggle.ariaLabel}
              title={mobileToggle.ariaLabel}
              aria-expanded={mobileToggle.isOpen}
              aria-controls={mobileToggle.panelId}
              onClick={mobileToggle.onToggle}
              className={toggle()}
            >
              <Icon
                name={mobileToggle.isOpen ? ICONS.CLOSE : ICONS.MENU}
                size={SIZE.MD}
              />
            </IconButton>
          )}
        </div>
      )}
      {mobileToggle && (
        <div
          id={mobileToggle.panelId}
          hidden={!mobileToggle.isOpen}
          className={panel()}
          data-testid="primary-navigation-mobile-panel"
        >
          {links.map((item) => (
            <PrimaryNavigationItem
              key={item.href}
              item={item}
              linkAs={linkAs}
              panel={{ groupName, linkClassName: panelLink() }}
            />
          ))}
          {panelActions && mobileToggle.isOpen && (
            <div
              className={panelActionsRow()}
              data-testid="primary-navigation-panel-actions"
            >
              {panelActions}
            </div>
          )}
          {drawerActions && mobileToggle.isOpen && (
            <div
              className={drawerActionsRow()}
              data-testid="primary-navigation-drawer-actions"
            >
              {drawerActions}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
