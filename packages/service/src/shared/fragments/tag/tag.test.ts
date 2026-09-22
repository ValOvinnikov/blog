import { q } from '@blog/service/sanity/query';

import { tagFragment } from './tag';

const tagDocQuery = q.star
  .filterByType('blog_tag')
  .slice(0)
  .project(tagFragment);

describe('tagFragment', () => {
  it('accepts a fully-projected tag (title and flattened slug.current present)', () => {
    const projected = { _id: 'tag-1', title: 'TypeScript', slug: 'typescript' };

    expect(tagDocQuery.parse(projected)).toEqual(projected);
  });

  it('throws when the required title is missing', () => {
    const projected = { _id: 'tag-2', title: null, slug: 'no-title' };

    expect(() => tagDocQuery.parse(projected)).toThrow();
  });

  it('throws when the required slug is missing', () => {
    const projected = { _id: 'tag-3', title: 'No Slug', slug: null };

    expect(() => tagDocQuery.parse(projected)).toThrow();
  });
});
