import type { BodyImage } from '@blog/config';

import { toPortableTextImage } from './to-portable-text-image';

const makeBlock = (overrides: Partial<BodyImage> = {}): BodyImage => {
  return {
    _type: 'bodyImage',
    asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
    alt: 'A scenic mountain range',
    ...overrides,
  };
};

describe('toPortableTextImage', () => {
  it('maps the asset reference, alt text, hotspot and crop into an ISanityImage', () => {
    const block = makeBlock({
      hotspot: {
        _type: 'sanity.imageHotspot',
        x: 0.5,
        y: 0.4,
        height: 0.3,
        width: 0.2,
      },
      crop: {
        _type: 'sanity.imageCrop',
        top: 0.1,
        bottom: 0.1,
        left: 0.05,
        right: 0.05,
      },
    });

    expect(toPortableTextImage(block)).toEqual({
      assetId: 'image-abc123-800x600-jpg',
      alt: 'A scenic mountain range',
      hotspot: { x: 0.5, y: 0.4, height: 0.3, width: 0.2 },
      crop: { top: 0.1, bottom: 0.1, left: 0.05, right: 0.05 },
      lqip: undefined,
      dimensions: undefined,
    });
  });

  it('returns undefined when the block has no asset reference', () => {
    expect(
      toPortableTextImage(makeBlock({ asset: undefined })),
    ).toBeUndefined();
  });

  it('falls back to an empty string when alt is missing', () => {
    const image = toPortableTextImage(makeBlock({ alt: undefined }));

    expect(image?.alt).toBe('');
  });

  it('omits hotspot/crop when only partially set', () => {
    const image = toPortableTextImage(
      makeBlock({
        hotspot: { _type: 'sanity.imageHotspot', x: 0.5 },
        crop: { _type: 'sanity.imageCrop', top: 0.1 },
      }),
    );

    expect(image?.hotspot).toBeUndefined();
    expect(image?.crop).toBeUndefined();
  });
});
