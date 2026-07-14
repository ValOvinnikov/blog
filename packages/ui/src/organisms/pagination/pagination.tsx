import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import type { ElementType } from 'react';

import { paginationVariants } from './pagination-variants';

export interface IPaginationProps extends IWithDataTestId {
  /** 1-based current page. */
  currentPage: number;
  totalPages: number;
  /** Builds the href for a page number — URL scheme stays in the app. */
  createHref: (page: number) => string;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  /** Component links render as — pass the app router's Link for client-side navigation. */
  linkAs?: TAnchorElementType;
  className?: string;
}

const s = paginationVariants();

/**
 * Pagination — prev/next + numbered links for paginated listings. Route-
 * agnostic (`createHref`) and polymorphic (`linkAs`), mirroring PostsSection.
 * Renders nothing when there is a single page.
 *
 * @example
 * <Pagination
 *   currentPage={2}
 *   totalPages={5}
 *   createHref={routes.blogIndex}
 *   ariaLabel="Blog pages"
 *   previousLabel="Previous"
 *   nextLabel="Next"
 *   linkAs={Link}
 * />
 */
export const Pagination = ({
  currentPage,
  totalPages,
  createHref,
  ariaLabel,
  previousLabel,
  nextLabel,
  linkAs,
  className,
  dataTestId,
}: IPaginationProps) => {
  if (totalPages <= 1) return null;

  const Component = (linkAs ?? 'a') as ElementType;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label={ariaLabel}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      {currentPage > 1 && (
        <Component href={createHref(currentPage - 1)} className={s.link()}>
          {previousLabel}
        </Component>
      )}
      <ul role="list" className={s.list()}>
        {pages.map((page) => (
          <li key={page} className={s.item()}>
            <Component
              href={createHref(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={s.link({ current: page === currentPage })}
            >
              {page}
            </Component>
          </li>
        ))}
      </ul>
      {currentPage < totalPages && (
        <Component href={createHref(currentPage + 1)} className={s.link()}>
          {nextLabel}
        </Component>
      )}
    </nav>
  );
};
