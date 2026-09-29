import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { resolveComponent } from '@blog/ui/lib/react';

import { paginationVariants } from './pagination-variants';

const SIBLING_COUNT = 1;
const MAX_VISIBLE_PAGES = SIBLING_COUNT * 2 + 5;

type TPaginationItem = number | 'start-ellipsis' | 'end-ellipsis';

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

/** Which page numbers/ellipses to render for a given `currentPage`/`totalPages` — always the first page, the last page, and up to `SIBLING_COUNT` neighbours either side of the current page. */
const getPaginationItems = (
  currentPage: number,
  totalPages: number,
): TPaginationItem[] => {
  if (totalPages <= MAX_VISIBLE_PAGES) return range(1, totalPages);

  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1);
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages);
  const showStartEllipsis = leftSibling > 2;
  const showEndEllipsis = rightSibling < totalPages - 1;

  if (!showStartEllipsis && showEndEllipsis) {
    return [...range(1, 3 + SIBLING_COUNT * 2), 'end-ellipsis', totalPages];
  }

  if (showStartEllipsis && !showEndEllipsis) {
    return [
      1,
      'start-ellipsis',
      ...range(totalPages - (3 + SIBLING_COUNT * 2) + 1, totalPages),
    ];
  }

  return [
    1,
    'start-ellipsis',
    ...range(leftSibling, rightSibling),
    'end-ellipsis',
    totalPages,
  ];
};

export type TPaginationProps = IWithClassName &
  IWithDataTestId & {
    currentPage: number;
    totalPages: number;
    createHref: (page: number) => string;
    ariaLabel: string;
    previousLabel: string;
    nextLabel: string;
    linkAs?: TAnchorElementType;
  };

const s = paginationVariants();

/** Prev/next + numbered links for paginated listings, route-agnostic (`createHref`) and polymorphic (`linkAs`); renders nothing when there is a single page. */
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
  const items = getPaginationItems(currentPage, totalPages);

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
        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Component
                href={createHref(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                className={s.link({ current: item === currentPage })}
              >
                {item}
              </Component>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className={s.ellipsis()}>
              …
            </li>
          ),
        )}
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
