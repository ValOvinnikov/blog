import {
  countLeadsPages,
  LEADS_PAGE_SIZE,
  parseLeadsPage,
} from './leads-pagination';

describe(parseLeadsPage, () => {
  it.each([
    ['3', 3],
    ['1', 1],
  ])('reads %j as page %i', (raw, page) => {
    expect(parseLeadsPage(raw)).toBe(page);
  });

  it.each([undefined, '', '0', '-2', '1.5', 'abc', ['1', '2'], '1e400'])(
    'falls back to the first page for %j',
    (raw) => {
      expect(parseLeadsPage(raw)).toBe(1);
    },
  );
});

describe(countLeadsPages, () => {
  it('keeps one page for no leads', () => {
    expect(countLeadsPages(0)).toBe(1);
  });

  it('fills a page before starting the next', () => {
    expect(countLeadsPages(LEADS_PAGE_SIZE)).toBe(1);
    expect(countLeadsPages(LEADS_PAGE_SIZE + 1)).toBe(2);
  });
});
