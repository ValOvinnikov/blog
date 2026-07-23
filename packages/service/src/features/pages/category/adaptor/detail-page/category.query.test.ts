import { makeRawCategory } from '@blog/service/testing/entities/fixtures';
import { describe, expect, it } from 'vitest';

import { categoryPageCategoryQuery } from './category.query';

describe('categoryPageCategoryQuery', () => {
  it('parses a category with no description', () => {
    const raw = makeRawCategory({ description: null });

    expect(() => categoryPageCategoryQuery.parse(raw)).not.toThrow();
  });
});
