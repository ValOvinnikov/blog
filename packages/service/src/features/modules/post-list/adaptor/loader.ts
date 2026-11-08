import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';
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
  const raw = await runQuery(postListModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:postList', `module:${id}`], tenant.projectId),
  });

  const rawPosts = await runQuery(
    postListModulePaginatedPostsQuery(page, raw.pageSize, scope),
    {
      parameters: scope ? { termId: scope.termId } : {},
      tenant,
      ...isr(
        ['posts', 'author', 'topic', 'tag', ...LINK_TARGET_CACHE_TAGS],
        tenant.projectId,
      ),
    },
  );

  return toPostListModule(raw, rawPosts.posts, {
    currentPage: page,
    totalPages: toTotalPages(rawPosts.total, raw.pageSize),
  });
}
