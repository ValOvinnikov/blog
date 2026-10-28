import type { TAnchorElementType } from '@blog/config/react';
import { PrimaryNavigationItem } from '@blog/ui/components/molecules/primary-navigation/components/item/primary-navigation-item';
import type { INavItem } from '@blog/ui/components/molecules/primary-navigation/primary-navigation';
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
  panelActions,
  drawerActions,
}: TPrimaryNavigationMobilePanelProps) => {
  const ownGroupName = useId();
  const { panel, link, panelActionsRow, drawerActionsRow } =
    primaryNavigationMobilePanelVariants({ layout });

  return (
    <div
      id={panelId}
      hidden={!isOpen}
      className={panel()}
      data-testid="primary-navigation-mobile-panel"
    >
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
