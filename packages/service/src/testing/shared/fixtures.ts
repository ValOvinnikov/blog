import {
  CONTAINER_WIDTH,
  IMAGE_LAYOUT,
  LINK_TYPE,
  PORTABLE_TEXT_BLOCK_TYPE,
  SOCIAL_PLATFORMS,
  SPACING_SCALE,
  type ILink,
  type ISanityImage,
} from '@blog/config';
import type { postLinkFragment } from '@blog/service/shared/fragments/post/post-link';
import type { TRawHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import type { TRawSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import type {
  TRawHeroLayout,
  TRawWideLayout,
} from '@blog/service/shared/transformers/layout/to-layout';
import type { TRawLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import type { TRawPersonProfile } from '@blog/service/shared/transformers/person/to-person-profile';
import type { TRawPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';
import type { TRawPortableTextMarkDef } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { TRawSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { TRawSocialProfile } from '@blog/service/shared/transformers/social-profile/to-social-profile';
import { mockLocalizedEntry } from '@blog/service/testing/shared/localized';
import type { InferFragmentType } from 'groqd';

type TRawPostLink = InferFragmentType<typeof postLinkFragment>;
type TRawBodyImageBlock = Extract<
  TRawPortableTextBody[number],
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE }
>;

export const MOCK_MISSING_ID = 'missing';
export const MOCK_POST_ID = 'post-1';
export const MOCK_POST_HREF = '/blog/hello-world';
export const MOCK_POST_TITLE = 'Hello World';
export const MOCK_POST_SLUG = 'hello-world';
export const MOCK_POST_EXCERPT = 'A sufficiently long excerpt for the card.';
export const MOCK_POST_PUBLISHED_AT = '2026-01-15T00:00:00Z';
export const MOCK_LINK_LABEL = 'Learn more';
export const MOCK_EXTERNAL_URL = 'https://example.com';
export const MOCK_IMAGE_ALT = 'Alt text';
export const MOCK_IMAGE_ASSET_ID = 'image-abc123-800x600-jpg';
export const MOCK_BIO_BLOCK_KEY = 'bio-block-1';
export const MOCK_BODY_IMAGE_KEY = 'body-image-1';

const IMAGE_LQIP = 'data:image/png;base64,abc123';

function mockImageDimensions() {
  return { width: 800, height: 600, aspectRatio: 1.333 };
}

export function mockReference(id: string, fields: { _key?: string } = {}) {
  return { _type: 'reference', _ref: id, ...fields };
}

export function mockTranslationLink(language: string, id: string) {
  return mockLocalizedEntry(language, mockReference(id));
}

export function mockRawExternalLinkDocument(
  overrides: Partial<TRawLinkDocument> = {},
): TRawLinkDocument {
  return {
    label: MOCK_LINK_LABEL,
    linkType: LINK_TYPE.EXTERNAL,
    url: MOCK_EXTERNAL_URL,
    internalReference: null,
    openInNewTab: null,
    ...overrides,
  };
}

export function mockRawInternalLinkDocument(
  overrides: Partial<TRawLinkDocument> = {},
): TRawLinkDocument {
  return {
    label: MOCK_LINK_LABEL,
    linkType: LINK_TYPE.INTERNAL,
    internalReference: null,
    url: null,
    openInNewTab: null,
    ...overrides,
  };
}

export function mockRawPortableTextMarkDef(
  overrides: Partial<TRawPortableTextMarkDef> = {},
): TRawPortableTextMarkDef {
  return {
    _key: 'mark-1',
    _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
    link: mockRawExternalLinkDocument(),
    ...overrides,
  };
}

type TRawPersonBioBlock = NonNullable<TRawPersonProfile['bio']>[number];

export function mockRawParagraphTextBlock<
  T extends { _type: 'block'; _key: string },
>(overrides: Partial<T> & { text?: string } = {}): T {
  const { text = 'Hi.', ...rest } = overrides;

  return {
    _type: 'block',
    _key: 'block-1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'span-1', text }],
    markDefs: null,
    ...rest,
  } as unknown as T;
}

export function mockRawPersonBioBlock(
  overrides: Partial<TRawPersonBioBlock> & { text?: string } = {},
): TRawPersonBioBlock {
  return mockRawParagraphTextBlock<TRawPersonBioBlock>(overrides);
}

export function mockRawHeadingBlock(
  heading: string,
  overrides: Partial<Omit<TRawHeadingBlock, 'heading'>> = {},
): TRawHeadingBlock {
  return {
    heading,
    supportingText: null,
    ...overrides,
  };
}

export function mockRawPostLink(
  overrides: Partial<TRawPostLink> = {},
): TRawPostLink {
  return {
    _id: MOCK_POST_ID,
    headingBlock: { heading: MOCK_POST_TITLE },
    slug: MOCK_POST_SLUG,
    ...overrides,
  };
}

export function mockRawSeo(overrides: Partial<TRawSeo> = {}): TRawSeo {
  return {
    metaTitle: 'A sufficiently descriptive meta title for testing',
    metaDescription: null,
    openGraph: null,
    ...overrides,
  };
}

export function mockRawSocialProfile(
  overrides: Partial<TRawSocialProfile> = {},
): TRawSocialProfile {
  return {
    platform: SOCIAL_PLATFORMS.GITHUB,
    link: mockRawExternalLinkDocument({ url: 'https://github.com/janedoe' }),
    ...overrides,
  };
}

export function mockLinkView(overrides: Partial<ILink> = {}): ILink {
  return {
    label: MOCK_LINK_LABEL,
    href: MOCK_EXTERNAL_URL,
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
    ...overrides,
  };
}

export function mockRawSanityImage(alt = MOCK_IMAGE_ALT): TRawSanityImage {
  return {
    alt,
    hotspot: null,
    crop: null,
    asset: {
      _id: MOCK_IMAGE_ASSET_ID,
      metadata: { lqip: IMAGE_LQIP, dimensions: mockImageDimensions() },
    },
  };
}

export function mockSanityImageView(alt = MOCK_IMAGE_ALT): ISanityImage {
  return {
    assetId: MOCK_IMAGE_ASSET_ID,
    alt,
    hotspot: undefined,
    crop: undefined,
    lqip: IMAGE_LQIP,
    dimensions: mockImageDimensions(),
  };
}

export function mockRawBodyImageBlock(
  overrides: Partial<TRawBodyImageBlock> = {},
): TRawBodyImageBlock {
  return {
    _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
    _key: MOCK_BODY_IMAGE_KEY,
    ...mockRawSanityImage(),
    layout: IMAGE_LAYOUT.FULL_BLEED,
    ...overrides,
  };
}

export function mockRawWideLayout(
  overrides: Partial<TRawWideLayout> = {},
): TRawWideLayout {
  return {
    spacingTop: SPACING_SCALE.MD,
    spacingBottom: SPACING_SCALE.MD,
    containerWidth: CONTAINER_WIDTH.WIDE,
    dividerTop: true,
    dividerBottom: true,
    ...overrides,
  };
}

export function mockRawHeroLayout(
  overrides: Partial<TRawHeroLayout> = {},
): TRawHeroLayout {
  return {
    spacingTop: SPACING_SCALE.LG,
    spacingBottom: SPACING_SCALE.SM,
    dividerTop: true,
    dividerBottom: false,
    ...overrides,
  };
}

export function mockValidationError(): Error {
  return new Error('ValidationError');
}
