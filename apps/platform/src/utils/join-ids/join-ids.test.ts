import type { TNullable } from '@blog/config';

import { joinIds } from './join-ids';

const FIRST_ID = 'first-id';
const SECOND_ID = 'second-id';
const THIRD_ID = 'third-id';

describe(joinIds, () => {
  it.each([
    [[FIRST_ID], FIRST_ID],
    [[FIRST_ID, SECOND_ID, THIRD_ID], `${FIRST_ID} ${SECOND_ID} ${THIRD_ID}`],
    [[THIRD_ID, FIRST_ID], `${THIRD_ID} ${FIRST_ID}`],
  ])('joins %j with single spaces in order', (ids, expected) => {
    expect(joinIds(...ids)).toBe(expected);
  });

  it.each<TNullable<string | false>>([false, null, undefined, ''])(
    'drops the %j id',
    (dropped) => {
      expect(joinIds(FIRST_ID, dropped, SECOND_ID)).toBe(
        `${FIRST_ID} ${SECOND_ID}`,
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
