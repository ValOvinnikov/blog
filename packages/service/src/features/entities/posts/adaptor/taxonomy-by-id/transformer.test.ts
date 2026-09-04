import { toPostTaxonomySlugs, type TRawPostTaxonomyById } from './transformer';

describe(toPostTaxonomySlugs, () => {
  it('flattens tag page objects to their slugs', () => {
    const raw: TRawPostTaxonomyById = {
      tagSlugs: [{ slug: 'typescript' }, { slug: 'react' }],
      topicSlug: null,
    };

    expect(toPostTaxonomySlugs(raw).tagSlugs).toEqual(['typescript', 'react']);
  });

  it('maps a matching topic page to its slug', () => {
    const raw: TRawPostTaxonomyById = {
      tagSlugs: [],
      topicSlug: { slug: 'engineering' },
    };

    expect(toPostTaxonomySlugs(raw).topicSlug).toBe('engineering');
  });

  it('maps no matching topic page to undefined, never null', () => {
    const raw: TRawPostTaxonomyById = { tagSlugs: [], topicSlug: null };

    expect(toPostTaxonomySlugs(raw).topicSlug).toBeUndefined();
  });

  it('maps no matching tag pages to an empty array', () => {
    const raw: TRawPostTaxonomyById = { tagSlugs: [], topicSlug: null };

    expect(toPostTaxonomySlugs(raw).tagSlugs).toEqual([]);
  });
});
