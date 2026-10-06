import { getChildPagesModule } from '@blog/service/features/modules/child-pages/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createChildPagesModuleService() {
  return {
    v1: {
      getChildPagesModule: safeAsync(
        (id: string, parentPath: string, tenant: TTenantSanityContext) =>
          getChildPagesModule(id, parentPath, tenant),
      ),
    },
  };
}
