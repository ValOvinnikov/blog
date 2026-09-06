import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { service } from '@blog/service';
import { auth } from '@web/server/auth/auth';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { redirect } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { BookmarksPageView, type IBookmarkedPost } from './bookmarks-page-view';

/**
 * `/bookmarks` composition: auth-gated (a signed-out reader is redirected
 * home; this app has no dedicated `/login` route), reached from
 * `AccountMenu`'s "My bookmarks" item.
 *
 * `@blog/db`'s `bookmarks` table only stores each saved post's Sanity `_id`,
 * so those ids are resolved into post data via
 * `service.entities.posts.v1.getPostsByIds`, which doesn't preserve input
 * order — the resolved posts are re-sorted back into bookmark-recency order
 * before rendering. The resolved, post-joined list is then handed to
 * `BookmarksPageView`, which has no knowledge of auth, tenant, or the db
 * layer.
 */
export const BookmarksPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(routes.home());
  }

  const tenantId = await getRequestTenantId();
  if (!tenantId) {
    redirect(routes.home());
  }

  const [bookmarks, t, format, tenant] = await Promise.all([
    queries.bookmarks.listBookmarks(tenantId, userId),
    getTranslations('bookmarksPage'),
    getFormatter(),
    getTenantSanityContext(),
  ]);

  const bookmarkOrder = bookmarks.map((bookmark) => bookmark.postId);

  const result = await service.entities.posts.v1.getPostsByIds(
    bookmarkOrder,
    tenant,
  );

  if (!result.ok) {
    logger.error('bookmarks_page.posts_resolve_failed', {
      error: result.error,
    });
    return null;
  }

  const postsById = new Map(result.data.map((post) => [post.id, post]));
  const orderedPosts = bookmarkOrder
    .map((postId) => postsById.get(postId))
    .filter((post) => post !== undefined);

  const posts: IBookmarkedPost[] = orderedPosts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    href: routes.post(post.slug),
    filename: `${post.slug}.md`,
    formattedDate: format.dateTime(new Date(post.publishedAt), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }));

  return (
    <BookmarksPageView
      heading={t('title')}
      posts={posts}
      emptyMessage={t('empty')}
      hint={posts.length > 0 ? t('hint', { count: posts.length }) : undefined}
    />
  );
};
