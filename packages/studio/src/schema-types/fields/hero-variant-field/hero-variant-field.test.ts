import { HERO_VARIANT } from '@blog/config/constants';
import { getLayout } from '@blog/studio/testing/get-field-layout';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';

import { heroVariantField } from './hero-variant-field';

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

describe(heroVariantField, () => {
  it('offers Split, Stacked and Banner, defaulting to Split', () => {
    const field = heroVariantField();

    expect(getOptionValues(field)).toEqual([
      HERO_VARIANT.SPLIT,
      HERO_VARIANT.STACKED,
      HERO_VARIANT.BANNER,
    ]);
    expect(field.initialValue).toBe(HERO_VARIANT.SPLIT);
  });

  it('is a required dropdown that drives which other fields show', () => {
    const field = heroVariantField();

    expect(getLayout(field)).toBe('dropdown');
    expect(wasRequiredCalled(field)).toBe(true);
  });

  it('describes what each variant looks like', () => {
    const field = heroVariantField();

    expect(field.description).toBeTruthy();
    expect(field.description).toMatch(/split/i);
    expect(field.description).toMatch(/stacked/i);
    expect(field.description).toMatch(/banner/i);
  });
});
