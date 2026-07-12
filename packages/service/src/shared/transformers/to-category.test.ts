import { makeRawCategory } from '@blog/service/testing/entities/fixtures';
import { describe, expect, it } from 'vitest';

import { toCategory } from './to-category';

describe('toCategory', () => {
  it('maps all fields from raw input', () => {
    const raw = makeRawCategory();
    const result = toCategory(raw);

    expect(result).toEqual({
      id: 'cat-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
    });
  });

  it('converts null description to undefined', () => {
    const raw = makeRawCategory({ description: null });
    expect(toCategory(raw).description).toBeUndefined();
  });
});
