import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { resolveComponent } from '@blog/ui/lib/react';

import { paginationVariants } from './pagination-variants';

export type TPaginationProps = IWithClassName &
  IWithDataTestId & {
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
  };

const s = paginationVariants();

/**
 * Pagination — prev/next + numbered links for paginated listings,
 * route-agnostic (`createHref`) and polymorphic (`linkAs`); renders nothing
 * when there is a single page.
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
}: TPaginationProps) => {
  if (totalPages <= 1) return null;

  const Component = resolveComponent(linkAs, 'a');
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label={ariaLabel}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      {currentPage > 1 && (
        // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `linkAs`/fallback verbatim, so the reference stays stable across renders
        <Component href={createHref(currentPage - 1)} className={s.link()}>
          {previousLabel}
        </Component>
      )}
      <ul role="list" className={s.list()}>
        {pages.map((page) => (
          <li key={page}>
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
        // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `linkAs`/fallback verbatim, so the reference stays stable across renders
        <Component href={createHref(currentPage + 1)} className={s.link()}>
          {nextLabel}
        </Component>
      )}
    </nav>
  );
};
