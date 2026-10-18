import {
  ICONS,
  type IWithClassName,
  type IWithDataTestId,
  SIZE,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { Fragment, type ReactNode } from 'react';

import { primaryNavigationVariants } from './primary-navigation-variants';

export type { TAnchorElementType };

export interface INavItem {
  href: string;
  label: string;
  isActive?: boolean;
  target?: '_blank';
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
  };

/** Top-level `<nav>` landmark whose trailing `actions` stay in the bar, whose `panelActions` move into the mobile panel below `lg`, and whose `drawerActions` exist only in the open mobile panel. */
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
}: TPrimaryNavigationProps) => {
  const {
    root,
    links: linksSlot,
    toggle,
    panel,
    panelLink,
    barPanelActions,
    panelActionsRow,
    drawerActionsRow,
  } = primaryNavigationVariants({ collapsible: Boolean(mobileToggle) });

  const renderLinks = (itemClassName?: string) =>
    links.map(({ href, label, isActive, target }) => (
      <TextLink
        key={href}
        appearance="nav"
        as={linkAs}
        href={href}
        isCurrent={isActive}
        currentStyle="weight"
        target={target}
        className={itemClassName}
      >
        {label}
      </TextLink>
    ));

  return (
    <nav
      aria-label={ariaLabel}
      className={root({ class: className })}
      data-testid={dataTestId}
    >
      <div className={linksSlot()} data-testid="primary-navigation-links">
        {renderLinks()}
      </div>
      {panelActions && <div className={barPanelActions()}>{panelActions}</div>}
      {actions}
      {mobileToggle && (
        <Fragment>
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
          <div
            id={mobileToggle.panelId}
            hidden={!mobileToggle.isOpen}
            className={panel()}
            data-testid="primary-navigation-mobile-panel"
          >
            {renderLinks(panelLink())}
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
        </Fragment>
      )}
    </nav>
  );
};
