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
  it('accepts a fully-projected post (heading and flattened slug.current present)', () => {
    const projected = {
      _id: MOCK_POST_ID,
      headingBlock: { heading: MOCK_POST_TITLE },
      slug: MOCK_POST_SLUG,
    };

    expect(postLinkDocQuery.parse(projected)).toEqual(projected);
  });

  it('throws when the required heading is missing', () => {
    const projected = {
      _id: 'post-2',
      headingBlock: { heading: null },
      slug: 'no-heading',
    };

    expect(() => postLinkDocQuery.parse(projected)).toThrow();
  });

  it('throws when the required slug is missing', () => {
    const projected = {
      _id: 'post-3',
      headingBlock: { heading: 'Has Heading' },
      slug: null,
    };

    expect(() => postLinkDocQuery.parse(projected)).toThrow();
  });

  it('projects only _id, headingBlock.heading and slug.current', () => {
    expect(postLinkDocQuery.query).not.toContain(MOCK_WORD_COUNT_FIELD);
    expect(postLinkDocQuery.query).not.toContain('publishedAt');
    expect(postLinkDocQuery.query).not.toContain('supportingText');
  });
});
