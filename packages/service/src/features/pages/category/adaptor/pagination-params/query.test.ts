import { categoryPaginationParamsQuery } from './query';

describe('categoryPaginationParamsQuery', () => {
  it('parses a category slug with a post count', () => {
    const raw = [{ slug: 'engineering', postCount: 5 }];

    expect(() => categoryPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a category with zero posts', () => {
    const raw = [{ slug: 'empty', postCount: 0 }];

    expect(() => categoryPaginationParamsQuery.parse(raw)).not.toThrow();
  });
});
