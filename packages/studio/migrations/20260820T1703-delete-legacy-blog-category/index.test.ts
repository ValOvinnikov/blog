import { MOCK_SYSTEM_FIELDS } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { delete_ } from 'sanity/migrate';

import migration from './index';

faker.seed(11);

const MOCK_CATEGORY_ID = faker.string.uuid();

describe('delete-legacy-blog-category migration', () => {
  it('deletes a blog_category document', () => {
    const category = {
      ...MOCK_SYSTEM_FIELDS,
      _id: MOCK_CATEGORY_ID,
      _type: 'blog_category',
    };

    const result = migration.migrate.document(category);

    expect(result).toEqual(delete_(MOCK_CATEGORY_ID));
  });
});
