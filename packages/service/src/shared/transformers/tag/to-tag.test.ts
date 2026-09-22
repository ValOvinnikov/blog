import { makeRawTag } from '@blog/service/testing/entities/fixtures';

import { toTag } from './to-tag';

describe('toTag', () => {
  it('maps all fields from raw input', () => {
    const raw = makeRawTag();
    const result = toTag(raw);

    expect(result).toEqual({
      id: 'tag-1',
      title: 'TypeScript',
      slug: 'typescript',
    });
  });
});
