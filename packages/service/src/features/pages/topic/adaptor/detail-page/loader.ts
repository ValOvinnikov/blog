import { isr, runQuery } from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { buildTopicPostsPageQuery } from './posts.query';
import { topicPageTopicQuery } from './topic.query';
import { toTopicPage } from './transformer';
import type { TTopicPage } from './types';

type TGetTopicPageArgs = {
  page?: number;
  itemsPerPage: number;
};

/**
 * Always windows, mirroring the blog index (`getIndexPage`) — `page`
 * defaults to 1 so the unnumbered `/topics/[slug]` route gets the same
 * sliced-query + pagination-metadata shape as `/topics/[slug]/page/[page]`
 * (pages ≥ 2). Topics have no CMS-authored page-size field like
 * `page_blog.itemsPerPage`, so `itemsPerPage` is always required — the
 * caller (`TOPIC_ITEMS_PER_PAGE` on the web side) decides the value.
 */
export async function getTopicPage(
  slug: string,
  { page = 1, itemsPerPage }: TGetTopicPageArgs,
): Promise<TTopicPage | null> {
  const start = (page - 1) * itemsPerPage;
  const [rawTopic, rawPosts] = await Promise.all([
    runQuery(topicPageTopicQuery, {
      parameters: { slug },
      ...isr('topic'),
    }),
    // `archivePostCardFragment` derefs `topic` — that tag must ride
    // alongside `posts` (tag-scope contract, `sanity/query.ts`).
    runQuery(buildTopicPostsPageQuery(start, start + itemsPerPage), {
      parameters: { slug },
      ...isr(['posts', 'topic']),
    }),
  ]);
  if (!rawTopic) return null;
  return toTopicPage(rawTopic, rawPosts.posts, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, itemsPerPage),
  });
}
