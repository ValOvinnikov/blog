import type { TTagDetailPage } from '@blog/service';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

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
  return {
    tag: makeTag(),
    headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
    hero: undefined,
    modules: [],
    seo: {
      title: 'TypeScript',
      description: 'Posts about TypeScript.',
      ogTitle: 'TypeScript',
      ogDescription: 'Posts about TypeScript.',
      ogImage: undefined,
    },
    ...overrides,
  };
};
