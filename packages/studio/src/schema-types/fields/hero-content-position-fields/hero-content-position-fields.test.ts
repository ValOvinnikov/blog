import { HERO_VARIANT } from '@blog/config/constants';
import { getField } from '@blog/studio/testing/get-field';
import { getHidden } from '@blog/studio/testing/get-field-hidden';

import { heroContentPositionFields } from './hero-content-position-fields';

const getContentPositionField = (name: string) =>
  getField(
    {
      name: 'heroContentPositionFields()',
      fields: heroContentPositionFields(),
    },
    name,
  );

describe(heroContentPositionFields, () => {
  it('shows contentPositionSplit only for Split', () => {
    const hidden = getHidden(getContentPositionField('contentPositionSplit'));

    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
  });

  it('shows contentPositionBanner only for Banner', () => {
    const hidden = getHidden(getContentPositionField('contentPositionBanner'));

    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
  });
});
