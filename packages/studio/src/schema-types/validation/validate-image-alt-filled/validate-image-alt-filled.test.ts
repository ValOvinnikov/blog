import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validateImageAltFilled } from '@blog/studio/schema-types/validation/validate-image-alt-filled/validate-image-alt-filled';
import {
  mockLocalizedValue,
  mockReference,
} from '@blog/studio/testing/mock-documents';
import { MOCK_VALIDATION_MESSAGE } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import type { ValidationContext } from 'sanity';

faker.seed(6020);

const { EN } = LOCALE_ISO_CODES;

const MOCK_ASSET = mockReference(faker.string.uuid());
const MOCK_ALT = faker.lorem.sentence();

const contextWithImage = (parent?: { asset?: unknown }): ValidationContext =>
  ({ parent }) as unknown as ValidationContext;

describe(validateImageAltFilled, () => {
  const validate = validateImageAltFilled(MOCK_VALIDATION_MESSAGE);

  it.each([
    [
      'passes with no alt when the image is not set',
      undefined,
      undefined,
      true,
    ],
    ['passes with no alt when the image has no asset', undefined, {}, true],
    [
      'fails when the image has an asset and no default-language alt',
      undefined,
      { asset: MOCK_ASSET },
      MOCK_VALIDATION_MESSAGE,
    ],
    [
      'passes when the image has an asset and a default-language alt',
      MOCK_ALT,
      { asset: MOCK_ASSET },
      true,
    ],
  ])('%s', (_description, altText, image, expected) => {
    const alt = [mockLocalizedValue(EN, altText)];

    expect(validate(alt, contextWithImage(image))).toBe(expected);
  });
});
