import { faker } from '@faker-js/faker';

import { blankToNull } from './blank-to-null';

faker.seed(6803);

const MOCK_VALUE = faker.lorem.word();

describe(blankToNull, () => {
  it.each(['', '   '])('turns %j into null', (value) => {
    expect(blankToNull(value)).toBeNull();
  });

  it('trims the value it keeps', () => {
    expect(blankToNull(` ${MOCK_VALUE} `)).toBe(MOCK_VALUE);
  });
});
