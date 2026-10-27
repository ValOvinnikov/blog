import { faker } from '@faker-js/faker';

import { toPostListModuleKey } from './post-list-module-key';

faker.seed(14);

const MOCK_POST_LIST_REF = faker.string.uuid();
const MOCK_OTHER_POST_LIST_REF = faker.string.uuid();

describe(toPostListModuleKey, () => {
  it('derives the same key from the same reference', () => {
    expect(toPostListModuleKey(MOCK_POST_LIST_REF)).toBe(
      toPostListModuleKey(MOCK_POST_LIST_REF),
    );
  });

  it('derives different keys from different references', () => {
    expect(toPostListModuleKey(MOCK_POST_LIST_REF)).not.toBe(
      toPostListModuleKey(MOCK_OTHER_POST_LIST_REF),
    );
  });

  it('prefixes the key and hex-encodes the hash', () => {
    expect(toPostListModuleKey(MOCK_POST_LIST_REF)).toMatch(
      /^postList-[0-9a-f]{12}$/,
    );
  });
});
