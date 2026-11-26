'use client';

import type { IWithClassName, TMaybeUndefined } from '@shinefold/config';
import { SidebarNavBackLink } from '@web/components/shared/sidebar-nav/components/sidebar-nav-back-link/sidebar-nav-back-link';
import { SidebarNavList } from '@web/components/shared/sidebar-nav/components/sidebar-nav-list/sidebar-nav-list';
import { usePopover } from '@web/hooks/use-popover';
import { useId } from 'react';

import { sidebarNavVariants } from './sidebar-nav-variants';
import type {
  TSidebarNavAriaCurrent,
  TSidebarNavBackLink,
  TSidebarNavItem,
} from './types';

interface ISidebarNavProps extends IWithClassName {
  items: TSidebarNavItem[];
  activeHref: TMaybeUndefined<string>;
  label: string;
  ariaCurrent: TSidebarNavAriaCurrent;
  backLink?: TSidebarNavBackLink;
  hasRootItem?: boolean;
}

const s = sidebarNavVariants();

export const SidebarNav = ({
  items,
  activeHref,
  label,
  ariaCurrent,
  backLink,
  hasRootItem = false,
  className,
}: ISidebarNavProps) => {
  const labelId = useId();
  const mobileLabelId = useId();
  const currentItemId = useId();
  const panelId = useId();
  // Plain navigation, not a command menu: no Tab trap, and the panel closes once focus leaves it.
  const { open, toggle, close, triggerRef, panelRef } = usePopover({
    trapFocus: false,
    closeOnFocusOut: true,
  });
  const activeItem = items
    .flatMap((item) => [item, ...(item.subItems ?? [])])
    .find(({ href }) => href === activeHref);

  return (
    <nav aria-labelledby={labelId} className={s.root({ class: className })}>
      <div className={s.desktop()}>
        {backLink && <SidebarNavBackLink backLink={backLink} />}
        <h2 id={labelId} className={s.title()}>
          {label}
        </h2>
        <SidebarNavList
          items={items}
          activeItem={activeItem}
          ariaCurrent={ariaCurrent}
          hasRootItem={hasRootItem}
        />
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
          {/* A click leaves focus on the link, so `closeOnFocusOut` never fires and `onNavigate` closes the panel instead. */}
          {backLink && (
            <SidebarNavBackLink backLink={backLink} onNavigate={close} />
          )}
          <h2 className={s.title()}>{label}</h2>
          <SidebarNavList
            items={items}
            activeItem={activeItem}
            ariaCurrent={ariaCurrent}
            hasRootItem={hasRootItem}
            isInPanel={true}
            onNavigate={close}
          />
        </div>
      </div>
    </nav>
  );
};
