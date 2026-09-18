import { HERO_VARIANT } from '@blog/config/constants';

import { isNotHeroVariant } from './hero-variant-predicate';

describe(isNotHeroVariant, () => {
  it('returns false when the parent variant matches', () => {
    const predicate = isNotHeroVariant(HERO_VARIANT.SPLIT);

    expect(predicate({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(false);
  });

  it('returns true when the parent variant differs', () => {
    const predicate = isNotHeroVariant(HERO_VARIANT.SPLIT);

    expect(predicate({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(predicate({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
  });

  it('returns true when the parent has no variant set', () => {
    const predicate = isNotHeroVariant(HERO_VARIANT.SPLIT);

    expect(predicate({ parent: undefined })).toBe(true);
  });
});
