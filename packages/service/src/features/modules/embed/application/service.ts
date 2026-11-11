import { getEmbedModule } from '@blog/service/features/modules/embed/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createEmbedModuleService() {
  return {
    v1: {
      getEmbedModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getEmbedModule(id, tenant),
      ),
    },
  };
}
