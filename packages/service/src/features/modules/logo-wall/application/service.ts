import { getLogoWallModule } from '@blog/service/features/modules/logo-wall/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createLogoWallModuleService() {
  return {
    v1: {
      getLogoWallModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getLogoWallModule(id, tenant),
      ),
    },
  };
}
