import { Link } from '@platform/i18n/navigation';

import { breadcrumbsVariants } from './breadcrumbs-variants';
import { CrumbLabel } from './components/crumb-label';

export type TBreadcrumbItem = {
  label: string;
  href?: string;
  isShrinkable?: boolean;
};

export type TBreadcrumbsProps = {
  items: TBreadcrumbItem[];
  ariaLabel: string;
};

export const Breadcrumbs = ({ items, ariaLabel }: TBreadcrumbsProps) => {
  const { root, list, sep } = breadcrumbsVariants();

  return (
    <nav aria-label={ariaLabel} className={root()}>
      <ol className={list()}>
        {items.map(({ label, href, isShrinkable = false }, index) => {
          const isLast = index === items.length - 1;
          const { item, link, current } = breadcrumbsVariants({
            isShrinkable,
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
