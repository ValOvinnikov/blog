import { getPostFeatured } from '@shinefold/service/features/modules/post-featured/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createPostFeaturedModuleService() {
  return {
    v1: {
      getPostFeatured: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getPostFeatured(id, tenant),
      ),
    },
  };
}
