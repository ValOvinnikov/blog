import type { TAnchorElementType } from '@shinefold/config/react';
import {
  PrimaryNavigationAction,
  type TPrimaryNavigationAction,
} from '@shinefold/ui/components/molecules/primary-navigation/components/action/primary-navigation-action';
import { PrimaryNavigationItem } from '@shinefold/ui/components/molecules/primary-navigation/components/item/primary-navigation-item';
import type { INavItem } from '@shinefold/ui/components/molecules/primary-navigation/primary-navigation';
import { type ReactNode, useId } from 'react';

import {
  primaryNavigationMobilePanelVariants,
  type TPrimaryNavigationMobilePanelVariants,
} from './primary-navigation-mobile-panel-variants';

export type TPrimaryNavigationMobilePanelProps = {
  links: INavItem[];
  panelId: string;
  isOpen: boolean;
  groupName?: string;
  layout?: TPrimaryNavigationMobilePanelVariants['layout'];
  linkAs?: TAnchorElementType;
  action?: TPrimaryNavigationAction;
  panelActions?: ReactNode;
  drawerActions?: ReactNode;
};

export const PrimaryNavigationMobilePanel = ({
  links,
  panelId,
  isOpen,
  groupName,
  layout,
  linkAs,
  action,
  panelActions,
  drawerActions,
}: TPrimaryNavigationMobilePanelProps) => {
  const ownGroupName = useId();
  const {
    panel,
    link,
    action: actionSlot,
    panelActionsRow,
    drawerActionsRow,
  } = primaryNavigationMobilePanelVariants({ layout });

  return (
    <div
      id={panelId}
      hidden={!isOpen}
      className={panel()}
      data-testid="primary-navigation-mobile-panel"
    >
      {action && isOpen && (
        <PrimaryNavigationAction
          action={action}
          linkAs={linkAs}
          isInPanel={true}
          className={actionSlot()}
        />
      )}
      {links.map((item) => (
        <PrimaryNavigationItem
          key={item.href}
          item={item}
          linkAs={linkAs}
          panel={{
            groupName: groupName ?? ownGroupName,
            linkClassName: link(),
          }}
        />
      ))}
      {panelActions && isOpen && (
        <div
          className={panelActionsRow()}
          data-testid="primary-navigation-panel-actions"
        >
          {panelActions}
        </div>
      )}
      {drawerActions && isOpen && (
        <div
          className={drawerActionsRow()}
          data-testid="primary-navigation-drawer-actions"
        >
          {drawerActions}
        </div>
      )}
    </div>
  );
};
