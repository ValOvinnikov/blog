import { q } from '@blog/service/sanity/query';

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

  it('throws when the resolved slug is missing', () => {
    const projected = { _id: 'tag-3', title: 'No Slug', slug: null };

    expect(() => tagDocQuery.parse(projected)).toThrow();
  });

  it('resolves the slug from the tag page referencing this tag, falling back to the tag own slug', () => {
    expect(tagDocQuery.query).toContain(
      '_type == "page_tag" && tag._ref == ^._id',
    );
    expect(tagDocQuery.query).toContain('coalesce(');
  });
});
