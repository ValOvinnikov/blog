import { getPostList } from '@blog/service/features/modules/post-list/adaptor/loader';
import type { TPostListScope } from '@blog/service/features/modules/post-list/adaptor/posts.query';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

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
