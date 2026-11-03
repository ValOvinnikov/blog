import type { TNullable } from '@blog/config';
import { faker } from '@faker-js/faker';

import { joinIds } from './join-ids';

faker.seed(6391);

const MOCK_FIRST_ID = faker.string.uuid();
const MOCK_SECOND_ID = faker.string.uuid();
const MOCK_THIRD_ID = faker.string.uuid();

describe(joinIds, () => {
  it.each([
    [[MOCK_FIRST_ID], MOCK_FIRST_ID],
    [
      [MOCK_FIRST_ID, MOCK_SECOND_ID, MOCK_THIRD_ID],
      `${MOCK_FIRST_ID} ${MOCK_SECOND_ID} ${MOCK_THIRD_ID}`,
    ],
    [[MOCK_THIRD_ID, MOCK_FIRST_ID], `${MOCK_THIRD_ID} ${MOCK_FIRST_ID}`],
  ])('joins %j with single spaces in order', (ids, expected) => {
    expect(joinIds(...ids)).toBe(expected);
  });

  it.each<TNullable<string | false>>([false, null, undefined, ''])(
    'drops the %j id',
    (dropped) => {
      expect(joinIds(MOCK_FIRST_ID, dropped, MOCK_SECOND_ID)).toBe(
        `${MOCK_FIRST_ID} ${MOCK_SECOND_ID}`,
      );
    },
  );

  it.each<[TNullable<string | false>[]]>([
    [[]],
    [[false, null, undefined, '']],
  ])('returns undefined when no ids remain in %j', (ids) => {
    expect(joinIds(...ids)).toBeUndefined();
  });
});
