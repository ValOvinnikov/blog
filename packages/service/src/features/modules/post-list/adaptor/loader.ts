import { isr, runQuery } from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { postListModulePaginatedPostsQuery } from './posts.query';
import { postListModuleQuery } from './query';
import { toPostListModule } from './transformer';
import type { TPostListModule } from './types';

export async function getPostList(
  id: string,
  page = 1,
): Promise<TPostListModule> {
  // Read the module document first so its `pageSize` can bound the posts
  // query in GROQ (avoids fetching the entire post collection to slice it in JS).
  const raw = await runQuery(postListModuleQuery, {
    parameters: { id },
    ...isr(['modules:postList', `module:${id}`]),
  });

  // `postCardFragment` derefs `author`/`topic` — both tags must ride
  // alongside `posts` (tag-scope contract, `sanity/query.ts`). The query
  // also reads `page_tag` to correlate posts to a tag page's own tag when
  // this module is used as one, so `page_tag` (and, mirroring
  // `tagPaginationParamsQuery`'s own ISR list, `tag`) rides along too.
  const rawPosts = await runQuery(
    postListModulePaginatedPostsQuery(id, page, raw.pageSize),
    {
      parameters: { id },
      ...isr(['posts', 'author', 'topic', 'page_tag', 'tag']),
    },
  );

  return toPostListModule(raw, rawPosts.posts, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, raw.pageSize),
  });
}
