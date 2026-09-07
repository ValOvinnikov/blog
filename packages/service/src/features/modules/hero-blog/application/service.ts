import { getHeroBlog } from '@blog/service/features/modules/hero-blog/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createHeroBlogModuleService() {
  return {
    v1: {
      getHeroBlog: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getHeroBlog(id, tenant),
      ),
    },
  };
}
