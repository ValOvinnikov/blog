import { faker } from '@faker-js/faker';

import { toTopicId } from './id';

faker.seed(8);

const MOCK_CATEGORY_ID = faker.string.uuid();

describe(toTopicId, () => {
  it.each([
    ['a published id', MOCK_CATEGORY_ID, `topic-${MOCK_CATEGORY_ID}`],
    [
      'a draft id, keeping the drafts prefix outermost',
      `drafts.${MOCK_CATEGORY_ID}`,
      `drafts.topic-${MOCK_CATEGORY_ID}`,
    ],
    [
      'an already migrated id',
      `topic-${MOCK_CATEGORY_ID}`,
      `topic-${MOCK_CATEGORY_ID}`,
    ],
  ])('converts %s', (_label, categoryId, expected) => {
    const result = toTopicId(categoryId);

    expect(result).toBe(expected);
  });
});
