import { makeRawImage } from '@blog/service/testing/shared/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { buildImageUrl } from './build-image-url';

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/abc123-800x600.jpg',
  ),
}));

describe('buildImageUrl', () => {
  it('returns undefined for null', () => {
    expect(buildImageUrl(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(buildImageUrl(undefined)).toBeUndefined();
  });

  it('returns undefined when image has no asset', () => {
    expect(
      buildImageUrl({
        _type: 'imageWithAlt',
        asset: null,
        alt: 'x',
        hotspot: null,
        crop: null,
      }),
    ).toBeUndefined();
  });

  it('returns a URL string for a valid image', () => {
    const result = buildImageUrl(makeRawImage());
    expect(typeof result).toBe('string');
    expect(result).toContain('sanity.io');
  });

  it('returns undefined when urlForImage throws', async () => {
    const { urlForImage } = await import('@blog/service/sanity/image');
    vi.mocked(urlForImage).mockImplementationOnce(() => {
      throw new Error('builder error');
    });
    expect(buildImageUrl(makeRawImage())).toBeUndefined();
  });
});
