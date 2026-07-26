import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { type ElementType } from 'react';

import { breadcrumbsVariants } from './breadcrumbs-variants';

export interface IBreadcrumbItem {
  label: string;
  href: string;
}

export interface IBreadcrumbsProps extends IWithDataTestId {
  /** Full trail including the current page as the last item. */
  items: IBreadcrumbItem[];
  /** aria-label for the nav — passed in (i18n), never hardcoded in @blog/ui. */
  ariaLabel: string;
  /** Component each link renders as — pass the app router's Link for client-side navigation. Defaults to a plain `<a>`. */
  linkAs?: TAnchorElementType;
  className?: string;
}

const s = breadcrumbsVariants();

/**
 * Breadcrumbs — page-chrome navigation trail (e.g. `Home › Category ›
 * Post title`). Every item except the last renders as a link; the last item
 * is the current page, rendered as plain text with `aria-current="page"`.
 * Separators are decorative CSS `::before` pseudo-elements, kept out of the
 * a11y tree. Pure and independent of page content — render it as a sibling
 * above the content organism, never nested inside one.
 */
export const Breadcrumbs = ({
  items,
  ariaLabel,
  linkAs,
  className,
  dataTestId,
}: IBreadcrumbsProps) => {
  const LinkComponent = (linkAs ?? 'a') as ElementType;
  const lastIndex = items.length - 1;

  return (
    <nav
      aria-label={ariaLabel}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      <ol className={s.list()}>
        {items.map(({ label, href }, index) => {
          const isCurrent = index === lastIndex;

          return (
            <li key={href} className={s.item()}>
              {isCurrent ? (
                <span className={s.current()} aria-current="page">
                  {label}
                </span>
              ) : (
                <LinkComponent href={href} className={s.link()}>
                  {label}
                </LinkComponent>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
