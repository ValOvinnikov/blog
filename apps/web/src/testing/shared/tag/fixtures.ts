import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import type { TTagDetailPage } from '@blog/service';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

export const MOCK_TAG_SLUG = 'typescript';

type TTagDetailPageTag = TTagDetailPage['tag'];

export const mockTag = (
  overrides: Partial<TTagDetailPageTag> = {},
): TTagDetailPageTag => {
  return {
    id: 'tag-1',
    title: 'TypeScript',
    slug: MOCK_TAG_SLUG,
    description: 'Posts about TypeScript.',
    ...overrides,
  };
};

export const mockTagDetailPage = (
  overrides: Partial<TTagDetailPage> = {},
): TTagDetailPage => {
  const tag = mockTag();

  return {
    tag,
    headingAlignment: CONTENT_ALIGNMENT.LEFT,
    headingBlock: mockHeadingBlock({ heading: 'TypeScript' }),
    hero: undefined,
    modules: [],
    faqs: [],
    seo: mockSeo({
      title: tag.title,
      description: tag.description,
      ogTitle: tag.title,
      ogDescription: tag.description,
    }),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: MOCK_TAG_SLUG }],
    ...overrides,
  };
};
