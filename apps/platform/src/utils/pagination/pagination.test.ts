import { countPages, PAGE_SIZE, parsePage } from './pagination';

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
    expect(countPages(0)).toBe(1);
  });

  it('fills a page before starting the next', () => {
    expect(countPages(PAGE_SIZE)).toBe(1);
    expect(countPages(PAGE_SIZE + 1)).toBe(2);
  });
});
