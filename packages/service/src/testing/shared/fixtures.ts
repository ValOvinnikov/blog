import type { imageWithAltFragment } from '@blog/service/shared/fragments/image';
import type { TRawSeo } from '@blog/service/shared/transformers/resolve-seo';
import type {
  TRawHeadingBlock,
  TRawRequiredHeadingBlock,
} from '@blog/service/shared/transformers/to-heading-block';
import type { TRawPostLink } from '@blog/service/shared/transformers/to-post-link';
import type { TRawSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferFragmentType } from 'groqd';

type TRawImage = InferFragmentType<typeof imageWithAltFragment>;

export function makeRawHeadingBlock(
  heading: string,
  overrides: Partial<Omit<TRawRequiredHeadingBlock, 'heading'>> = {},
): TRawRequiredHeadingBlock {
  return {
    heading,
    supportingText: null,
    ...overrides,
  };
}

export function makeRawOptionalHeadingBlock(
  overrides: Partial<TRawHeadingBlock> = {},
): TRawHeadingBlock {
  return {
    heading: null,
    supportingText: null,
    ...overrides,
  };
}

export function makeRawImage(alt = 'Alt text'): TRawImage {
  return {
    _type: 'imageWithAlt',
    asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
    alt,
    hotspot: null,
    crop: null,
  };
}

export function makeRawPostLink(
  overrides: Partial<TRawPostLink> = {},
): TRawPostLink {
  return {
    _id: 'post-1',
    headingBlock: { heading: 'Hello World' },
    slug: 'hello-world',
    ...overrides,
  };
}

export function makeRawSeo(overrides: Partial<TRawSeo> = {}): TRawSeo {
  return {
    metaTitle: 'A sufficiently descriptive meta title for testing',
    metaDescription: null,
    openGraph: null,
    ...overrides,
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
