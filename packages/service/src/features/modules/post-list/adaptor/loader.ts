import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { toTotalPages } from '@blog/utils';

import {
  postListModulePaginatedPostsQuery,
  type TPostListScope,
} from './posts.query';
import { postListModuleQuery } from './query';
import { toPostListModule } from './transformer';
import type { TPostListModule } from './types';

export async function getPostList(
  id: string,
  page = 1,
  tenant: TTenantSanityContext,
  scope?: TPostListScope,
): Promise<TPostListModule> {
  // Read the module document first so its `pageSize` can bound the posts
  // query in GROQ (avoids fetching the entire post collection to slice it in JS).
  const raw = await runQuery(postListModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:postList', `module:${id}`], tenant.projectId),
  });

  // `postCardFragment` derefs `author`/`topic` — both tags must ride
  // alongside `posts` (tag-scope contract, `sanity/query.ts`); `tag` rides
  // along too since a scoped call reads a `blog_tag`/`blog_topic` document.
  const rawPosts = await runQuery(
    postListModulePaginatedPostsQuery(page, raw.pageSize, scope),
    {
      parameters: scope ? { scopeSlug: scope.slug } : {},
      tenant,
      ...isr(['posts', 'author', 'topic', 'tag'], tenant.projectId),
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
