import { validateImageAltFilled } from '@blog/studio/schema-types/validation/validate-image-alt-filled/validate-image-alt-filled';
import type { ValidationContext } from 'sanity';

const MESSAGE = 'Describe the image.';

const buildContext = (parent?: { asset?: unknown }): ValidationContext =>
  ({ parent }) as unknown as ValidationContext;

const ASSET = { _ref: 'image-abc' };

describe(validateImageAltFilled, () => {
  const validate = validateImageAltFilled(MESSAGE);

  it.each([
    ['the image is not set', undefined],
    ['the image has no asset', {}],
  ])('passes with no alt when %s', (_description, parent) => {
    expect(
      validate([{ _key: 'EN', language: 'EN' }], buildContext(parent)),
    ).toBe(true);
  });

  it('fails when the image has an asset and an empty default-language alt', () => {
    expect(
      validate(
        [{ _key: 'EN', language: 'EN' }],
        buildContext({ asset: ASSET }),
      ),
    ).toBe(MESSAGE);
  });

  it('passes when the image has an asset and a default-language alt', () => {
    expect(
      validate(
        [{ _key: 'EN', language: 'EN', value: 'A portrait' }],
        buildContext({ asset: ASSET }),
      ),
    ).toBe(true);
  });
});
