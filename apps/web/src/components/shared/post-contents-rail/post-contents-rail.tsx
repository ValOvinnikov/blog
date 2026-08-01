'use client';

import { SmartLink } from '@web/components/shared/smart-link';
import { useActiveHeadingId } from '@web/hooks/use-active-heading-id';
import { usePopover } from '@web/hooks/use-popover';
import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { postContentsRailVariants } from './post-contents-rail-variants';

export type TPostContentsRailProps = {
  headings: TPostHeading[];
  className?: string;
};

const s = postContentsRailVariants();

/**
 * PostContentsRail — the "Topics" table of contents for long posts, rendered
 * by `BlogPostPage` once it has 3+ headings. A sticky rail at `lg:` and up
 * keeps the full list; below `lg:` a bordered selector shows the current
 * topic and opens a closed-by-default disclosure with the full list.
 */
export const PostContentsRail = ({
  headings,
  className,
}: TPostContentsRailProps) => {
  const t = useTranslations('postContentsRail');
  const labelId = useId();
  const mobileLabelId = useId();
  const currentTopicId = useId();
  const panelId = useId();
  // Plain in-page navigation, not a command menu: no Tab trap, and the
  // opaque overlay panel closes as soon as focus moves past it.
  const { open, toggle, close, triggerRef, panelRef } = usePopover({
    trapFocus: false,
    closeOnFocusOut: true,
  });
  const activeId = useActiveHeadingId(headings.map((heading) => heading.id));
  const label = t('label');
  // Falls back to the first heading before the reader has scrolled past any —
  // shared by the selector display and the list highlight so they agree.
  const activeHeadingId = activeId ?? headings[0]?.id;
  const activeHeading = headings.find(
    (heading) => heading.id === activeHeadingId,
  );

  // `onNavigate` closes the mobile panel before the anchor jump — a click
  // leaves focus on the clicked link, so `closeOnFocusOut` never fires.
  const renderList = (onNavigate?: () => void, inPanel = false) => (
    <ol className={s.list({ inPanel })}>
      {headings.map((heading) => {
        const isActive = heading.id === activeHeadingId;

        return (
          <li
            key={heading.id}
            className={s.item({ isSubheading: heading.level === 3 })}
          >
            <SmartLink
              href={`#${heading.id}`}
              className={s.link({ isActive, inPanel })}
              aria-current={isActive ? 'location' : undefined}
              onClick={onNavigate}
            >
              {heading.text}
            </SmartLink>
          </li>
        );
      })}
    </ol>
  );

  return (
    <nav aria-labelledby={labelId} className={s.root({ class: className })}>
      <div className={s.desktop()}>
        <h2 id={labelId} className={s.desktopLabel()}>
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
            aria-labelledby={`${mobileLabelId} ${currentTopicId}`}
            onClick={toggle}
          >
            <span id={currentTopicId} className={s.toggleLabel()}>
              {activeHeading?.text}
            </span>
            <span aria-hidden="true" className={s.chevron({ open })} />
          </button>
        </div>
        <div ref={panelRef} id={panelId} hidden={!open} className={s.panel()}>
          {renderList(close, true)}
        </div>
      </div>
    </nav>
  );
};
