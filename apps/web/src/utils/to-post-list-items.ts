import { routes } from '@blog/config';
import type { TPostCardCategory } from '@blog/service';
import type { IPostCardData } from '@blog/ui/organisms';
import { formatDate } from '@web/utils/format-date';

/**
 * Structural source shape accepted by `toPostListItems` — satisfied by both
 * `TPostCard` (post detail's related posts, the post-list module) and the
 * leaner `TArchivePostCard` (blog/category/tag/author archive pages), which
 * additionally carries `readingTimeMinutes`. Declaring it optional here lets
 * either post-card type flow through the same mapper without a union.
 */
type TPostListItemSource = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  categories: TPostCardCategory[];
  readingTimeMinutes?: number;
};

/**
 * toPostListItems — maps service post-card view-models to the `IPostCardData`
 * shape `PostsSection` renders, resolving the two presentation/i18n concerns
 * the (React-free, locale-agnostic) service layer deliberately doesn't own:
 * the post detail route (`routes.post`) and the locale-formatted date.
 */
export const toPostListItems = (
  posts: readonly TPostListItemSource[],
  locale: string,
): IPostCardData[] =>
  posts.map((post) => ({
    id: post.id,
    href: routes.post(post.slug),
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    formattedDate: formatDate(post.publishedAt, locale),
    readingTime:
      post.readingTimeMinutes === undefined
        ? undefined
        : `${post.readingTimeMinutes} min`,
    categories: post.categories,
  }));
