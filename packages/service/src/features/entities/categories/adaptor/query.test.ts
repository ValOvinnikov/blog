import { makeRawCategoryWithPostCount } from '@blog/service/testing/entities/fixtures';

import { categoriesQuery } from './query';

describe('categoriesQuery', () => {
  it('parses a category with no description and a post count', () => {
    const raw = [
      makeRawCategoryWithPostCount({ description: null, postCount: 5 }),
    ];

    expect(() => categoriesQuery.parse(raw)).not.toThrow();
  });
});
