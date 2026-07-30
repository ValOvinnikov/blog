'use client';

import { ICONS, Size } from '@blog/config';
import { Icon } from '@blog/ui/atoms';
import { SmartLink } from '@web/components/shared/smart-link';
import { useActiveHeadingId } from '@web/hooks/use-active-heading-id';
import { usePopover } from '@web/hooks/use-popover';
import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';
import { useId } from 'react';

import { postContentsRailVariants } from './post-contents-rail-variants';

export type TPostContentsRailProps = {
  headings: TPostHeading[];
  className?: string;
};

const s = postContentsRailVariants();

/**
 * PostContentsRail — the "On this page" table of contents for long posts;
 * `BlogPostPage` only renders it once `extractPostHeadings` has returned 3+
 * headings. A single `<nav>` landmark holds two CSS-breakpoint-driven
 * presentations of the same heading list (the `hidden lg:*` / `lg:hidden`
 * pairing established by `PrimaryNavigation`): a sticky left-column rail at
 * `lg:` and up, and a closed-by-default disclosure below it — reusing
 * `usePopover`'s open/close/Escape/outside-click/focus-trap core, the same
 * composition `PostShare` uses for its own trigger + panel. Because that
 * core implements the WAI-ARIA menu pattern (Tab-trapped, Arrow/Home/End
 * roving focus), the mobile panel and its links carry `role="menu"`/
 * `role="menuitem"` — matching `PopoverMenu`'s own pairing — so assistive
 * tech announces the actual keyboard behaviour; the desktop copy is a
 * plain, non-trapped link list and carries neither role. Active-section
 * highlighting comes from `useActiveHeadingId`, which observes the heading
 * elements `PortableTextRenderer` rendered elsewhere on the page under these
 * same `id`s.
 */
export const PostContentsRail = ({
  headings,
  className,
}: TPostContentsRailProps) => {
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover();
  const activeId = useActiveHeadingId(headings.map((heading) => heading.id));

  // The mobile disclosure panel reuses `usePopover`'s WAI-ARIA menu
  // interaction (Tab-trapped, Arrow/Home/End roving focus) — same as
  // `PopoverMenu`, so its panel/items carry the matching `role="menu"`/
  // `role="menuitem"` (see `popover-menu-panel.tsx`/`popover-menu-item.tsx`).
  // Desktop's always-visible sticky column has no such trapped keyboard
  // behaviour, so its copy of the list stays a plain link list.
  const renderList = (asMenu: boolean) => (
    <ol className={s.list()}>
      {headings.map((heading) => {
        const isActive = heading.id === activeId;

        return (
          <li
            key={heading.id}
            className={s.item({ isSubheading: heading.level === 3 })}
          >
            <SmartLink
              href={`#${heading.id}`}
              className={s.link({ isActive })}
              aria-current={isActive ? 'location' : undefined}
              role={asMenu ? 'menuitem' : undefined}
            >
              {heading.text}
            </SmartLink>
          </li>
        );
      })}
    </ol>
  );

  return (
    <nav aria-label="On this page" className={s.root({ class: className })}>
      <div className={s.desktop()}>{renderList(false)}</div>

      <div className={s.mobile()}>
        <button
          ref={triggerRef}
          type="button"
          className={s.toggle()}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
        >
          <Icon name={ICONS.MENU_ROWS} size={Size.SM} />
          <span className={s.toggleLabel()}>On this page</span>
          <span aria-hidden="true" className={s.chevron({ open })} />
        </button>
        <div
          ref={panelRef}
          id={panelId}
          hidden={!open}
          role="menu"
          className={s.panel()}
        >
          {renderList(true)}
        </div>
      </div>
    </nav>
  );
};
