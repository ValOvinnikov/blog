import {
  MOCK_TAG_ID,
  MOCK_TAG_SLUG,
  MOCK_TAG_TITLE,
  mockRawTag,
} from '@blog/service/testing/entities/fixtures';

import { toTag } from './to-tag';

describe(toTag, () => {
  it('maps all fields from raw input', () => {
    const result = toTag(mockRawTag());

    expect(result).toEqual({
      id: MOCK_TAG_ID,
      title: MOCK_TAG_TITLE,
      slug: MOCK_TAG_SLUG,
    });
  });

  it('maps a tag with no tag page to an undefined slug', () => {
    const { slug } = toTag(mockRawTag({ slug: null }));

    expect(slug).toBeUndefined();
  });
});
