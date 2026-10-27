import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { removeRetiredPostListLimitFields } from './index';

faker.seed(2);

const MOCK_PAGE_SIZE = faker.number.int({ min: 2, max: 50 });

describe(removeRetiredPostListLimitFields, () => {
  it.each([
    ['page_blog', 'itemsPerPage'],
    ['module_postList', 'limit'],
  ])('unsets the retired field of a %s doc', (type, field) => {
    const result = removeRetiredPostListLimitFields(type, {
      [field]: MOCK_PAGE_SIZE,
    });

    expect(result).toEqual([at(field, unset())]);
  });

  it.each(['page_blog', 'module_postList'])(
    'leaves a %s doc without the retired field alone',
    (type) => {
      const result = removeRetiredPostListLimitFields(type, {});

      expect(result).toBeUndefined();
    },
  );
});
