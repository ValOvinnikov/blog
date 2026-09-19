import {
  ICONS,
  type IWithClassName,
  type IWithDataTestId,
  SIZE,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';
import { NavLink } from '@blog/ui/atoms/nav-link';
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
    ariaLabel?: string;
    linkAs?: TAnchorElementType;
    mobileToggle?: TPrimaryNavigationMobileToggleProps;
  };

/** Top-level `<nav>` landmark composing `NavLink` items with an optional trailing `actions` slot (e.g. a theme toggle or menu button). */
export const PrimaryNavigation = ({
  links,
  actions,
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
  } = primaryNavigationVariants({ collapsible: Boolean(mobileToggle) });

  const renderLinks = (itemClassName?: string) =>
    links.map(({ href, label, isActive, target }) => (
      <NavLink
        key={href}
        as={linkAs}
        href={href}
        isActive={isActive}
        target={target}
        className={itemClassName}
      >
        {label}
      </NavLink>
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
      {actions}
      {mobileToggle && (
        <Fragment>
          <IconButton
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
          </div>
        </Fragment>
      )}
    </nav>
  );
};
