import { ICONS, SIZE } from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { IconButton } from '@shinefold/ui/components/atoms/icon-button';
import {
  PrimaryNavigationAction,
  type TPrimaryNavigationAction,
} from '@shinefold/ui/components/molecules/primary-navigation/components/action/primary-navigation-action';
import type { TPrimaryNavigationMobileToggleProps } from '@shinefold/ui/components/molecules/primary-navigation/primary-navigation';
import type { ReactNode } from 'react';

import {
  primaryNavigationControlsVariants,
  type TPrimaryNavigationControlsVariants,
} from './primary-navigation-controls-variants';

export type TPrimaryNavigationControlsProps = {
  layout?: TPrimaryNavigationControlsVariants['layout'];
  linkAs?: TAnchorElementType;
  action?: TPrimaryNavigationAction;
  hasActionInMenu: boolean;
  mobileToggle?: TPrimaryNavigationMobileToggleProps;
  panelActions?: ReactNode;
  actions?: ReactNode;
};

export const PrimaryNavigationControls = ({
  layout,
  linkAs,
  action,
  hasActionInMenu,
  mobileToggle,
  panelActions,
  actions,
}: TPrimaryNavigationControlsProps) => {
  const { controls, toggle, barPanelActions, barAction } =
    primaryNavigationControlsVariants({
      collapsible: Boolean(mobileToggle),
      hasActionInMenu,
      layout,
    });

  if (!panelActions && !actions && !action && !mobileToggle) {
    return null;
  }

  return (
    <div className={controls()}>
      {panelActions && <div className={barPanelActions()}>{panelActions}</div>}
      {actions}
      {action && (
        <PrimaryNavigationAction
          action={action}
          linkAs={linkAs}
          className={barAction()}
        />
      )}
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
  );
};
