import { q } from '@blog/service/sanity/query/query';
import {
  MOCK_POST_ID,
  MOCK_POST_SLUG,
  MOCK_POST_TITLE,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_WORD_COUNT_FIELD } from '@blog/service/testing/shared/translated-posts-dataset';

import { postLinkFragment } from './post-link';

const postLinkDocQuery = q.star
  .filterByType('page_post')
  .slice(0)
  .project(postLinkFragment);

describe('postLinkFragment', () => {
  it('accepts a post with a heading and a flattened slug', () => {
    const projected = {
      _id: MOCK_POST_ID,
      headingBlock: { heading: MOCK_POST_TITLE },
      slug: MOCK_POST_SLUG,
    };

    const post = postLinkDocQuery.parse(projected);

    expect(post).toEqual(projected);
  });

  it.each([
    {
      missing: 'heading',
      projected: {
        _id: MOCK_POST_ID,
        headingBlock: { heading: null },
        slug: MOCK_POST_SLUG,
      },
    },
    {
      missing: 'slug',
      projected: {
        _id: MOCK_POST_ID,
        headingBlock: { heading: MOCK_POST_TITLE },
        slug: null,
      },
    },
  ])('throws when the required $missing is missing', ({ projected }) => {
    expect(() => postLinkDocQuery.parse(projected)).toThrow();
  });

  it.each([MOCK_WORD_COUNT_FIELD, 'publishedAt', 'supportingText'])(
    'leaves %s out of the projection',
    (field) => {
      expect(postLinkDocQuery.query).not.toContain(field);
    },
  );
});
