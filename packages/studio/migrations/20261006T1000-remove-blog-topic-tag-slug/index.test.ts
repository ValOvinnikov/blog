import { at, unset } from 'sanity/migrate';

import { removeTaxonomySlug } from './index';

describe(removeTaxonomySlug, () => {
  it('unsets slug when present', () => {
    const result = removeTaxonomySlug({
      slug: { _type: 'slug', current: 'design' },
    });

    expect(result).toEqual([at('slug', unset())]);
  });

  it('is a no-op for a document without slug', () => {
    expect(removeTaxonomySlug({})).toBeUndefined();
  });
});
