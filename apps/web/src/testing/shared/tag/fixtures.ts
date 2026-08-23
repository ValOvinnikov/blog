import type { TTagDetailPage } from '@blog/service';

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
    modules: [],
    seo: {
      title: 'TypeScript',
      description: 'Posts about TypeScript.',
      ogTitle: 'TypeScript',
      ogDescription: 'Posts about TypeScript.',
      ogImageUrl: undefined,
    },
    postListId: 'post-list-1',
    ...overrides,
  };
};
