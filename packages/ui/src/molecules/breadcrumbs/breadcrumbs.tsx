import {
  ICONS,
  Size,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/atoms/icon';
import { type ElementType } from 'react';

import { breadcrumbsVariants } from './breadcrumbs-variants';

export interface IBreadcrumbItem {
  label: string;
  href: string;
}

export type TBreadcrumbsProps = IWithClassName &
  IWithDataTestId & {
    /** Full trail including the current page as the last item. */
    items: IBreadcrumbItem[];
    /** aria-label for the nav — passed in (i18n), never hardcoded in @blog/ui. */
    ariaLabel: string;
    /** Component each link renders as — pass the app router's Link for client-side navigation. Defaults to a plain `<a>`. */
    linkAs?: TAnchorElementType;
  };

const s = breadcrumbsVariants();

/**
 * Breadcrumbs — page-chrome navigation trail (e.g. `Home › Category ›
 * Post title`). Every item except the last renders as a link; the last item
 * is the current page, rendered as plain text with `aria-current="page"`.
 * The trail stays on a single line at every viewport width; earlier items
 * never shrink, and only the last (current) item truncates with an ellipsis
 * when the full trail doesn't fit — its complete text stays in the DOM (and
 * as its `title`) regardless of truncation, so nothing is lost for
 * assistive tech or sighted hover users.
 * The first item renders a decorative House icon in place of its visible
 * label text — the label itself stays in the DOM as visually-hidden text so
 * the item keeps a real accessible name for assistive tech, and is also set
 * as a `title` attribute so sighted mouse users get a hover tooltip (same
 * convention as other icon-only interactive elements in this library, e.g.
 * `ThemeToggle`). This `title` is applied on whichever element the first
 * item renders as, so a single-item trail (first item also current) is
 * covered too. Separators are decorative CSS `::before` pseudo-elements,
 * kept out of the a11y tree. Pure and independent of page content — render
 * it as a sibling above the content organism, never nested inside one.
 */
export const Breadcrumbs = ({
  items,
  ariaLabel,
  linkAs,
  className,
  dataTestId,
}: TBreadcrumbsProps) => {
  const LinkComponent = (linkAs ?? 'a') as ElementType;
  const lastIndex = items.length - 1;

  return (
    <nav aria-label={ariaLabel} className={className} data-testid={dataTestId}>
      <ol className={s.list()}>
        {items.map(({ label, href }, index) => {
          const isCurrent = index === lastIndex;
          const isFirst = index === 0;
          const content = isFirst ? (
            <>
              <Icon name={ICONS.HOUSE} size={Size.SM} />
              <span className={s.homeLabel()}>{label}</span>
            </>
          ) : (
            label
          );

          const title = isFirst || isCurrent ? label : undefined;

          return (
            <li key={href} className={s.item({ isCurrent })}>
              {isCurrent ? (
                <span className={s.current()} aria-current="page" title={title}>
                  {content}
                </span>
              ) : (
                <LinkComponent href={href} className={s.link()} title={title}>
                  {content}
                </LinkComponent>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
