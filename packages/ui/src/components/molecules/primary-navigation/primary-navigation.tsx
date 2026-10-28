import {
  ICONS,
  type IWithClassName,
  type IWithDataTestId,
  SIZE,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType, useId } from 'react';

import { PrimaryNavigationActions } from './components/actions/primary-navigation-actions';
import { PrimaryNavigationDrawerActions } from './components/drawer-actions/primary-navigation-drawer-actions';
import {
  PrimaryNavigationItem,
  type TPrimaryNavigationItemProps,
} from './components/item/primary-navigation-item';
import { PrimaryNavigationPanelActions } from './components/panel-actions/primary-navigation-panel-actions';
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

const PrimaryNavigationParts = {
  Actions: PrimaryNavigationActions,
  PanelActions: PrimaryNavigationPanelActions,
  DrawerActions: PrimaryNavigationDrawerActions,
} satisfies Record<string, ElementType>;

export type TPrimaryNavigationProps = IWithClassName &
  IWithDataTestId & {
    links: INavItem[];
    ariaLabel?: string;
    linkAs?: TAnchorElementType;
    mobileToggle?: TPrimaryNavigationMobileToggleProps;
    layout?: TPrimaryNavigationVariants['layout'];
    submenuStyle?: TPrimaryNavigationItemProps['submenuStyle'];
    barStyle?: TPrimaryNavigationVariants['barStyle'];
    panelGroupName?: string;
    children?: TCompoundChildren<typeof PrimaryNavigationParts>;
  };

/** Top-level `<nav>` landmark whose `Actions` slot stays in the bar, whose `PanelActions` slot moves into the mobile panel below `lg`, and whose `DrawerActions` slot exists only in the open mobile panel; a link with `subItems` opens them as a sub-menu in the bar and in place in the panel. */
const PrimaryNavigationRoot = ({
  links,
  children,
  ariaLabel = 'Primary',
  className,
  dataTestId,
  linkAs,
  mobileToggle,
  layout,
  submenuStyle,
  barStyle,
  panelGroupName,
}: TPrimaryNavigationProps) => {
  const generatedGroupName = useId();
  const groupName = panelGroupName ?? generatedGroupName;
  const { slots, unmatched } = mapCompoundSlots(
    children,
    PrimaryNavigationParts,
  );
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
    barStyle,
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
      {(slots.PanelActions || slots.Actions || mobileToggle) && (
        <div className={controls()}>
          {slots.PanelActions && (
            <div className={barPanelActions()}>{slots.PanelActions}</div>
          )}
          {slots.Actions}
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
          {slots.PanelActions && mobileToggle.isOpen && (
            <div
              className={panelActionsRow()}
              data-testid="primary-navigation-panel-actions"
            >
              {slots.PanelActions}
            </div>
          )}
          {slots.DrawerActions && mobileToggle.isOpen && (
            <div
              className={drawerActionsRow()}
              data-testid="primary-navigation-drawer-actions"
            >
              {slots.DrawerActions}
            </div>
          )}
        </div>
      )}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </nav>
  );
};

export const PrimaryNavigation: TCompoundComponent<
  typeof PrimaryNavigationRoot,
  typeof PrimaryNavigationParts
> = Object.assign(PrimaryNavigationRoot, PrimaryNavigationParts);
