import { toTopicPaginationParams } from './transformer';

describe('toTopicPaginationParams', () => {
  it('returns pages 2..totalPages for each topic page with a full corpus', () => {
    expect(
      toTopicPaginationParams([
        { slug: 'engineering', pageSize: 9, postCount: 20 },
        { slug: 'design', pageSize: 9, postCount: 9 },
      ]),
    ).toEqual([
      { slug: 'engineering', page: '2' },
      { slug: 'engineering', page: '3' },
    ]);
  });

  it('contributes no entries for a topic page with zero posts', () => {
    expect(
      toTopicPaginationParams([{ slug: 'empty', pageSize: 9, postCount: 0 }]),
    ).toEqual([]);
  });

  it('contributes no entries for a topic page that fits on one page', () => {
    expect(
      toTopicPaginationParams([
        { slug: 'engineering', pageSize: 9, postCount: 5 },
      ]),
    ).toEqual([]);
  });

  // A topic page with no list module in modules[] contributes no extra
  // pages rather than failing the whole site's static params — see the
  // rationale in transformer.ts.
  it('contributes no entries for a topic page with no list module in modules[]', () => {
    expect(
      toTopicPaginationParams([
        { slug: 'unconfigured', pageSize: null, postCount: 20 },
      ]),
    ).toEqual([]);
  });

  it('returns an empty array when there are no topic pages', () => {
    expect(toTopicPaginationParams([])).toEqual([]);
  });
});
