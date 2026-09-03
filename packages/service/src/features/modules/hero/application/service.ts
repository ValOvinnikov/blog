import { getHero } from '@blog/service/features/modules/hero/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createHeroModuleService() {
  return {
    v1: {
      getHero: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getHero(id, tenant),
      ),
    },
  };
}
