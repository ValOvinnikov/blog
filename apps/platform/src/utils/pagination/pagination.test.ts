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
  it('keeps one page for no items', () => {
    expect(countPages(0, MOCK_PAGE_SIZE)).toBe(1);
  });

  it('fills a page before starting the next', () => {
    expect(countPages(MOCK_PAGE_SIZE, MOCK_PAGE_SIZE)).toBe(1);
    expect(countPages(MOCK_PAGE_SIZE + 1, MOCK_PAGE_SIZE)).toBe(2);
  });
});

describe(resolveTotalPages, () => {
  it('returns the page count while the page is in range', () => {
    const totalPages = resolveTotalPages({
      page: 2,
      total: MOCK_PAGE_SIZE + 1,
      pageSize: MOCK_PAGE_SIZE,
      pageHref,
    });

    expect(totalPages).toBe(2);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('sends a page past the end to the last page', () => {
    expect(() =>
      resolveTotalPages({
        page: 9,
        total: MOCK_PAGE_SIZE + 1,
        pageSize: MOCK_PAGE_SIZE,
        pageHref,
      }),
    ).toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/items?page=2');
  });
});
