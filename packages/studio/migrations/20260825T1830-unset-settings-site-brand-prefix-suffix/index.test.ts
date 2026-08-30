import { at, unset } from 'sanity/migrate';

import { removeStaleBrandPrefixSuffix } from './index';

describe(removeStaleBrandPrefixSuffix, () => {
  it('unsets both brand.prefix and brand.suffix when both are present', () => {
    const result = removeStaleBrandPrefixSuffix({
      brand: { prefix: 'valstack', suffix: '.dev' },
    });

    expect(result).toEqual([
      at('brand.prefix', unset()),
      at('brand.suffix', unset()),
    ]);
  });

  it('only unsets whichever field is actually present', () => {
    const result = removeStaleBrandPrefixSuffix({
      brand: { prefix: 'valstack' },
    });

    expect(result).toEqual([at('brand.prefix', unset())]);
  });

  it('is idempotent — a doc with neither field is left alone', () => {
    const result = removeStaleBrandPrefixSuffix({ brand: {} });

    expect(result).toBeUndefined();
  });

  it('returns undefined for a doc with no brand at all', () => {
    const result = removeStaleBrandPrefixSuffix({});

    expect(result).toBeUndefined();
  });
});
