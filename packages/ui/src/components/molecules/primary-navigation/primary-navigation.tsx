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
import { type ElementType, Fragment } from 'react';

import { PrimaryNavigationActions } from './components/actions/primary-navigation-actions';
import { PrimaryNavigationDrawerActions } from './components/drawer-actions/primary-navigation-drawer-actions';
import {
  PrimaryNavigationItem,
  type TPrimaryNavigationItemProps,
} from './components/item/primary-navigation-item';
import { PrimaryNavigationMobilePanel } from './components/mobile-panel/primary-navigation-mobile-panel';
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
    children?: TCompoundChildren<typeof PrimaryNavigationParts>;
    groupName?: string;
    ariaLabel?: string;
    linkAs?: TAnchorElementType;
    mobileToggle?: TPrimaryNavigationMobileToggleProps;
    layout?: TPrimaryNavigationVariants['layout'];
    submenuStyle?: TPrimaryNavigationItemProps['submenuStyle'];
  };

/** Top-level `<nav>` landmark; a link with `subItems` opens them as a sub-menu in the bar and in place in the phone menu, where only one `groupName` disclosure is open at a time. */
const PrimaryNavigationRoot = ({
  links,
  children,
  groupName,
  ariaLabel = 'Primary',
  className,
  dataTestId,
  linkAs,
  mobileToggle,
  layout,
  submenuStyle,
}: TPrimaryNavigationProps) => {
  const { slots, unmatched } = mapCompoundSlots(
    children,
    PrimaryNavigationParts,
  );
  const {
    root,
    links: linksSlot,
    controls,
    toggle,
    barPanelActions,
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
        <PrimaryNavigationMobilePanel
          links={links}
          panelId={mobileToggle.panelId}
          isOpen={mobileToggle.isOpen}
          groupName={groupName}
          layout={layout}
          linkAs={linkAs}
          panelActions={slots.PanelActions}
          drawerActions={slots.DrawerActions}
        />
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
