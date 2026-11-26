import {
  HEADER_ACTION_PHONE_PLACEMENT,
  type IWithClassName,
  type IWithDataTestId,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@shinefold/ui/lib/react';
import { type ElementType, Fragment } from 'react';

import type { TPrimaryNavigationAction } from './components/action/primary-navigation-action';
import { PrimaryNavigationActions } from './components/actions/primary-navigation-actions';
import { PrimaryNavigationControls } from './components/controls/primary-navigation-controls';
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

export type { TAnchorElementType, TPrimaryNavigationAction };

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
    action?: TPrimaryNavigationAction;
    children?: TCompoundChildren<typeof PrimaryNavigationParts>;
    groupName?: string;
    ariaLabel?: string;
    linkAs?: TAnchorElementType;
    mobileToggle?: TPrimaryNavigationMobileToggleProps;
    layout?: TPrimaryNavigationVariants['layout'];
    submenuStyle?: TPrimaryNavigationItemProps['submenuStyle'];
  };

/** The site's main menu, where readers reach its top-level pages and their sub-pages. */
const PrimaryNavigationRoot = ({
  links,
  action,
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
  const menuAction =
    action?.phonePlacement === HEADER_ACTION_PHONE_PLACEMENT.BAR
      ? undefined
      : action;
  const { root, links: linksSlot } = primaryNavigationVariants({
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
      <PrimaryNavigationControls
        layout={layout}
        linkAs={linkAs}
        action={action}
        hasActionInMenu={Boolean(menuAction)}
        mobileToggle={mobileToggle}
        panelActions={slots.PanelActions}
        actions={slots.Actions}
      />
      {mobileToggle && (
        <PrimaryNavigationMobilePanel
          links={links}
          panelId={mobileToggle.panelId}
          isOpen={mobileToggle.isOpen}
          groupName={groupName}
          layout={layout}
          linkAs={linkAs}
          action={menuAction}
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
