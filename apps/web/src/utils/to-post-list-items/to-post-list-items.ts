import { routes } from '@blog/config';
import type { TPostCardCategory } from '@blog/service';
import type { IPostCardData } from '@blog/ui/organisms';
import { getFormatter } from 'next-intl/server';

/**
 * Structural source shape accepted by `toPostListItems` — satisfied by both
 * `TPostCard` (post detail's related posts, the post-list module) and the
 * leaner `TArchivePostCard` (blog/category/tag/author archive pages).
 */
type TPostListItemSource = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: TPostCardCategory;
  readingTimeMinutes: number;
};

/**
 * toPostListItems — maps service post-card view-models to the `IPostCardData`
 * shape `PostsSection` renders, resolving the two presentation concerns the
 * (React-free, locale-agnostic) service layer deliberately doesn't own: the
 * post detail route (`routes.post`) and the formatted date, via next-intl's
 * `getFormatter` (async — this is a plain helper, not a component, so the
 * `useFormatter` hook isn't an option). `getFormatter` reads locale/timeZone
 * from the current request's config (`i18n/request.ts`) automatically, so no
 * `locale` argument is threaded through here or by callers.
 */
export const toPostListItems = async (
  posts: readonly TPostListItemSource[],
): Promise<IPostCardData[]> => {
  const format = await getFormatter();

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
    readingTime: `${post.readingTimeMinutes} min`,
    category: post.category,
  }));
};
