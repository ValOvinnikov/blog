import { getPostRelated } from '@blog/service/features/modules/post-related/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createPostRelatedModuleService() {
  return {
    v1: {
      getPostRelated: safeAsync(
        (id: string, postId: string, tenant: TTenantSanityContext) =>
          getPostRelated(id, postId, tenant),
      ),
    },
  };
}
