import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';
import { describe, expect, it } from 'vitest';

import { toSanityImage } from './to-sanity-image';

describe('toSanityImage', () => {
  it('maps all fields from raw input', () => {
    const raw = makeRawSanityImage();
    const result = toSanityImage(raw);

    expect(result).toEqual({
      assetId: 'image-abc123-800x600-jpg',
      alt: 'Alt text',
      hotspot: undefined,
      crop: undefined,
      lqip: 'data:image/png;base64,abc123',
      dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
    });
  });

  it('maps hotspot and crop when present', () => {
    const raw = {
      ...makeRawSanityImage(),
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

  it('returns undefined lqip and dimensions when metadata is absent', () => {
    const raw = {
      ...makeRawSanityImage(),
      asset: { _id: 'image-abc123-800x600-jpg', metadata: null },
    };

    const result = toSanityImage(raw);

    expect(result?.lqip).toBeUndefined();
    expect(result?.dimensions).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(toSanityImage(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(toSanityImage(undefined)).toBeUndefined();
  });

  it('returns undefined when asset is absent', () => {
    const raw = { ...makeRawSanityImage(), asset: null };
    expect(toSanityImage(raw as never)).toBeUndefined();
  });
});
