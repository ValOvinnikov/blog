import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { removeBlogAuthorSlug } from './index';

faker.seed(1);

const MOCK_SLUG = faker.lorem.slug();

describe(removeBlogAuthorSlug, () => {
  it('unsets the slug of a doc that has one', () => {
    const result = removeBlogAuthorSlug({
      slug: { _type: 'slug', current: MOCK_SLUG },
    });

    expect(result).toEqual([at('slug', unset())]);
  });

  it('leaves a doc without a slug alone', () => {
    const result = removeBlogAuthorSlug({});

    expect(result).toBeUndefined();
  });
});
