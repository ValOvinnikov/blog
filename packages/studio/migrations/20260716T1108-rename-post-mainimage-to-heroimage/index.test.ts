import { faker } from '@faker-js/faker';
import { at, set, unset } from 'sanity/migrate';

import { renamePostMainImageToHeroImage } from './index';

faker.seed(1);

const MOCK_ASSET_REF = faker.string.uuid();
const MOCK_ALT = faker.lorem.words();
const MOCK_OTHER_ALT = faker.lorem.words();

const mockImage = (alt: string) => ({
  _type: 'imageWithAlt',
  asset: { _type: 'reference', _ref: MOCK_ASSET_REF },
  alt,
});

describe(renamePostMainImageToHeroImage, () => {
  it('moves mainImage onto heroImage and unsets mainImage', () => {
    const mainImage = mockImage(MOCK_ALT);

    const result = renamePostMainImageToHeroImage({ mainImage });

    expect(result).toEqual([
      at('heroImage', set(mainImage)),
      at('mainImage', unset()),
    ]);
  });

  it('is a no-op for a doc that never had mainImage', () => {
    const result = renamePostMainImageToHeroImage({});

    expect(result).toBeUndefined();
  });

  it('leaves a doc already migrated to heroImage alone', () => {
    const result = renamePostMainImageToHeroImage({
      heroImage: mockImage(MOCK_ALT),
    });

    expect(result).toBeUndefined();
  });

  it('leaves a doc with both fields set alone', () => {
    const result = renamePostMainImageToHeroImage({
      mainImage: mockImage(MOCK_OTHER_ALT),
      heroImage: mockImage(MOCK_ALT),
    });

    expect(result).toBeUndefined();
  });
});
