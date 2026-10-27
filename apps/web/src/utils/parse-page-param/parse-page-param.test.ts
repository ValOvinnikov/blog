import { faker } from '@faker-js/faker';

import { parsePageParam } from './parse-page-param';

faker.seed(123);

const MOCK_PAGE = faker.number.int({ min: 2, max: 999 });
const MOCK_WORD = faker.lorem.word();

describe(parsePageParam, () => {
  it.each([
    { raw: '1', expected: 1 },
    { raw: String(MOCK_PAGE), expected: MOCK_PAGE },
  ])('parses the canonical page $raw', ({ raw, expected }) => {
    expect(parsePageParam(raw)).toBe(expected);
  });

  it.each(['0', '02', '-1', '1.5', MOCK_WORD, '', ' 2', '1e2', '2 '])(
    'rejects the non-canonical value %j',
    (raw) => {
      expect(parsePageParam(raw)).toBeNull();
    },
  );
});
