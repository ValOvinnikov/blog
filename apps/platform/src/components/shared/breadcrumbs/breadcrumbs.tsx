import { Link } from '@platform/i18n/navigation';

import { breadcrumbsVariants } from './breadcrumbs-variants';

export type TBreadcrumbItem = {
  label: string;
  /** Omitted for an ancestor with nowhere to link — rendered as the current, non-clickable label same as the trail's last item. */
  href?: string;
};

export type TBreadcrumbsProps = {
  items: TBreadcrumbItem[];
  ariaLabel: string;
};

/**
 * An ancestor trail: every item but the last — and any item with no `href`
 * — renders as a real link; the last item always renders as the current,
 * non-clickable label regardless of whether it carries an `href`.
 */
export const Breadcrumbs = ({ items, ariaLabel }: TBreadcrumbsProps) => {
  const { root, list, item, sep, link, current } = breadcrumbsVariants();

  return (
    <nav aria-label={ariaLabel} className={root()}>
      <ol className={list()}>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={crumb.label} className={item()}>
              {index > 0 && (
                <span aria-hidden="true" className={sep()}>
                  ›
                </span>
              )}
              {isLast || !crumb.href ? (
                <span
                  className={current()}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className={link()}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
