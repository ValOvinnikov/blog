import { LINK_TYPE } from '@blog/config';
import type { TRawSeo } from '@blog/service/shared/transformers/resolve-seo';
import type { TRawHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import type {
  TRawLinkRef,
  TRawSharedLink,
} from '@blog/service/shared/transformers/to-link';
import type { TRawPostLink } from '@blog/service/shared/transformers/to-post-link';
import type { TRawSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { TRawSocialLinkRef } from '@blog/service/shared/transformers/to-social-link';

export function makeRawHeadingBlock(
  heading: string,
  overrides: Partial<Omit<TRawHeadingBlock, 'heading'>> = {},
): TRawHeadingBlock {
  return {
    heading,
    supportingText: null,
    ...overrides,
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

export function makeRawSharedLink(
  overrides: Partial<TRawSharedLink> = {},
): TRawSharedLink {
  return {
    label: 'Learn more',
    linkType: LINK_TYPE.EXTERNAL,
    url: '/newsletter',
    internalReference: null,
    openInNewTab: null,
    ...overrides,
  };
}

export function makeRawLinkRef(
  overrides: Partial<TRawLinkRef> = {},
): TRawLinkRef {
  return {
    labelOverride: null,
    link: makeRawSharedLink(),
    ...overrides,
  };
}

export function makeRawSocialLinkRef(
  overrides: Partial<TRawSocialLinkRef> = {},
): TRawSocialLinkRef {
  return {
    platform: 'GITHUB',
    labelOverride: null,
    link: makeRawSharedLink(),
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
