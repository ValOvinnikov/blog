import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { service } from '@blog/service';
import { Heading } from '@blog/ui/atoms';
import { PostsSection } from '@blog/ui/organisms';
import { SmartLink } from '@web/components/shared/smart-link';
import { auth } from '@web/server/auth/auth';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { bookmarksPageVariants } from './bookmarks-page-variants';

const s = bookmarksPageVariants();

/**
 * BookmarksPage — `/bookmarks` composition (#1043/#1109): auth-gated (a
 * signed-out reader is redirected home — this app has no dedicated `/login`
 * route, same stance `auth.ts`'s OAuth-error redirect already takes),
 * reached from `AccountMenu`'s "My bookmarks" item. Lists the session's
 * saved posts through the same `PostsSection`/`PostCard` grid every other
 * archive page uses — no new page primitive.
 *
 * `@blog/db`'s `bookmarks` table only stores each saved post's Sanity `_id`
 * (`queries.bookmarks.listBookmarks`, most-recently-bookmarked first), so
 * those ids are resolved into `TPostCard` data via
 * `service.entities.posts.v1.getPostsByIds`. That query doesn't preserve
 * input order, so the resolved posts are re-sorted back into bookmark-
 * recency order before rendering.
 */
export async function BookmarksPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(routes.home());
  }

  const [bookmarks, t] = await Promise.all([
    queries.bookmarks.listBookmarks(userId),
    getTranslations('bookmarksPage'),
  ]);

  const bookmarkOrder = bookmarks.map((bookmark) => bookmark.postId);

  const result = await service.entities.posts.v1.getPostsByIds(bookmarkOrder);

  if (!result.ok) {
    console.error(`Failed to resolve bookmarked posts: ${result.error}`);
    return null;
  }

  const postsById = new Map(result.data.map((post) => [post.id, post]));
  const orderedPosts = bookmarkOrder
    .map((postId) => postsById.get(postId))
    .filter((post) => post !== undefined);

  const items = await toPostListItems(orderedPosts);

  return (
    <main className={s.root()}>
      <Heading level={1} className={s.heading()}>
        {t('title')}
      </Heading>
      <PostsSection
        posts={items}
        title={t('sectionTitle')}
        titleId="bookmarks-posts-title"
        linkAs={SmartLink}
        emptyMessage={t('empty')}
      />
    </main>
  );
}
