import { CTA_VARIANT } from '@blog/config/constants';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

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
