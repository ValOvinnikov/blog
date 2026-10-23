import {
  mockRawSanityImage,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';

import { toSanityImage } from './to-sanity-image';

describe(toSanityImage, () => {
  it('maps all fields from raw input', () => {
    const result = toSanityImage(mockRawSanityImage());

    expect(result).toEqual(mockSanityImageView());
  });

  it('maps hotspot and crop when present', () => {
    const raw = {
      ...mockRawSanityImage(),
      hotspot: {
        _type: 'sanity.imageHotspot' as const,
        x: 0.5,
        y: 0.5,
        height: 0.8,
        width: 0.8,
      },
      crop: {
        _type: 'sanity.imageCrop' as const,
        top: 0.1,
        bottom: 0.1,
        left: 0.1,
        right: 0.1,
      },
    };

    const result = toSanityImage(raw);

    expect(result?.hotspot).toEqual({
      x: 0.5,
      y: 0.5,
      height: 0.8,
      width: 0.8,
    });
    expect(result?.crop).toEqual({
      top: 0.1,
      bottom: 0.1,
      left: 0.1,
      right: 0.1,
    });
  });

  it('maps a missing alt text to an empty string', () => {
    const result = toSanityImage({ ...mockRawSanityImage(), alt: null });

    expect(result?.alt).toBe('');
  });

  it('returns undefined lqip and dimensions when metadata is absent', () => {
    const image = mockRawSanityImage();
    const raw = { ...image, asset: { ...image.asset, metadata: null } };

    const result = toSanityImage(raw);

    expect(result?.lqip).toBeUndefined();
    expect(result?.dimensions).toBeUndefined();
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
