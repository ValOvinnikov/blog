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
  it('accepts a fully-projected tag (title and resolved slug present)', () => {
    const projected = {
      _id: MOCK_TAG_ID,
      title: MOCK_TAG_TITLE,
      slug: MOCK_TAG_SLUG,
    };

    expect(tagDocQuery.parse(projected)).toEqual(projected);
  });

  it('throws when the required title is missing', () => {
    const projected = { _id: 'tag-2', title: null, slug: 'no-title' };

    expect(() => tagDocQuery.parse(projected)).toThrow();
  });

  it('accepts a tag with no tag page as a null slug', () => {
    const projected = { _id: 'tag-3', title: 'No Page', slug: null };

    expect(tagDocQuery.parse(projected)).toEqual(projected);
  });
});
