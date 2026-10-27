import { faker } from '@faker-js/faker';

import { withPrefix } from './with-prefix';

faker.seed(15);

const MOCK_PREFIX = 'page_topic-';
const MOCK_ID = faker.string.uuid();

describe(withPrefix, () => {
  it.each([
    ['prefixes a bare id', MOCK_ID, `${MOCK_PREFIX}${MOCK_ID}`],
    [
      'keeps the drafts. prefix outermost',
      `drafts.${MOCK_ID}`,
      `drafts.${MOCK_PREFIX}${MOCK_ID}`,
    ],
    [
      'leaves an already-prefixed id alone',
      `${MOCK_PREFIX}${MOCK_ID}`,
      `${MOCK_PREFIX}${MOCK_ID}`,
    ],
    [
      'leaves an already-prefixed draft id alone',
      `drafts.${MOCK_PREFIX}${MOCK_ID}`,
      `drafts.${MOCK_PREFIX}${MOCK_ID}`,
    ],
  ])('%s', (_title, id, expected) => {
    expect(withPrefix(id, MOCK_PREFIX)).toBe(expected);
  });
});
