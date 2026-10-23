import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import type { TTagDetailPage } from '@blog/service';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

type TTagDetailPageTag = TTagDetailPage['tag'];

export const makeTag = (
  overrides: Partial<TTagDetailPageTag> = {},
): TTagDetailPageTag => {
  return {
    id: 'tag-1',
    title: 'TypeScript',
    slug: 'typescript',
    description: 'Posts about TypeScript.',
    ...overrides,
  };
};

export const makeTagDetailPage = (
  overrides: Partial<TTagDetailPage> = {},
): TTagDetailPage => {
  const tag = makeTag();

  return {
    tag,
    headingAlignment: CONTENT_ALIGNMENT.LEFT,
    headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
    hero: undefined,
    modules: [],
    faqs: [],
    seo: mockSeo({
      title: tag.title,
      description: tag.description,
      ogTitle: tag.title,
      ogDescription: tag.description,
    }),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: 'typescript' }],
    ...overrides,
  };
};
