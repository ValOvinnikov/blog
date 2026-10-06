import { BRAND_VARIANT } from '@blog/config';
import type { TPostListModule } from '@blog/service';
import type { IMediaCardData } from '@web/components/shared/media-card-item';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const makePostListItem = (
  overrides: Partial<IMediaCardData> = {},
): IMediaCardData => {
  return {
    id: 'post-1',
    href: '/blog/first-post',
    title: 'First post',
    excerpt: 'An excerpt',
    publishedAt: '2026-01-01T00:00:00.000Z',
    formattedDate: 'January 1, 2026',
    readingTime: '2 min',
    topic: { title: 'News' },
    ...overrides,
  };
};

export const makePostListModuleData = (
  overrides: Partial<TPostListModule> = {},
): TPostListModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Latest posts' }),
  posts: [],
  layout: undefined,
  contentAlignment: undefined,
  showImages: false,
  currentPage: 1,
  totalPages: 1,
  ...overrides,
});
