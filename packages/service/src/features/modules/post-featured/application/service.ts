import { getPostFeatured } from '@blog/service/features/modules/post-featured/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createPostFeaturedModuleService() {
  return {
    v1: {
      getPostFeatured: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getPostFeatured(id, tenant),
      ),
    },
  };
}
