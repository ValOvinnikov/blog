import { describe, expect, it } from 'vitest';
import { urlForImage } from './image';

describe('urlForImage', () => {
  it('returns null for null input', () => {
    expect(urlForImage(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(urlForImage(undefined)).toBeNull();
  });

  it('returns a URL string for a valid image reference', () => {
    const result = urlForImage({
      _ref: 'image-abc123def456abc1-800x600-jpg',
    });
    expect(typeof result).toBe('string');
    expect(result).toContain('ccs8c2no');
    expect(result).toContain('production');
  });

  it('returns a URL string for an image object with dereferenced asset', () => {
    // The URL filename must follow the Sanity format: {assetId}-{w}x{h}.{ext}
    // so that urlToId() produces a valid image ref the builder can parse.
    const result = urlForImage({
      asset: {
        _id: 'image-abc123def456abc1-800x600-jpg',
        _type: 'sanity.imageAsset' as const,
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-01T00:00:00Z',
        _rev: 'abc',
        url: 'https://cdn.sanity.io/images/ccs8c2no/production/abc123def456abc1-800x600.jpg',
        path: 'images/ccs8c2no/production/abc123def456abc1-800x600.jpg',
        assetId: 'abc123def456abc1',
        extension: 'jpg',
      },
    });
    expect(typeof result).toBe('string');
    expect(result).toContain('ccs8c2no');
  });
});
