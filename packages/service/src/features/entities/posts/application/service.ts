import { getAllPublishedPosts } from '@blog/service/features/entities/posts/adaptor/all-published/loader';
import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/get-by-ids/loader';
import { getPostPublishedAt } from '@blog/service/features/entities/posts/adaptor/get-published-at/loader';
import { getPublishedPostsByTag } from '@blog/service/features/entities/posts/adaptor/tag-scoped-published/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createPostsService() {
  return {
    v1: {
      getPostsByIds: safeAsync((ids: string[], tenant: TTenantSanityContext) =>
        getPostsByIds(ids, tenant),
      ),
      getPostPublishedAt: safeAsync(
        (id: string, tenant: TTenantSanityContext) =>
          getPostPublishedAt(id, tenant),
      ),
      getAllPublishedPosts: safeAsync((tenant: TTenantSanityContext) =>
        getAllPublishedPosts(tenant),
      ),
      getPublishedPostsByTag: safeAsync(
        (tagId: string, tenant: TTenantSanityContext) =>
          getPublishedPostsByTag(tagId, tenant),
      ),
    },
  };
}
