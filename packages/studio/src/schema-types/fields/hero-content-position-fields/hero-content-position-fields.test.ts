import { CONTENT_ALIGNMENT, HERO_VARIANT } from '@blog/config/constants';
import { HERO_FIELDSET_CONTENT_POSITION } from '@blog/studio/schema-types/modules/hero-fieldsets/hero-fieldsets';
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
  it('shows contentPositionSplit only for Split, and tags it into the shared fieldset', () => {
    const field = getContentPositionField('contentPositionSplit');
    const hidden = getHidden(field);

    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect((field as { fieldset?: string }).fieldset).toBe(
      HERO_FIELDSET_CONTENT_POSITION,
    );
  });

  it('shows contentPositionBanner only for Banner, and tags it into the shared fieldset', () => {
    const field = getContentPositionField('contentPositionBanner');
    const hidden = getHidden(field);

    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect((field as { fieldset?: string }).fieldset).toBe(
      HERO_FIELDSET_CONTENT_POSITION,
    );
  });

  it('always emits the contentAlignment baseline, tagged into the shared fieldset', () => {
    const field = getContentPositionField('contentAlignment') as {
      fieldset?: string;
    };

    expect(field.fieldset).toBe(HERO_FIELDSET_CONTENT_POSITION);
  });

  it('defaults contentAlignment to Left', () => {
    expect(getContentPositionField('contentAlignment').initialValue).toBe(
      CONTENT_ALIGNMENT.LEFT,
    );
  });
});
