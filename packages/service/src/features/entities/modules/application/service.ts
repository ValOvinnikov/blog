import { getReferencingModuleIds } from '@shinefold/service/features/entities/modules/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

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
