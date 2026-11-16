import { getPostLatest } from '@shinefold/service/features/modules/post-latest/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createPostLatestModuleService() {
  return {
    v1: {
      getPostLatest: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getPostLatest(id, tenant),
      ),
    },
  };
}
