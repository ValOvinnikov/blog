import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
} from '@blog/config/constants';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type THiddenFn = (context: { parent?: unknown }) => boolean;

const getField = (name: string) => {
  const field = ctaSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected ctaSchema to define a "${name}" field.`);
  }

  return field;
};

const getOptionValues = (field: ReturnType<typeof getField>) => {
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
  const imageField = ctaSchema.fields?.find(
    (field): field is typeof field & { name: 'image' } =>
      'name' in field && field.name === 'image',
  );

  if (!imageField || !('validation' in imageField) || !imageField.validation) {
    throw new Error(
      'Expected ctaSchema to define an image field with validation.',
    );
  }

  return imageField;
};

const getImageValidator = (): TCustomFn => {
  const imageField = getImageField();

  let customFn: TCustomFn | undefined;

  const rule = {
    custom: (fn: TCustomFn) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (imageField.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected image field validation to register a custom() rule.',
    );
  }

  return customFn;
};

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
    const field = getField('contentPositionSplit');

    expect(getOptionValues(field)).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.RIGHT,
    ]);
  });

  it('defaults to Left', () => {
    const field = getField('contentPositionSplit');

    expect(field.initialValue).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('is visible only for Split', () => {
    const field = getField('contentPositionSplit');

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
    const field = getField('contentPositionBanner');

    expect(getOptionValues(field)).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.CENTER,
      CONTENT_ALIGNMENT.RIGHT,
    ]);
  });

  it('defaults to Left', () => {
    const field = getField('contentPositionBanner');

    expect(field.initialValue).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('is visible only for Banner', () => {
    const field = getField('contentPositionBanner');

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
    const field = getField('contentAlignment');

    expect(getOptionValues(field)).toEqual([
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.CENTER,
      CONTENT_ALIGNMENT.RIGHT,
    ]);
  });

  it('has no initial value', () => {
    const field = getField('contentAlignment');

    expect(field.initialValue).toBeUndefined();
  });

  it('is visible on every variant', () => {
    const field = getField('contentAlignment');

    expect('hidden' in field ? field.hidden : undefined).toBeUndefined();
  });
});

describe('ctaSchema brandVariant field', () => {
  it('defaults to Secondary', () => {
    const field = getField('brandVariant');

    expect(field.initialValue).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('offers Brand Primary, Primary and Secondary', () => {
    const field = getField('brandVariant');

    expect(getOptionValues(field)).toEqual([
      BRAND_VARIANT.BRAND_PRIMARY,
      BRAND_VARIANT.PRIMARY,
      BRAND_VARIANT.SECONDARY,
    ]);
  });
});

describe('ctaSchema bandTone field', () => {
  it('offers Brand Primary, Primary and Secondary', () => {
    const field = getField('bandTone');

    expect(getOptionValues(field)).toEqual([
      BRAND_VARIANT.BRAND_PRIMARY,
      BRAND_VARIANT.PRIMARY,
      BRAND_VARIANT.SECONDARY,
    ]);
  });

  it('defaults to Primary', () => {
    const field = getField('bandTone');

    expect(field.initialValue).toBe(BRAND_VARIANT.PRIMARY);
  });

  it('is hidden for Banner, visible for the other variants', () => {
    const field = getField('bandTone');

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
  const getBandToneWarningValidator = (): TCustomFn => {
    const field = getField('bandTone');

    if (!('validation' in field) || !field.validation) {
      throw new Error('Expected bandTone field to define validation.');
    }

    let customFn: TCustomFn | undefined;

    const rule = {
      required: () => 'required-rule',
      custom: (fn: TCustomFn) => {
        customFn = fn;
        return { warning: () => 'warning-rule' };
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    if (!customFn) {
      throw new Error(
        'Expected bandTone validation to register a custom() warning rule.',
      );
    }

    return customFn;
  };

  it('registers a required rule alongside the warning rule', () => {
    const field = getField('bandTone');

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
