import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import { postListModulePaginatedPostsQuery } from './posts.query';
import { postListModuleQuery } from './query';
import { toPostListModule } from './transformer';
import type { TPostListModule } from './types';

export async function getPostList(
  id: string,
  page = 1,
  tenant: TTenantSanityContext,
): Promise<TPostListModule> {
  // Read the module document first so its `pageSize` can bound the posts
  // query in GROQ (avoids fetching the entire post collection to slice it in JS).
  const raw = await runQuery(postListModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:postList', `module:${id}`], tenant.projectId),
  });

  // `postCardFragment` derefs `author`/`topic` — both tags must ride
  // alongside `posts` (tag-scope contract, `sanity/query.ts`). The query
  // also reads `page_tag`/`page_topic` to correlate posts to a tag/topic
  // page's own tag/topic when this module is used as one, so `page_tag`/
  // `page_topic` (and, mirroring `tagPaginationParamsQuery`'s/
  // `topicPaginationParamsQuery`'s own ISR lists, `tag`/`topic`) ride along
  // too.
  const rawPosts = await runQuery(
    postListModulePaginatedPostsQuery(page, raw.pageSize),
    {
      parameters: { id },
      tenant,
      ...isr(
        ['posts', 'author', 'topic', 'page_tag', 'tag', 'page_topic'],
        tenant.projectId,
      ),
    },
  );

  return toPostListModule(
    raw,
    rawPosts.posts,
    {
      currentPage: page,
      totalPages: toTotalPages(rawPosts.total, raw.pageSize),
    },
    tenant,
  );
}
