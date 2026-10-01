import { validateImageHasAsset } from '@blog/studio/schema-types/validation/validate-image-has-asset/validate-image-has-asset';

const MESSAGE = 'Upload an image.';

describe(validateImageHasAsset, () => {
  const validate = validateImageHasAsset(MESSAGE);

  it('passes when the value carries an asset', () => {
    expect(validate({ asset: { _ref: 'image-abc' } })).toBe(true);
  });

  it('fails with the given message when the value is undefined', () => {
    expect(validate(undefined)).toBe(MESSAGE);
  });

  it('fails when alt text or crop data remains but the asset is gone', () => {
    expect(validate({ alt: 'A screenshot', crop: { top: 0 } } as never)).toBe(
      MESSAGE,
    );
  });
});
