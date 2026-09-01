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
  /** Whether the mobile dropdown panel is currently open — drives `aria-expanded` on the toggle button, the toggle icon, and the panel's visibility. The caller (`apps/web`) owns the open/closed state. */
  isOpen: boolean;
  /** Click handler wired to the toggle button — the caller owns the state transition. */
  onToggle: () => void;
  /** Accessible name for the toggle button — never hardcoded here. */
  ariaLabel: string;
  /** Shared id linking the toggle's `aria-controls` to the dropdown panel's `id`. */
  panelId: string;
};

export type TPrimaryNavigationProps = IWithClassName &
  IWithDataTestId & {
    links: INavItem[];
    actions?: ReactNode;
    ariaLabel?: string;
    /** Component each NavLink renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
    linkAs?: TAnchorElementType;
    /** Enables the responsive mobile toggle + dropdown panel below the `lg` breakpoint: the inline links hide, a hamburger toggle appears, and a dropdown panel holding the same links shows/hides with `isOpen`. Omit to keep links always inline (today's behaviour). */
    mobileToggle?: TPrimaryNavigationMobileToggleProps;
  };

/**
 * PrimaryNavigation — top-level `<nav>` landmark composing `NavLink` items
 * with an optional trailing `actions` slot (e.g. a theme toggle or menu
 * button). Pass `mobileToggle` to collapse the links behind a hamburger
 * toggle + dropdown panel below the `lg` breakpoint — purely presentational,
 * the caller owns the open/closed state.
 */
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
