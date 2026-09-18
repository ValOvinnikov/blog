import { HERO_VARIANT } from '@blog/config/constants';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

import { heroImageField } from './hero-image-field';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

describe(heroImageField, () => {
  it('uses the shared imageWithAlt object', () => {
    const field = heroImageField();

    expect(field.type).toBe(imageWithAltSchema.name);
  });

  it('requires an image for Split and Banner, not Stacked', () => {
    const validate = getCustomValidator<TCustomFn>(heroImageField());

    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.SPLIT } }),
    ).toBe('Image is required for the Split and Banner variants.');
    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.BANNER } }),
    ).toBe('Image is required for the Split and Banner variants.');
    expect(
      validate(undefined, { parent: { variant: HERO_VARIANT.STACKED } }),
    ).toBe(true);
  });

  it('is valid when an image is present, regardless of variant', () => {
    const validate = getCustomValidator<TCustomFn>(heroImageField());

    expect(
      validate(
        { asset: { _ref: 'image-abc' } },
        { parent: { variant: HERO_VARIANT.SPLIT } },
      ),
    ).toBe(true);
  });

  it('describes what the image is for without naming variant values as validation', () => {
    const field = heroImageField();

    expect(field.description).toBeTruthy();
    expect(field.description).not.toMatch(/required/i);
    expect(field.description).not.toMatch(/SPLIT|STACKED|BANNER/);
  });
});
