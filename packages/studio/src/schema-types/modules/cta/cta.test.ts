import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  MEDIA_ORDER,
} from '@blog/config/constants';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { getLayout } from '@blog/studio/testing/get-field-layout';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type THiddenFn = (context: { parent?: unknown }) => boolean;

const getCtaField = (name: string) => getField(ctaSchema, name);

const getOptionValues = (field: ReturnType<typeof getCtaField>) => {
  const options = 'options' in field ? field.options : undefined;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? options.list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
};

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

describe('ctaSchema image validation', () => {
  it('requires an image for Banner', () => {
    const validate = getImageValidator();

    expect(
      validate(undefined, { parent: { variant: CTA_VARIANT.BANNER } }),
    ).toBe('Image is required for the Banner and Split variants.');
  });

  it('requires an image for Split', () => {
    const validate = getImageValidator();

    expect(
      validate(undefined, { parent: { variant: CTA_VARIANT.SPLIT } }),
    ).toBe('Image is required for the Banner and Split variants.');
  });

  it('does not require an image for Callout', () => {
    const validate = getImageValidator();

    expect(
      validate(undefined, { parent: { variant: CTA_VARIANT.CALLOUT } }),
    ).toBe(true);
  });

  it('is valid when an image is present, regardless of variant', () => {
    const validate = getImageValidator();

    expect(
      validate(
        { asset: { _ref: 'image-abc' } },
        { parent: { variant: CTA_VARIANT.BANNER } },
      ),
    ).toBe(true);
    expect(
      validate(
        { asset: { _ref: 'image-abc' } },
        { parent: { variant: CTA_VARIANT.SPLIT } },
      ),
    ).toBe(true);
    expect(
      validate(
        { asset: { _ref: 'image-abc' } },
        { parent: { variant: CTA_VARIANT.CALLOUT } },
      ),
    ).toBe(true);
  });
});

describe('ctaSchema contentPositionSplit field', () => {
  it('offers only Left and Right', () => {
    const field = getCtaField('contentPositionSplit');

    expect(getOptionValues(field)).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.RIGHT,
    ]);
  });

  it('defaults to Left', () => {
    const field = getCtaField('contentPositionSplit');

    expect(field.initialValue).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('is visible only for Split', () => {
    const field = getCtaField('contentPositionSplit');

    if (!('hidden' in field) || typeof field.hidden !== 'function') {
      throw new Error(
        'Expected contentPositionSplit field to define a hidden() fn.',
      );
    }

    const hidden = field.hidden as THiddenFn;

    expect(hidden({ parent: { variant: CTA_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: CTA_VARIANT.BANNER } })).toBe(true);
    expect(hidden({ parent: { variant: CTA_VARIANT.CALLOUT } })).toBe(true);
  });
});

describe('ctaSchema contentPositionBanner field', () => {
  it('offers Left, Center and Right', () => {
    const field = getCtaField('contentPositionBanner');

    expect(getOptionValues(field)).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.CENTER,
      CONTENT_ALIGNMENT.RIGHT,
    ]);
  });

  it('defaults to Left', () => {
    const field = getCtaField('contentPositionBanner');

    expect(field.initialValue).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('is visible only for Banner', () => {
    const field = getCtaField('contentPositionBanner');

    if (!('hidden' in field) || typeof field.hidden !== 'function') {
      throw new Error(
        'Expected contentPositionBanner field to define a hidden() fn.',
      );
    }

    const hidden = field.hidden as THiddenFn;

    expect(hidden({ parent: { variant: CTA_VARIANT.BANNER } })).toBe(false);
    expect(hidden({ parent: { variant: CTA_VARIANT.SPLIT } })).toBe(true);
    expect(hidden({ parent: { variant: CTA_VARIANT.CALLOUT } })).toBe(true);
  });
});

describe('ctaSchema contentAlignment field', () => {
  it('offers Left, Center and Right', () => {
    const field = getCtaField('contentAlignment');

    expect(getOptionValues(field)).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.CENTER,
      CONTENT_ALIGNMENT.RIGHT,
    ]);
  });

  it('defaults to Left', () => {
    const field = getCtaField('contentAlignment');

    expect(field.initialValue).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('is visible on every variant', () => {
    const field = getCtaField('contentAlignment');

    expect('hidden' in field ? field.hidden : undefined).toBeUndefined();
  });
});

describe('ctaSchema brandVariant field', () => {
  it('defaults to Secondary', () => {
    const field = getCtaField('brandVariant');

    expect(field.initialValue).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('offers Brand Primary, Primary and Secondary', () => {
    const field = getCtaField('brandVariant');

    expect(getOptionValues(field)).toEqual([
      BRAND_VARIANT.BRAND_PRIMARY,
      BRAND_VARIANT.PRIMARY,
      BRAND_VARIANT.SECONDARY,
    ]);
  });
});

describe('ctaSchema bandTone field', () => {
  it('offers Brand Primary, Primary and Secondary', () => {
    const field = getCtaField('bandTone');

    expect(getOptionValues(field)).toEqual([
      BRAND_VARIANT.BRAND_PRIMARY,
      BRAND_VARIANT.PRIMARY,
      BRAND_VARIANT.SECONDARY,
    ]);
  });

  it('defaults to Primary', () => {
    const field = getCtaField('bandTone');

    expect(field.initialValue).toBe(BRAND_VARIANT.PRIMARY);
  });

  it('is hidden for Banner, visible for the other variants', () => {
    const field = getCtaField('bandTone');

    if (!('hidden' in field) || typeof field.hidden !== 'function') {
      throw new Error('Expected bandTone field to define a hidden() fn.');
    }

    const hidden = field.hidden as THiddenFn;

    expect(hidden({ parent: { variant: CTA_VARIANT.BANNER } })).toBe(true);
    expect(hidden({ parent: { variant: CTA_VARIANT.SPLIT } })).toBe(false);
    expect(hidden({ parent: { variant: CTA_VARIANT.CALLOUT } })).toBe(false);
  });
});

describe('ctaSchema bandTone validation', () => {
  const getBandToneWarningValidator = (): TCustomFn =>
    getCustomValidator<TCustomFn>(getCtaField('bandTone'));

  it('registers a required rule alongside the warning rule', () => {
    const field = getCtaField('bandTone');

    if (!('validation' in field) || !field.validation) {
      throw new Error('Expected bandTone field to define validation.');
    }

    const rule = {
      required: () => 'required-rule',
      custom: () => ({ warning: () => 'warning-rule' }),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    const result = (field.validation as any)(rule);

    expect(result).toEqual(['required-rule', 'warning-rule']);
  });

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

describe('ctaSchema variant field', () => {
  it('keeps variant as a dropdown: required, and it drives several other fields', () => {
    const field = getCtaField('variant');

    expect(getLayout(field)).toBe('dropdown');
    expect(wasRequiredCalled(field)).toBe(true);
  });
});

describe('ctaSchema mobileMediaOrder field', () => {
  it('offers Last and First, defaulting to Last', () => {
    const field = getCtaField('mobileMediaOrder');

    expect(getOptionValues(field)).toEqual([
      MEDIA_ORDER.LAST,
      MEDIA_ORDER.FIRST,
    ]);
    expect(field.initialValue).toBe(MEDIA_ORDER.LAST);
  });

  it('converts to a dropdown: optional, no field depends on it', () => {
    const field = getCtaField('mobileMediaOrder');

    expect(getLayout(field)).toBe('dropdown');
    expect(
      'validation' in field ? field.validation : undefined,
    ).toBeUndefined();
  });
});
