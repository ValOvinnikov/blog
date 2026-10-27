import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { removeStaleBrandPrefixSuffix } from './index';

faker.seed(3);

const MOCK_PREFIX = faker.lorem.word();
const MOCK_SUFFIX = faker.lorem.word();

describe(removeStaleBrandPrefixSuffix, () => {
  it.each([
    [{ prefix: MOCK_PREFIX, suffix: MOCK_SUFFIX }, ['prefix', 'suffix']],
    [{ prefix: MOCK_PREFIX }, ['prefix']],
    [{ suffix: MOCK_SUFFIX }, ['suffix']],
  ])('unsets only the stale fields of brand %o', (brand, fields) => {
    const result = removeStaleBrandPrefixSuffix({ brand });

    expect(result).toEqual(
      fields.map((field) => at(`brand.${field}`, unset())),
    );
  });

  it.each([{}, { brand: {} }])(
    'leaves a doc without stale brand fields alone: %o',
    (doc) => {
      const result = removeStaleBrandPrefixSuffix(doc);

      expect(result).toBeUndefined();
    },
  );
});
