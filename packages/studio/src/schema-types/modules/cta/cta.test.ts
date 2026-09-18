import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config/constants';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type THiddenFn = (context: { parent?: unknown }) => boolean;

const getCtaField = (name: string) => getField(ctaSchema, name);

const getImageField = () => {
  const imageField = getField(ctaSchema, 'image');

  if (!('validation' in imageField) || !imageField.validation) {
    throw new Error(
      'Expected ctaSchema to define an image field with validation.',
    );
  }

  return imageField;
};

const getImageValidator = (): TCustomFn =>
  getCustomValidator<TCustomFn>(getImageField());

const getHiddenFn = (fieldName: string): THiddenFn => {
  const field = getCtaField(fieldName);

  if (!('hidden' in field) || typeof field.hidden !== 'function') {
    throw new Error(`Expected "${fieldName}" field to define a hidden() fn.`);
  }

  return field.hidden as THiddenFn;
};

describe('ctaSchema image validation', () => {
  it.each([
    [
      CTA_VARIANT.BANNER,
      'Image is required for the Banner and Split variants.',
    ],
    [CTA_VARIANT.SPLIT, 'Image is required for the Banner and Split variants.'],
    [CTA_VARIANT.CALLOUT, true],
  ])('with no image, variant %s → %j', (variant, expected) => {
    const validate = getImageValidator();

    expect(validate(undefined, { parent: { variant } })).toBe(expected);
  });

  it('is valid when an image is present, regardless of variant', () => {
    const validate = getImageValidator();

    for (const variant of [
      CTA_VARIANT.BANNER,
      CTA_VARIANT.SPLIT,
      CTA_VARIANT.CALLOUT,
    ]) {
      expect(
        validate({ asset: { _ref: 'image-abc' } }, { parent: { variant } }),
      ).toBe(true);
    }
  });
});

describe('ctaSchema contentPositionSplit field', () => {
  it('is visible only for Split', () => {
    const hidden = getHiddenFn('contentPositionSplit');

    expect(hidden({ parent: { variant: CTA_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: CTA_VARIANT.BANNER } })).toBe(true);
    expect(hidden({ parent: { variant: CTA_VARIANT.CALLOUT } })).toBe(true);
  });
});

describe('ctaSchema contentPositionBanner field', () => {
  it('is visible only for Banner', () => {
    const hidden = getHiddenFn('contentPositionBanner');

    expect(hidden({ parent: { variant: CTA_VARIANT.BANNER } })).toBe(false);
    expect(hidden({ parent: { variant: CTA_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: CTA_VARIANT.CALLOUT } })).toBe(true);
  });
});

describe('ctaSchema bandTone field', () => {
  it('is hidden for Banner, visible for the other variants', () => {
    const hidden = getHiddenFn('bandTone');

    expect(hidden({ parent: { variant: CTA_VARIANT.BANNER } })).toBe(true);
    expect(hidden({ parent: { variant: CTA_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: CTA_VARIANT.CALLOUT } })).toBe(false);
  });
});

describe('ctaSchema bandTone validation', () => {
  const getBandToneWarningValidator = (): TCustomFn =>
    getCustomValidator<TCustomFn>(getCtaField('bandTone'));

  it('warns when Band Tone matches Brand Variant on a non-Banner variant', () => {
    const validate = getBandToneWarningValidator();

    const result = validate(BRAND_VARIANT.PRIMARY, {
      parent: {
        variant: CTA_VARIANT.CALLOUT,
        brandVariant: BRAND_VARIANT.PRIMARY,
      },
    });

    expect(result).not.toBe(true);
    expect(typeof result).toBe('string');
  });

  it('does not warn when Band Tone differs from Brand Variant', () => {
    const validate = getBandToneWarningValidator();

    expect(
      validate(BRAND_VARIANT.PRIMARY, {
        parent: {
          variant: CTA_VARIANT.CALLOUT,
          brandVariant: BRAND_VARIANT.SECONDARY,
        },
      }),
    ).toBe(true);
  });

  it('does not warn for Banner, even when the values match', () => {
    const validate = getBandToneWarningValidator();

    expect(
      validate(BRAND_VARIANT.PRIMARY, {
        parent: {
          variant: CTA_VARIANT.BANNER,
          brandVariant: BRAND_VARIANT.PRIMARY,
        },
      }),
    ).toBe(true);
  });
});
