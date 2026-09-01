import { getPostLatest } from '@blog/service/features/modules/post-latest/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createPostLatestModuleService() {
  return {
    v1: {
      getPostLatest: safeAsync((id: string, tenant?: TTenantSanityContext) =>
        getPostLatest(id, tenant),
      ),
    },
  };
}
