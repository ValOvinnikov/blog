import { getHeroProfile } from '@blog/service/features/modules/hero-profile/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createHeroProfileModuleService() {
  return {
    v1: {
      getHeroProfile: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getHeroProfile(id, tenant),
      ),
    },
  };
}
