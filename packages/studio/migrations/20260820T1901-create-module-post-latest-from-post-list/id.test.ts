import { faker } from '@faker-js/faker';

import { toPostLatestId } from './id';

faker.seed(9);

const MOCK_POST_LIST_ID = faker.string.uuid();

describe(toPostLatestId, () => {
  it.each([
    ['a published id', MOCK_POST_LIST_ID, `postLatest-${MOCK_POST_LIST_ID}`],
    [
      'a draft id, keeping the drafts prefix outermost',
      `drafts.${MOCK_POST_LIST_ID}`,
      `drafts.postLatest-${MOCK_POST_LIST_ID}`,
    ],
    [
      'an already migrated id',
      `postLatest-${MOCK_POST_LIST_ID}`,
      `postLatest-${MOCK_POST_LIST_ID}`,
    ],
  ])('converts %s', (_label, postListId, expected) => {
    const result = toPostLatestId(postListId);

    expect(result).toBe(expected);
  });
});
