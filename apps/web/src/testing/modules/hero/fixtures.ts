import type { ISanityImage } from '@blog/config';

export function makeSanityImage(
  overrides: Partial<ISanityImage> = {},
): ISanityImage {
  return {
    assetId: 'image-abc123-1600x1200-jpg',
    alt: 'A scenic mountain range',
    hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
    crop: undefined,
    lqip: undefined,
    dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
    ...overrides,
  };
}
