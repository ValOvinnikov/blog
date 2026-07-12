import type { TRawPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TRawSanityImage } from '@blog/service/shared/transformers/to-sanity-image';

type TRawImage = TRawPostCard['mainImage'];

export function makeRawImage(alt = 'Alt text'): TRawImage {
  return {
    _type: 'imageWithAlt',
    asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
    alt,
    hotspot: null,
    crop: null,
  };
}

export function makeRawSanityImage(alt = 'Alt text'): TRawSanityImage {
  return {
    alt,
    hotspot: null,
    crop: null,
    asset: {
      _id: 'image-abc123-800x600-jpg',
      metadata: {
        lqip: 'data:image/png;base64,abc123',
        dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
      },
    },
  };
}
