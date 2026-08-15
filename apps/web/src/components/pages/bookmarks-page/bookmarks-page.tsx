import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { service } from '@blog/service';
import { Heading, Text } from '@blog/ui/atoms';
import { WindowChrome } from '@blog/ui/molecules';
import { BookmarksList, type IBookmarkRow } from '@blog/ui/organisms';
import { SmartLink } from '@web/components/shared/smart-link';
import { auth } from '@web/server/auth/auth';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { getChromeOn } from '@web/utils/get-chrome-on';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';
import { redirect } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { bookmarksPageVariants } from './bookmarks-page-variants';

const s = bookmarksPageVariants();

/**
 * BookmarksPage — `/bookmarks` composition (#1043/#1109): auth-gated (a
 * signed-out reader is redirected home — this app has no dedicated `/login`
 * route, same stance `auth.ts`'s OAuth-error redirect already takes),
 * reached from `AccountMenu`'s "My bookmarks" item. Renders as a terminal
 * directory listing (`WindowChrome` + `BookmarksList`, `$ ls ~/bookmarks -l`)
 * per the engagement-UI design's corrected Feature 4 when `chromeOn` is true
 * — not the `PostsSection`/`PostCard` grid every archive page uses;
 * bookmarks are the one listing styled as `ls -l` output instead of cards.
 * Renders a plain list of title links instead when `chromeOn` is false.
 *
 * `@blog/db`'s `bookmarks` table only stores each saved post's Sanity `_id`
 * (`queries.bookmarks.listBookmarks`, most-recently-bookmarked first), so
 * those ids are resolved into `TPostCard` data via
 * `service.entities.posts.v1.getPostsByIds`. That query doesn't preserve
 * input order, so the resolved posts are re-sorted back into bookmark-
 * recency order before rendering. `hint` reports the count of rows actually
 * rendered (post ids that failed to resolve — e.g. deleted/unpublished posts
 * — are silently dropped above), not the raw bookmark-row count, so it never
 * overstates what's on screen.
 */
export async function BookmarksPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(routes.home());
  }

  const tenantId = await getRequestTenantId();
  if (!tenantId) {
    redirect(routes.home());
  }

  const [bookmarks, t, format, chromeOn] = await Promise.all([
    queries.bookmarks.listBookmarks(tenantId, userId),
    getTranslations('bookmarksPage'),
    getFormatter(),
    getChromeOn(),
  ]);
  const plain = !chromeOn;

  const bookmarkOrder = bookmarks.map((bookmark) => bookmark.postId);

  const tenant = await getTenantSanityContext();
  const result = await service.entities.posts.v1.getPostsByIds(
    bookmarkOrder,
    tenant,
  );

  if (!result.ok) {
    console.error(
      `Failed to resolve bookmarked posts: ${sanitizeLogMessage(result.error)}`,
    );
    return null;
  }

  const postsById = new Map(result.data.map((post) => [post.id, post]));
  const orderedPosts = bookmarkOrder
    .map((postId) => postsById.get(postId))
    .filter((post) => post !== undefined);

  const formattedDates = new Map(
    orderedPosts.map((post) => [
      post.id,
      format.dateTime(new Date(post.publishedAt), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    ]),
  );

  const rows: IBookmarkRow[] = orderedPosts.map((post) => ({
    id: post.id,
    formattedDate: formattedDates.get(post.id) ?? '',
    filename: `${post.slug}.md`,
    href: routes.post(post.slug),
  }));

  const plainContent =
    orderedPosts.length === 0 ? (
      <Text>{t('empty')}</Text>
    ) : (
      <>
        <ul role="list" className={s.plainList()}>
          {orderedPosts.map((post) => (
            <li key={post.id} className={s.plainRow()}>
              <SmartLink
                href={routes.post(post.slug)}
                className={s.plainLink()}
              >
                {post.title}
              </SmartLink>
              <span className={s.plainDate()}>
                {formattedDates.get(post.id)}
              </span>
            </li>
          ))}
        </ul>
        <Text className={s.plainHint()}>
          {t('hint', { count: orderedPosts.length })}
        </Text>
      </>
    );

  return (
    <main className={s.root()}>
      <Heading level={1} visual="section" className={s.heading()}>
        {t('title')}
      </Heading>
      {plain ? (
        <div className={s.plainRoot()}>{plainContent}</div>
      ) : (
        <WindowChrome className={s.chrome()}>
          <WindowChrome.Bar>
            <WindowChrome.Prompt>{t('promptSymbol')}</WindowChrome.Prompt>{' '}
            {t('promptCommand')}{' '}
            <WindowChrome.User>{t('promptFlag')}</WindowChrome.User>
          </WindowChrome.Bar>
          <WindowChrome.Body>
            <BookmarksList
              rows={rows}
              emptyMessage={t('empty')}
              hint={
                rows.length > 0 ? t('hint', { count: rows.length }) : undefined
              }
              prefix={
                <span
                  aria-hidden="true"
                  data-testid="bookmarks-list-row-prefix"
                  className={s.prefix()}
                >
                  drwx
                </span>
              }
              linkAs={SmartLink}
            />
          </WindowChrome.Body>
        </WindowChrome>
      )}
    </main>
  );
}
