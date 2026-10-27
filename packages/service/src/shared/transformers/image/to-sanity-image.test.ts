import {
  mockRawSanityImage,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';

import { toSanityImage } from './to-sanity-image';

const MOCK_HOTSPOT = { x: 0.5, y: 0.4, height: 0.8, width: 0.7 };
const MOCK_CROP = { top: 0.1, bottom: 0.2, left: 0.3, right: 0.05 };

describe(toSanityImage, () => {
  it('maps all fields from raw input', () => {
    const result = toSanityImage(mockRawSanityImage());

    expect(result).toEqual(mockSanityImageView());
  });

  it('maps hotspot and crop when present', () => {
    const result = toSanityImage({
      ...mockRawSanityImage(),
      hotspot: { _type: 'sanity.imageHotspot', ...MOCK_HOTSPOT },
      crop: { _type: 'sanity.imageCrop', ...MOCK_CROP },
    });

    expect(result).toEqual({
      ...mockSanityImageView(),
      hotspot: MOCK_HOTSPOT,
      crop: MOCK_CROP,
    });
  });

  it('maps a missing alt text to an empty string', () => {
    const result = toSanityImage({ ...mockRawSanityImage(), alt: null });

    expect(result).toEqual(mockSanityImageView(''));
  });

  it('returns undefined lqip and dimensions when metadata is absent', () => {
    const image = mockRawSanityImage();

    const result = toSanityImage({
      ...image,
      asset: { ...image.asset, metadata: null },
    });

    expect(result).toEqual({
      ...mockSanityImageView(),
      lqip: undefined,
      dimensions: undefined,
    });
  });

  it.each([
    { input: 'null', raw: null },
    { input: 'undefined', raw: undefined },
    {
      input: 'an image with no asset',
      raw: { ...mockRawSanityImage(), asset: null },
    },
  ])('returns undefined for $input', ({ raw }) => {
    const result = toSanityImage(raw);

    expect(result).toBeUndefined();
  });
});
