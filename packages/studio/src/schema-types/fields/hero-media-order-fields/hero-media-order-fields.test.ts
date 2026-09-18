import { HERO_VARIANT, MEDIA_ORDER } from '@blog/config/constants';

import { heroMediaOrderFields } from './hero-media-order-fields';

type THiddenFn = (context: { parent?: unknown }) => boolean;

const getField = (name: string) => {
  const field = heroMediaOrderFields().find((field) => field.name === name);

  if (!field) {
    throw new Error(
      `Expected heroMediaOrderFields() to define a "${name}" field.`,
    );
  }

  return field;
};

const getLayout = (field: { options?: unknown }) => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

const getOptionValues = (field: { options?: unknown }) => {
  const options = field.options;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? (options as { list: unknown }).list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
};

const getHidden = (field: { hidden?: unknown }): THiddenFn => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as THiddenFn;
};

describe(heroMediaOrderFields, () => {
  it('shows mediaOrderSplit only for Split, defaulting to Last', () => {
    const field = getField('mediaOrderSplit');
    const hidden = getHidden(field);

    expect(getOptionValues(field)).toEqual([
      MEDIA_ORDER.LAST,
      MEDIA_ORDER.FIRST,
    ]);
    expect(field.initialValue).toBe(MEDIA_ORDER.LAST);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(getLayout(field)).toBe('dropdown');
    expect(field.validation).toBeUndefined();
  });

  it('shows mediaOrderStacked only for Stacked, defaulting to Last', () => {
    const field = getField('mediaOrderStacked');
    const hidden = getHidden(field);

    expect(getOptionValues(field)).toEqual([
      MEDIA_ORDER.LAST,
      MEDIA_ORDER.FIRST,
    ]);
    expect(field.initialValue).toBe(MEDIA_ORDER.LAST);
    expect(hidden({ parent: { variant: HERO_VARIANT.STACKED } })).toBe(false);
    expect(hidden({ parent: { variant: HERO_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    expect(getLayout(field)).toBe('dropdown');
    expect(field.validation).toBeUndefined();
  });

  it('Banner emits neither media order field', () => {
    for (const name of ['mediaOrderSplit', 'mediaOrderStacked']) {
      const hidden = getHidden(getField(name));
      expect(hidden({ parent: { variant: HERO_VARIANT.BANNER } })).toBe(true);
    }
  });
});
