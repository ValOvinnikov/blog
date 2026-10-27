import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { redirect } from 'next/navigation';

import { countPages, parsePage, resolveTotalPages } from './pagination';

const MOCK_PAGE_SIZE = 10;
const pageHref = (page: number) => `/items?page=${page}`;

describe(parsePage, () => {
  it.each([
    ['3', 3],
    ['1', 1],
  ])('reads %j as page %i', (raw, page) => {
    expect(parsePage(raw)).toBe(page);
  });

  it.each([undefined, '', '0', '-2', '1.5', 'abc', ['1', '2'], '1e400'])(
    'falls back to the first page for %j',
    (raw) => {
      expect(parsePage(raw)).toBe(1);
    },
  );
});

describe(countPages, () => {
  it.each([
    { name: 'keeps one page for no items', total: 0, pages: 1 },
    { name: 'fits a full page on one page', total: MOCK_PAGE_SIZE, pages: 1 },
    {
      name: 'starts the next page past a full one',
      total: MOCK_PAGE_SIZE + 1,
      pages: 2,
    },
  ])('$name', ({ total, pages }) => {
    expect(countPages(total, MOCK_PAGE_SIZE)).toBe(pages);
  });
});

describe(resolveTotalPages, () => {
  const resolveForTwoPages = (page: number) =>
    resolveTotalPages({
      page,
      total: MOCK_PAGE_SIZE + 1,
      pageSize: MOCK_PAGE_SIZE,
      pageHref,
    });

  it('returns the page count while the page is in range', () => {
    const totalPages = resolveForTwoPages(2);

    expect(totalPages).toBe(2);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('sends a page past the end to the last page', () => {
    expect(() => resolveForTwoPages(9)).toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(pageHref(2));
  });
});
