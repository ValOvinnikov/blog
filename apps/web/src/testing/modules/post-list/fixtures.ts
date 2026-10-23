import { BRAND_VARIANT } from '@blog/config';
import type { TPostListModule } from '@blog/service';
import type { IMediaCardData } from '@web/components/shared/media-card-item';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const MOCK_POST_LIST_HEADING = 'Latest posts';

export const mockPostListItem = (
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

type TPostModuleBase = Pick<
  TPostListModule,
  | 'brandVariant'
  | 'headingBlock'
  | 'posts'
  | 'layout'
  | 'contentAlignment'
  | 'showImages'
>;

export const mockPostModuleBase = (
  heading: string = MOCK_POST_LIST_HEADING,
): TPostModuleBase => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading }),
  posts: [],
  layout: undefined,
  contentAlignment: undefined,
  showImages: false,
});

export const mockPostListModuleData = (
  overrides: Partial<TPostListModule> = {},
): TPostListModule => ({
  ...mockPostModuleBase(),
  currentPage: 1,
  totalPages: 1,
  ...overrides,
});

export const MOCK_LEAD_POST_TITLE = 'Lead post';

export const MOCK_SECOND_POST_TITLE = 'Second post';

export const MOCK_THIRD_POST_TITLE = 'Third post';
