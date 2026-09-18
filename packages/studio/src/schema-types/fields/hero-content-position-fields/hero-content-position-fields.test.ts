import { CONTENT_ALIGNMENT, HERO_VARIANT } from '@blog/config/constants';
import { HERO_FIELDSET_CONTENT_POSITION } from '@blog/studio/schema-types/fields/hero-fieldsets/hero-fieldsets';

import { heroContentPositionFields } from './hero-content-position-fields';

type THiddenFn = (context: { parent?: unknown }) => boolean;

const getField = (name: string) => {
  const field = heroContentPositionFields().find(
    (field) => field.name === name,
  );

  if (!field) {
    throw new Error(
      `Expected heroContentPositionFields() to define a "${name}" field.`,
    );
  }

  return field;
};

const getHidden = (field: { hidden?: unknown }): THiddenFn => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as THiddenFn;
};

describe(heroContentPositionFields, () => {
  it('shows contentPositionSplit only for Split, and tags it into the shared fieldset', () => {
    const field = getField('contentPositionSplit');
    const hidden = getHidden(field);

    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect((field as { fieldset?: string }).fieldset).toBe(
      HERO_FIELDSET_CONTENT_POSITION,
    );
  });

  it('shows contentPositionBanner only for Banner, and tags it into the shared fieldset', () => {
    const field = getField('contentPositionBanner');
    const hidden = getHidden(field);

    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect((field as { fieldset?: string }).fieldset).toBe(
      HERO_FIELDSET_CONTENT_POSITION,
    );
  });

  it('always emits the contentAlignment baseline, tagged into the shared fieldset', () => {
    const field = getField('contentAlignment') as { fieldset?: string };

    expect(field.fieldset).toBe(HERO_FIELDSET_CONTENT_POSITION);
  });

  it('defaults contentAlignment to Left', () => {
    expect(getField('contentAlignment').initialValue).toBe(
      CONTENT_ALIGNMENT.LEFT,
    );
  });
});
