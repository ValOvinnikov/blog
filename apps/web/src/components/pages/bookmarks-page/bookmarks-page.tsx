import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { service } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { auth } from '@web/server/auth/auth';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { redirect } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { BookmarksPageView, type IBookmarkedPost } from './bookmarks-page-view';

export const BookmarksPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(routes.home());
  }

  const {
    tenantId,
    sanityContext,
    defaultLocale = routing.defaultLocale,
  } = await getRequestContext();
  if (!tenantId) {
    redirect(routes.home());
  }

  const [bookmarks, t, format] = await Promise.all([
    queries.bookmarks.listBookmarks(tenantId, userId),
    getTranslations('bookmarksPage'),
    getFormatter(),
  ]);

  const bookmarkOrder = bookmarks.map((bookmark) => bookmark.postId);

  const result = await service.entities.posts.v1.getPostsByIds(
    bookmarkOrder,
    sanityContext,
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
    href: toLocalizedPathname({
      href: routes.post(post.slug),
      locale: post.language,
      defaultLocale,
    }),
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
      listHeading={t('listHeading')}
      posts={posts}
      emptyMessage={t('empty')}
      hint={posts.length > 0 ? t('hint', { count: posts.length }) : undefined}
    />
  );
};
