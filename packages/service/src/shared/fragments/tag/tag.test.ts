import { q } from '@blog/service/sanity/query/query';

import { tagFragment } from './tag';

const tagDocQuery = q.star
  .filterByType('blog_tag')
  .slice(0)
  .project(tagFragment);

describe('tagFragment', () => {
  it('accepts a fully-projected tag (title and resolved slug present)', () => {
    const projected = { _id: 'tag-1', title: 'TypeScript', slug: 'typescript' };

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
