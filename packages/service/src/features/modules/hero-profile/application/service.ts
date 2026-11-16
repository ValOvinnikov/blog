import { getHeroProfile } from '@shinefold/service/features/modules/hero-profile/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createHeroProfileModuleService() {
  return {
    v1: {
      getHeroProfile: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getHeroProfile(id, tenant),
      ),
    },
  };
}
