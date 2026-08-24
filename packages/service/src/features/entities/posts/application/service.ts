import { getAllPublishedPosts } from '@blog/service/features/entities/posts/adaptor/all-published.loader';
import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/loader';
import { getPublishedPostsByTag } from '@blog/service/features/entities/posts/adaptor/tag-scoped-published.loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createPostsService() {
  return {
    v1: {
      getPostsByIds: safeAsync((ids: string[], tenant?: TTenantSanityContext) =>
        getPostsByIds(ids, tenant),
      ),
      getAllPublishedPosts: safeAsync(() => getAllPublishedPosts()),
      getPublishedPostsByTag: safeAsync((tagId: string) =>
        getPublishedPostsByTag(tagId),
      ),
    },
  };
}
