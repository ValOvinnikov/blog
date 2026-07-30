'use client';

import { ICONS, Size } from '@blog/config';
import { Icon } from '@blog/ui/atoms';
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
 * PostContentsRail — the "On this page" table of contents for long posts;
 * `BlogPostPage` only renders it once `extractPostHeadings` has returned 3+
 * headings. A single `<nav>` landmark holds two CSS-breakpoint-driven
 * presentations of the same heading list (the `hidden lg:*` / `lg:hidden`
 * pairing established by `PrimaryNavigation`): a sticky left-column rail at
 * `lg:` and up, and a closed-by-default disclosure below it. The mobile
 * disclosure's panel is `position: sticky`-pinned and its expanded state is
 * an opaque overlay (it has to be — a push-down panel would expand at the
 * bar's DOM position, not its pinned visual position). The disclosure
 * reuses `usePopover`'s open/close/Escape/outside-click core — the same
 * composition `PostShare` uses for its own trigger + panel — but opts out of
 * its Tab-trap/Arrow-roving-focus behaviour (`trapFocus: false`): unlike
 * `PostShare`'s command-style share menu, this is plain in-page navigation,
 * so both presentations stay ordinary `<nav>`/`<ol>`/`<li>`/link markup with
 * no role overrides, and Tab moves through the panel's links in normal
 * document order and on into the page afterward. It also opts in to
 * `closeOnFocusOut: true`: since the panel is an opaque overlay and Tab
 * isn't trapped, leaving it open while focus moves past its last link would
 * strand a keyboard user's focus indicator on content hidden underneath the
 * still-open panel — `closeOnFocusOut` closes it the moment focus genuinely
 * leaves, without fighting the Tab that's already carrying focus onward.
 * Active-section highlighting comes from `useActiveHeadingId`, which observes
 * the heading elements `PortableTextRenderer` rendered elsewhere on the page
 * under these same `id`s. The `postContentsRail.ariaLabel` message ("On this
 * page") is the single source for the visible copy on both presentations —
 * the desktop rail's real `<h2>` label above its list and the mobile
 * disclosure's toggle text — as well as the `<nav>` landmark's name, which
 * derives from that `<h2>` via `aria-labelledby` (the same pattern
 * `PostsSection` uses for its own "Related reading" heading). Per the
 * accname spec, an element directly referenced by `aria-labelledby` still
 * contributes to the accessible name even while hidden by `hidden lg:block`'s
 * mobile-width `display:none`, so the `<nav>` stays correctly named at every
 * viewport.
 */
export const PostContentsRail = ({
  headings,
  className,
}: TPostContentsRailProps) => {
  const t = useTranslations('postContentsRail');
  const labelId = useId();
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover({
    trapFocus: false,
    closeOnFocusOut: true,
  });
  const activeId = useActiveHeadingId(headings.map((heading) => heading.id));
  const label = t('ariaLabel');

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
    <nav aria-labelledby={labelId} className={s.root({ class: className })}>
      <div className={s.desktop()}>
        <h2 id={labelId} className={s.desktopLabel()}>
          {label}
        </h2>
        {renderList()}
      </div>

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
          <span className={s.toggleLabel()}>{label}</span>
          <span aria-hidden="true" className={s.chevron({ open })} />
        </button>
        <div ref={panelRef} id={panelId} hidden={!open} className={s.panel()}>
          {renderList()}
        </div>
      </div>
    </nav>
  );
};
