import type { TRawPostCard } from '#/shared/transformers/to-post-card';

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
