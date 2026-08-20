import { toTopicPaginationParams } from './transformer';

describe('toTopicPaginationParams', () => {
  it('returns pages 2..totalPages for each topic with a full corpus', () => {
    expect(
      toTopicPaginationParams(
        [
          { slug: 'engineering', postCount: 20 },
          { slug: 'design', postCount: 9 },
        ],
        9,
      ),
    ).toEqual([
      { slug: 'engineering', page: '2' },
      { slug: 'engineering', page: '3' },
    ]);
  });

  it('contributes no entries for a topic with zero posts', () => {
    expect(
      toTopicPaginationParams([{ slug: 'empty', postCount: 0 }], 9),
    ).toEqual([]);
  });

  it('contributes no entries for a topic that fits on one page', () => {
    expect(
      toTopicPaginationParams([{ slug: 'engineering', postCount: 5 }], 9),
    ).toEqual([]);
  });

  it('returns an empty array when there are no topics', () => {
    expect(toTopicPaginationParams([], 9)).toEqual([]);
  });
});
