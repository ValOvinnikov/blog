import { getHeroBlog } from '@shinefold/service/features/modules/hero-blog/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createHeroBlogModuleService() {
  return {
    v1: {
      getHeroBlog: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getHeroBlog(id, tenant),
      ),
    },
  };
}
