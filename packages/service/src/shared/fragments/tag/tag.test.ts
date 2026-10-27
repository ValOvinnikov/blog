import { q } from '@blog/service/sanity/query/query';
import {
  MOCK_TAG_ID,
  MOCK_TAG_SLUG,
  MOCK_TAG_TITLE,
} from '@blog/service/testing/entities/fixtures';

import { tagFragment } from './tag';

const tagDocQuery = q.star
  .filterByType('blog_tag')
  .slice(0)
  .project(tagFragment);

describe('tagFragment', () => {
  it.each([
    {
      behaviour: 'accepts a tag with a title and a resolved page slug',
      projected: {
        _id: MOCK_TAG_ID,
        title: MOCK_TAG_TITLE,
        slug: MOCK_TAG_SLUG,
      },
    },
    {
      behaviour: 'accepts a tag with no tag page as a null slug',
      projected: { _id: MOCK_TAG_ID, title: MOCK_TAG_TITLE, slug: null },
    },
  ])('$behaviour', ({ projected }) => {
    const tag = tagDocQuery.parse(projected);

    expect(tag).toEqual(projected);
  });

  it('throws when the required title is missing', () => {
    const projected = { _id: MOCK_TAG_ID, title: null, slug: MOCK_TAG_SLUG };

    expect(() => tagDocQuery.parse(projected)).toThrow();
  });
});
