import { hasLength } from '@blog/utils/primitives';
import { Link } from '@platform/i18n/navigation';

import { breadcrumbsVariants } from './breadcrumbs-variants';
import { CrumbLabel } from './components/crumb-label';
import { FullPathMenu } from './components/full-path-menu';

export type TBreadcrumbItem = {
  label: string;
  href?: string;
  isShrinkable?: boolean;
};

export type TBreadcrumbsProps = {
  items: TBreadcrumbItem[];
  ariaLabel: string;
};

const PHONE_VISIBLE_CRUMBS = 2;

const phoneHiddenCrumbs = (items: TBreadcrumbItem[]): TBreadcrumbItem[] => {
  const hidden = items.slice(0, -PHONE_VISIBLE_CRUMBS);

  return hidden.some(({ href }) => href) ? hidden : [];
};

export const Breadcrumbs = ({ items, ariaLabel }: TBreadcrumbsProps) => {
  const { root, list, sep, fullPathItem } = breadcrumbsVariants();
  const hiddenCrumbs = phoneHiddenCrumbs(items);

  return (
    <nav aria-label={ariaLabel} className={root()}>
      <ol className={list()}>
        {hasLength(hiddenCrumbs) && (
          <li className={fullPathItem()}>
            <FullPathMenu items={hiddenCrumbs} />
          </li>
        )}
        {items.map(({ label, href, isShrinkable = false }, index) => {
          const isLast = index === items.length - 1;
          const { item, link, current } = breadcrumbsVariants({
            isShrinkable,
            isHiddenOnPhone: index < hiddenCrumbs.length,
          });

          return (
            <li key={label} className={item()}>
              {index > 0 && (
                <span aria-hidden="true" className={sep()}>
                  ›
                </span>
              )}
              {isLast || !href ? (
                <CrumbLabel
                  label={label}
                  className={current()}
                  isCurrent={isLast}
                  hasFullTitle={isShrinkable}
                />
              ) : (
                <Link
                  href={href}
                  className={link()}
                  title={isShrinkable ? label : undefined}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
