import { MOCK_SYSTEM_FIELDS } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { delete_ } from 'sanity/migrate';

import migration from './index';

faker.seed(12);

const MOCK_POST_LIST_ID = faker.string.uuid();

describe('delete-legacy-module-post-list migration', () => {
  it('deletes a module_postList document', () => {
    const postList = {
      ...MOCK_SYSTEM_FIELDS,
      _id: MOCK_POST_LIST_ID,
      _type: 'module_postList',
    };

    const result = migration.migrate.document(postList);

    expect(result).toEqual(delete_(MOCK_POST_LIST_ID));
  });
});
