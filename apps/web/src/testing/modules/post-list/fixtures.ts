import type { IMediaCardData } from '@web/components/shared/media-card-item';

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
