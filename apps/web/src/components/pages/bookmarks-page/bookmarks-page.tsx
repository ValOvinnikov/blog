import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { Heading } from '@blog/ui/atoms';
import { PostsSection } from '@blog/ui/organisms';
import { SmartLink } from '@web/components/shared/smart-link';
import { auth } from '@web/server/auth/auth';
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
 * **Known gap, flagged for `service`:** `@blog/db`'s `bookmarks` table only
 * stores each saved post's Sanity `_id`
 * (`queries.bookmarks.listBookmarks`) — turning those ids into the
 * `title`/`slug`/`excerpt`/hero-image `TPostCard` data `PostsSection` needs
 * requires a `@blog/service` query this package doesn't have yet. Every
 * existing post-list query filters by recency/category/tag/author
 * (`getIndexPage`, `getRelatedPosts`, `getPostList`) — none accepts an
 * explicit `_id` allow-list. Per this repo's layer contract that's a
 * `service`-layer addition (`web` doesn't write GROQ), so it's out of this
 * component's scope — reported back in #1109's findings rather than added
 * here. Until it lands, this renders the real "no bookmarks" empty state
 * only when the reader truly has none; a reader who *does* have bookmarks
 * sees an honest "saved, previews coming soon" message instead of an
 * incorrect empty state. The moment that service function exists, swap the
 * `posts={[]}` below for the resolved list — everything else here (the
 * auth gate, the `PostsSection` wiring, the true-empty copy) is already
 * correct as written.
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

  const hasBookmarks = bookmarks.length > 0;

  return (
    <main className={s.root()}>
      <Heading level={1} className={s.heading()}>
        {t('title')}
      </Heading>
      <PostsSection
        posts={[]}
        title={t('sectionTitle')}
        titleId="bookmarks-posts-title"
        linkAs={SmartLink}
        emptyMessage={
          hasBookmarks
            ? t('pendingPreviews', { count: bookmarks.length })
            : t('empty')
        }
      />
    </main>
  );
}
