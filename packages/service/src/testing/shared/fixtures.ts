import { LINK_TYPE, SOCIAL_PLATFORMS } from '@blog/config';
import type { TRawSeo } from '@blog/service/shared/transformers/resolve-seo';
import type { TRawHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import type { TRawLinkDocument } from '@blog/service/shared/transformers/to-link-document';
import type { TRawPortableTextMarkDef } from '@blog/service/shared/transformers/to-portable-text-mark-def';
import type { TRawPostLink } from '@blog/service/shared/transformers/to-post-link';
import type { TRawSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { TRawSocialProfile } from '@blog/service/shared/transformers/to-social-profile';

export function makeRawExternalLinkDocument(
  overrides: Partial<TRawLinkDocument> = {},
): TRawLinkDocument {
  return {
    label: 'Learn more',
    linkType: LINK_TYPE.EXTERNAL,
    url: 'https://example.com',
    internalReference: null,
    openInNewTab: null,
    ...overrides,
  };
}

export function makeRawInternalLinkDocument(
  overrides: Partial<TRawLinkDocument> = {},
): TRawLinkDocument {
  return {
    label: 'Learn more',
    linkType: LINK_TYPE.INTERNAL,
    internalReference: null,
    url: null,
    openInNewTab: null,
    ...overrides,
  };
}

export function makeRawPortableTextMarkDef(
  overrides: Partial<TRawPortableTextMarkDef> = {},
): TRawPortableTextMarkDef {
  return {
    _key: 'mark-1',
    _type: 'linkRef',
    link: makeRawExternalLinkDocument(),
    ...overrides,
  };
}

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

export function makeRawSocialProfile(
  overrides: Partial<TRawSocialProfile> = {},
): TRawSocialProfile {
  return {
    platform: SOCIAL_PLATFORMS.GITHUB,
    link: makeRawExternalLinkDocument({ url: 'https://github.com/janedoe' }),
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
