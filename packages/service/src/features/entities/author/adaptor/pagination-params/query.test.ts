import { authorPaginationParamsQuery } from './query';

describe('authorPaginationParamsQuery', () => {
  it('parses an author slug with a post count', () => {
    const raw = [{ slug: 'jane-doe', postCount: 5 }];

    expect(() => authorPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses an author with zero posts', () => {
    const raw = [{ slug: 'empty-author', postCount: 0 }];

    expect(() => authorPaginationParamsQuery.parse(raw)).not.toThrow();
  });
});
