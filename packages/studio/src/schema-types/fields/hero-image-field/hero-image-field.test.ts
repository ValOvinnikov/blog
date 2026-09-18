import { HERO_VARIANT } from '@blog/config/constants';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

import { heroImageField } from './hero-image-field';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

describe(heroImageField, () => {
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
});
