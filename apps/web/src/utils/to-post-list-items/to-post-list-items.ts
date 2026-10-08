import { routes } from '@blog/config';
import type { TPostCardTopic } from '@blog/service';
import type { IMediaCardData } from '@web/components/shared/media-card-item';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

type TPostListItemSource = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  topic: TPostCardTopic;
  readingTimeMinutes: number;
};

export const toPostListItems = async <T extends TPostListItemSource>(
  posts: readonly T[],
  renderImage?: (post: T) => ReactNode | undefined,
): Promise<IMediaCardData[]> => {
  const [format, postCardT] = await Promise.all([
    getFormatter(),
    getTranslations('postCard'),
  ]);

  return posts.map((post) => ({
    id: post.id,
    href: routes.post(post.slug),
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    formattedDate: format.dateTime(new Date(post.publishedAt), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    readingTime: postCardT('readingTime', { count: post.readingTimeMinutes }),
    topic: post.topic,
    image: renderImage?.(post),
  }));
};
