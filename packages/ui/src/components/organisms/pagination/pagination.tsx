import {
  A_AS_CONST,
  PAGINATION_ELLIPSIS,
  type IWithClassName,
  type IWithDataTestId,
  type TPaginationEllipsis,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';

import { paginationVariants } from './pagination-variants';

const SIBLING_COUNT = 1;
const MAX_VISIBLE_PAGES = SIBLING_COUNT * 2 + 5;

type TPaginationItem = number | TPaginationEllipsis;

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

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
    return [
      ...range(1, 3 + SIBLING_COUNT * 2),
      PAGINATION_ELLIPSIS.END,
      totalPages,
    ];
  }

  if (showStartEllipsis && !showEndEllipsis) {
    return [
      1,
      PAGINATION_ELLIPSIS.START,
      ...range(totalPages - (3 + SIBLING_COUNT * 2) + 1, totalPages),
    ];
  }

  return [
    1,
    PAGINATION_ELLIPSIS.START,
    ...range(leftSibling, rightSibling),
    PAGINATION_ELLIPSIS.END,
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

/** Previous, next and numbered page links for a paginated listing. */
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

  const Component = linkAs ?? A_AS_CONST;
  const items = getPaginationItems(currentPage, totalPages);

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
        <Component href={createHref(currentPage + 1)} className={s.link()}>
          {nextLabel}
        </Component>
      )}
    </nav>
  );
};
