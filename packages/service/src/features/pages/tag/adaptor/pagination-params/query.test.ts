import { tagPaginationParamsQuery } from './query';

describe('tagPaginationParamsQuery', () => {
  it('parses a tag slug with a post count', () => {
    const raw = [{ slug: 'typescript', postCount: 5 }];

    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag with zero posts', () => {
    const raw = [{ slug: 'empty', postCount: 0 }];

    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });
});
