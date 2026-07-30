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
 * `lg:` and up, and a closed-by-default disclosure below it. The disclosure
 * reuses `usePopover`'s open/close/Escape/outside-click core — the same
 * composition `PostShare` uses for its own trigger + panel — but opts out of
 * its Tab-trap/Arrow-roving-focus behaviour (`trapFocus: false`): unlike
 * `PostShare`'s command-style share menu, this is plain in-page navigation,
 * so both presentations stay ordinary `<nav>`/`<ol>`/`<li>`/link markup with
 * no role overrides, and Tab moves through the panel's links in normal
 * document order and on into the page afterward. Active-section highlighting
 * comes from `useActiveHeadingId`, which observes the heading elements
 * `PortableTextRenderer` rendered elsewhere on the page under these same
 * `id`s.
 */
export const PostContentsRail = ({
  headings,
  className,
}: TPostContentsRailProps) => {
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover({
    trapFocus: false,
  });
  const activeId = useActiveHeadingId(headings.map((heading) => heading.id));

  const renderList = () => (
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
      <div className={s.desktop()}>{renderList()}</div>

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
        <div ref={panelRef} id={panelId} hidden={!open} className={s.panel()}>
          {renderList()}
        </div>
      </div>
    </nav>
  );
};
