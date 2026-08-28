import { at, set, unset } from 'sanity/migrate';

import { renamePostMainImageToHeroImage } from './index';

describe(renamePostMainImageToHeroImage, () => {
  it('moves mainImage onto heroImage and unsets mainImage', () => {
    const mainImage = {
      _type: 'imageWithAlt',
      asset: { _type: 'reference', _ref: 'image-abc123-800x600-jpg' },
      alt: 'A description',
    };

    const result = renamePostMainImageToHeroImage({ mainImage });

    expect(result).toEqual([
      at('heroImage', set(mainImage)),
      at('mainImage', unset()),
    ]);
  });

  it('is a no-op for a doc that never had mainImage (optional field)', () => {
    const result = renamePostMainImageToHeroImage({});

    expect(result).toBeUndefined();
  });

  it('is idempotent — a doc already migrated to heroImage is left alone', () => {
    const heroImage = {
      _type: 'imageWithAlt',
      asset: { _type: 'reference', _ref: 'image-abc123-800x600-jpg' },
      alt: 'A description',
    };

    const result = renamePostMainImageToHeroImage({ heroImage });

    expect(result).toBeUndefined();
  });

  it('is idempotent — a doc with both fields set is left alone, not clobbered', () => {
    const mainImage = { _type: 'imageWithAlt', alt: 'Old' };
    const heroImage = { _type: 'imageWithAlt', alt: 'Already migrated' };

    const result = renamePostMainImageToHeroImage({ mainImage, heroImage });

    expect(result).toBeUndefined();
  });
});
