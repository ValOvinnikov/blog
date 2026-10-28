import {
  BRAND_TAGLINE_SEPARATORS,
  type TBrandTaglineSeparator,
} from '@blog/config';
import { faker } from '@faker-js/faker';

import { toBrandTagline } from './to-brand-tagline';

faker.seed(6080);

const MOCK_FIRST_ITEM = faker.string.alpha(8);
const MOCK_SECOND_ITEM = faker.string.alpha(8);

function mockTagline(
  texts: (string | null)[],
  separator: TBrandTaglineSeparator = BRAND_TAGLINE_SEPARATORS.DOT,
) {
  return {
    items: texts.map((text) => ({ _key: faker.string.uuid(), text })),
    separator,
  };
}

describe(toBrandTagline, () => {
  it.each([
    [BRAND_TAGLINE_SEPARATORS.DOT, '·'],
    [BRAND_TAGLINE_SEPARATORS.PIPE, '|'],
    [BRAND_TAGLINE_SEPARATORS.BULLET, '•'],
    [BRAND_TAGLINE_SEPARATORS.SLASH, '/'],
  ])('joins items with the %s separator', (separator, character) => {
    const result = toBrandTagline(
      mockTagline([MOCK_FIRST_ITEM, MOCK_SECOND_ITEM], separator),
    );

    expect(result).toBe(`${MOCK_FIRST_ITEM} ${character} ${MOCK_SECOND_ITEM}`);
  });

  it('joins a single item with no separator character', () => {
    expect(toBrandTagline(mockTagline([MOCK_SECOND_ITEM]))).toBe(
      MOCK_SECOND_ITEM,
    );
  });

  it('skips items with no text in either language', () => {
    const result = toBrandTagline(
      mockTagline([MOCK_FIRST_ITEM, null, MOCK_SECOND_ITEM]),
    );

    expect(result).toBe(`${MOCK_FIRST_ITEM} · ${MOCK_SECOND_ITEM}`);
  });

  it.each([
    ['a missing tagline', null],
    ['an empty items list', mockTagline([])],
  ])('maps %s to undefined', (_, raw) => {
    expect(toBrandTagline(raw)).toBeUndefined();
  });
});
