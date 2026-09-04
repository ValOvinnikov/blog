import { postTaxonomyByIdQuery } from './query';

describe('postTaxonomyByIdQuery', () => {
  it('parses a post with tag pages and a topic page', () => {
    const raw = {
      tagSlugs: [{ slug: 'typescript' }, { slug: 'react' }],
      topicSlug: { slug: 'engineering' },
    };

    expect(() => postTaxonomyByIdQuery.parse(raw)).not.toThrow();
  });

  it('parses a post with no matching tag pages and no matching topic page', () => {
    const raw = { tagSlugs: [], topicSlug: null };

    expect(() => postTaxonomyByIdQuery.parse(raw)).not.toThrow();
  });

  it('parses no matching blog_post as null', () => {
    expect(() => postTaxonomyByIdQuery.parse(null)).not.toThrow();
  });

  it('filters by the given post id', () => {
    expect(postTaxonomyByIdQuery.query).toContain('_id == $postId');
  });

  it('correlates tag pages back to the post by tag reference', () => {
    expect(postTaxonomyByIdQuery.query).toContain('tag._ref in ^.tags[]._ref');
  });

  it('correlates the topic page back to the post by topic reference', () => {
    expect(postTaxonomyByIdQuery.query).toContain('topic._ref == ^.topic._ref');
  });
});
