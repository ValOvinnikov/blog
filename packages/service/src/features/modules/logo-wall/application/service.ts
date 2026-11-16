import { getLogoWallModule } from '@shinefold/service/features/modules/logo-wall/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createLogoWallModuleService() {
  return {
    v1: {
      getLogoWallModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getLogoWallModule(id, tenant),
      ),
    },
  };
}
