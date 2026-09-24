import { getReferencingModuleIds } from '@blog/service/features/entities/modules/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createModulesService() {
  return {
    v1: {
      getReferencingModuleIds: safeAsync(
        (documentId: string, tenant: TTenantSanityContext) =>
          getReferencingModuleIds(documentId, tenant),
      ),
    },
  };
}
