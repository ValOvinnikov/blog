import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { removeTaxonomySlug } from './index';

faker.seed(10000);

describe(removeTaxonomySlug, () => {
  it('unsets the slug when present', () => {
    const result = removeTaxonomySlug({
      slug: { _type: 'slug', current: faker.lorem.slug() },
    });

    expect(result).toEqual([at('slug', unset())]);
  });

  it('leaves a document without a slug alone', () => {
    const result = removeTaxonomySlug({});

    expect(result).toBeUndefined();
  });
});
