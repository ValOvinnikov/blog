import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validateImageAltFilled } from '@blog/studio/schema-types/validation/validate-image-alt-filled/validate-image-alt-filled';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import type { ValidationContext } from 'sanity';

const { EN } = LOCALE_ISO_CODES;

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
    expect(validate([mockLocalizedValue(EN)], buildContext(parent))).toBe(true);
  });

  it('fails when the image has an asset and an empty default-language alt', () => {
    expect(
      validate([mockLocalizedValue(EN)], buildContext({ asset: ASSET })),
    ).toBe(MESSAGE);
  });

  it('passes when the image has an asset and a default-language alt', () => {
    expect(
      validate(
        [mockLocalizedValue(EN, 'A portrait')],
        buildContext({ asset: ASSET }),
      ),
    ).toBe(true);
  });
});
