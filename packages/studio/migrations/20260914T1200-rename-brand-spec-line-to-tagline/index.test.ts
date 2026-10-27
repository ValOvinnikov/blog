import { faker } from '@faker-js/faker';
import { at, set, unset } from 'sanity/migrate';

import { renameSpecLineToTagline } from './index';

faker.seed(6018);

const SPEC_LINE_TYPE = 'specLine';
const BRAND_TAGLINE_TYPE = 'brandTagline';
const MOCK_ITEMS = [faker.lorem.word(), faker.lorem.word()];
const MOCK_SEPARATOR = faker.lorem.word();

describe(renameSpecLineToTagline, () => {
  it('moves specLine to tagline and rewrites its _type', () => {
    const result = renameSpecLineToTagline({
      brand: {
        specLine: {
          _type: SPEC_LINE_TYPE,
          items: MOCK_ITEMS,
          separator: MOCK_SEPARATOR,
        },
      },
    });

    expect(result).toEqual([
      at(
        'brand.tagline',
        set({
          _type: BRAND_TAGLINE_TYPE,
          items: MOCK_ITEMS,
          separator: MOCK_SEPARATOR,
        }),
      ),
      at('brand.specLine', unset()),
    ]);
  });

  it.each([
    [
      'tagline is already set',
      {
        brand: {
          specLine: { _type: SPEC_LINE_TYPE, items: MOCK_ITEMS },
          tagline: { _type: BRAND_TAGLINE_TYPE, items: MOCK_ITEMS },
        },
      },
    ],
    ['there is no specLine', { brand: {} }],
    ['there is no brand', {}],
  ])('leaves a doc alone when %s', (_case, doc) => {
    const result = renameSpecLineToTagline(doc);

    expect(result).toBeUndefined();
  });
});
