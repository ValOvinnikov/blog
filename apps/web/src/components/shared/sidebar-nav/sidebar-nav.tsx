'use client';

import { ICONS, type TMaybeUndefined } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { SmartLink } from '@web/components/shared/smart-link';
import { usePopover } from '@web/hooks/use-popover';
import { useId } from 'react';

import { sidebarNavVariants } from './sidebar-nav-variants';

export type TSidebarNavItem = {
  label: string;
  href: string;
  level: 1 | 2;
};

type TSidebarNavBackLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

type TSidebarNavProps = {
  items: TSidebarNavItem[];
  activeKey: TMaybeUndefined<string>;
  label: string;
  ariaCurrent: 'location' | 'page';
  backLink?: TSidebarNavBackLink;
  className?: string;
};

const s = sidebarNavVariants();

/** Matches `activeKey` against each item's `href`. */
export const SidebarNav = ({
  items,
  activeKey,
  label,
  ariaCurrent,
  backLink,
  className,
}: TSidebarNavProps) => {
  const labelId = useId();
  const mobileLabelId = useId();
  const currentItemId = useId();
  const panelId = useId();
  // Plain navigation, not a command menu: no Tab trap, and the panel closes once focus leaves it.
  const { open, toggle, close, triggerRef, panelRef } = usePopover({
    trapFocus: false,
    closeOnFocusOut: true,
  });
  const activeItem = items.find(({ href }) => href === activeKey);

  const renderBackLink = (onNavigate?: () => void) =>
    backLink && (
      <SmartLink
        href={backLink.href}
        className={s.backLink()}
        aria-label={backLink.ariaLabel}
        onClick={onNavigate}
      >
        <Icon name={ICONS.ARROW} className={s.backArrow()} />
        {backLink.label}
      </SmartLink>
    );

  // A click leaves focus on the link, so `closeOnFocusOut` never fires and `onNavigate` closes the panel instead.
  const renderList = (onNavigate?: () => void, inPanel = false) => (
    <ol className={s.list({ inPanel })}>
      {items.map((item) => {
        const isActive = item === activeItem;
        const isNested = item.level === 2;

        return (
          <li key={item.href}>
            <SmartLink
              href={item.href}
              className={s.link({ isActive, isNested, inPanel })}
              aria-current={isActive ? ariaCurrent : undefined}
              onClick={onNavigate}
            >
              {item.label}
            </SmartLink>
          </li>
        );
      })}
    </ol>
  );

  return (
    <nav aria-labelledby={labelId} className={s.root({ class: className })}>
      <div className={s.desktop()}>
        {renderBackLink()}
        <h2 id={labelId} className={s.title()}>
          {label}
        </h2>
        {renderList()}
      </div>

      <div className={s.mobile()}>
        <div className={s.selectorRow()}>
          <span id={mobileLabelId} className={s.mobileLabel()}>
            {label}
          </span>
          <button
            ref={triggerRef}
            type="button"
            className={s.toggle()}
            aria-expanded={open}
            aria-controls={panelId}
            aria-labelledby={`${mobileLabelId} ${currentItemId}`}
            onClick={toggle}
          >
            <span id={currentItemId} className={s.toggleLabel()}>
              {activeItem?.label}
            </span>
            <span aria-hidden="true" className={s.chevron({ open })} />
          </button>
        </div>
        <div ref={panelRef} id={panelId} hidden={!open} className={s.panel()}>
          {renderBackLink(close)}
          <h2 className={s.title()}>{label}</h2>
          {renderList(close, true)}
        </div>
      </div>
    </nav>
  );
};
