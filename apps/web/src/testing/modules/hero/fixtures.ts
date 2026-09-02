import type { ISanityImage } from '@blog/config';

export const makeSanityImage = (
  overrides: Partial<ISanityImage> = {},
): ISanityImage => {
  return {
    assetId: 'image-6205dacc42424f7a83d8e20a7000d895f7cdc7dd-2400x1260-png',
    alt: 'A scenic mountain range',
    hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
    crop: undefined,
    lqip: undefined,
    dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
    cdnBaseUrl: 'https://cdn.sanity.io/images/test-project/test-dataset/',
    ...overrides,
  };
};
