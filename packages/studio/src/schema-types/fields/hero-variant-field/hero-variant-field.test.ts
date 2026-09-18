import { HERO_VARIANT } from '@blog/config/constants';

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

const getLayout = (field: { options?: unknown }) => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

const wasRequiredCalled = (field: { validation?: unknown }) => {
  if (!field.validation) {
    throw new Error('Expected field to define validation.');
  }

  let requiredCalled = false;
  const rule = {
    required: () => {
      requiredCalled = true;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return requiredCalled;
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
