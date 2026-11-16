import { getEmbedModule } from '@shinefold/service/features/modules/embed/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createEmbedModuleService() {
  return {
    v1: {
      getEmbedModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getEmbedModule(id, tenant),
      ),
    },
  };
}
