import { getPostList } from '@shinefold/service/features/modules/post-list/adaptor/loader';
import type { TPostListScope } from '@shinefold/service/features/modules/post-list/adaptor/posts.query';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createPostListModuleService() {
  return {
    v1: {
      getPostList: safeAsync(
        (
          id: string,
          tenant: TTenantSanityContext,
          page: number = 1,
          scope?: TPostListScope,
        ) => getPostList(id, page, tenant, scope),
      ),
    },
  };
}
