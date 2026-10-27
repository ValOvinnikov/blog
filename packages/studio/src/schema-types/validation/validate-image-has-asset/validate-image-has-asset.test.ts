import type { TMaybeUndefined } from '@blog/config/types';
import { validateImageHasAsset } from '@blog/studio/schema-types/validation/validate-image-has-asset/validate-image-has-asset';
import { mockReference } from '@blog/studio/testing/mock-documents';
import { MOCK_VALIDATION_MESSAGE } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';

faker.seed(6019);

const MOCK_ASSET = mockReference(faker.string.uuid());
const MOCK_ALT = faker.lorem.sentence();

type TImageValue = TMaybeUndefined<
  { asset?: unknown } & Record<string, unknown>
>;

describe(validateImageHasAsset, () => {
  const validate = validateImageHasAsset(MOCK_VALIDATION_MESSAGE);

  it.each<[string, TImageValue, string | true]>([
    ['passes when the value carries an asset', { asset: MOCK_ASSET }, true],
    [
      'fails with the given message when the value is not set',
      undefined,
      MOCK_VALIDATION_MESSAGE,
    ],
    [
      'fails when alt text or crop data remains but the asset is gone',
      { alt: MOCK_ALT, crop: { top: 0 } },
      MOCK_VALIDATION_MESSAGE,
    ],
  ])('%s', (_description, image, expected) => {
    expect(validate(image)).toBe(expected);
  });
});
