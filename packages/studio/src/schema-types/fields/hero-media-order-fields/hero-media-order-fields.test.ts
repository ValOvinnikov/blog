import { HERO_VARIANT } from '@blog/config/constants';
import { getHidden } from '@blog/studio/testing/get-field-hidden';

import {
  heroMediaOrderSplitField,
  heroMediaOrderStackedField,
} from './hero-media-order-fields';

describe(heroMediaOrderSplitField, () => {
  it('shows only for Split', () => {
    const hidden = getHidden(heroMediaOrderSplitField());

    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
  });
});

describe(heroMediaOrderStackedField, () => {
  it('shows only for Stacked', () => {
    const hidden = getHidden(heroMediaOrderStackedField());

    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
  });
});
