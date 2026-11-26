import { routes } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { service } from '@shinefold/service';
import { hasLength, isUndefined } from '@shinefold/utils/primitives';
import { VoiceRichText } from '@web/components/shared/voice-rich-text';
import { BOOKMARK_LOG } from '@web/constants/bookmark';
import { routing } from '@web/i18n/routing';
import { auth } from '@web/server/auth/auth';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
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

  const [bookmarks, t, format, emptyRich] = await Promise.all([
    queries.bookmarks.listBookmarks(tenantId, userId),
    getTranslations('bookmarksPage'),
    getFormatter(),
    getVoiceRich('bookmarksEmpty'),
  ]);

  const bookmarkOrder = bookmarks.map((bookmark) => bookmark.postId);

  const result = await service.entities.posts.v1.getPostsByIds(
    bookmarkOrder,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(BOOKMARK_LOG.PAGE_POSTS_RESOLVE_FAILED, {
      error: result.error,
    });
    return null;
  }

  const postsById = new Map(result.data.map((post) => [post.id, post]));
  const orderedPosts = bookmarkOrder
    .map((postId) => postsById.get(postId))
    .filter((post) => !isUndefined(post));

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
      emptyMessage={<VoiceRichText value={emptyRich} />}
      hint={hasLength(posts) ? t('hint', { count: posts.length }) : undefined}
    />
  );
};
