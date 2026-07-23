import { isr, runQuery } from '@blog/service/sanity/query';

import { buildAuthorPostsPageQuery } from './query';
import { toAuthorPosts, type TAuthorPosts } from './transformer';

type TGetAuthorPostsArgs = {
  page?: number;
  itemsPerPage: number;
};

/**
 * Always windows, mirroring the category posts window
 * (`buildCategoryPostsPageQuery`) — `page` defaults to 1 so callers get the
 * same sliced-query + total shape whether or not a page is given.
 */
export async function getAuthorPosts(
  slug: string,
  { page = 1, itemsPerPage }: TGetAuthorPostsArgs,
): Promise<TAuthorPosts> {
  const start = (page - 1) * itemsPerPage;
  const raw = await runQuery(
    buildAuthorPostsPageQuery(start, start + itemsPerPage),
    {
      parameters: { slug },
      ...isr('posts'),
    },
  );
  return toAuthorPosts(raw.posts, raw.total);
}
